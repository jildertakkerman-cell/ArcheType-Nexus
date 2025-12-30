# Add Archetype Cards Browser button and script to all HTML pages in the pages directory

$pagesDir = "c:\Visual Studio Code\Apps\ArcheType-Nexus\pages"

$buttonHtml = '            <div id="archetype-cards-browser" class="mt-6 flex justify-center relative z-10">
                <!-- Button will be injected here -->
            </div>'

$modifiedCount = 0
$skippedCount = 0

Get-ChildItem -Path $pagesDir -Filter "*.html" | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content -Path $filePath -Raw
    
    $isModified = $false
    
    # 1. Inject HTML Container into Header
    if ($content -notmatch 'id="archetype-cards-browser"') {
        # Find closing header tag
        if ($content -match '</header>') {
            $content = $content -replace '</header>', "$buttonHtml`r`n        </header>"
            $isModified = $true
        }
    }

    # 2. Inject JS Call
    # Match existing renderDeckSearchSection call to get archetype name
    if ($content -match "CardLoader\.renderDeckSearchSection\('deck-resources-container',\s*'([^']+)'") {
        $archetypeName = $matches[1]
        
        # Check if browser render call already exists
        if ($content -notmatch "CardLoader\.renderArchetypeCardsBrowser") {
            $jsCall = "`r`n            // Render archetype cards browser (compact mode at top)`r`n            await CardLoader.renderArchetypeCardsBrowser('archetype-cards-browser', '$archetypeName', { `r`n                compact: true, `r`n                buttonText: 'View All Cards',`r`n                buttonColor: 'from-purple-600 to-indigo-600',`r`n                buttonHoverColor: 'from-purple-700 to-indigo-700'`r`n            });"
            
            # Insert after the deck search section call - handle both with and without {} arg
            # We use a broader regex for the replacement target
            $patternToReplace = "CardLoader\.renderDeckSearchSection\('deck-resources-container',\s*'$([regex]::Escape($archetypeName))'.*?\);"
            
            if ($content -match $patternToReplace) {
                $match = $matches[0]
                $content = $content.Replace($match, "$match$jsCall")
                $isModified = $true
            }
        }
    }

    if ($isModified) {
        Set-Content -Path $filePath -Value $content -NoNewline
        $modifiedCount++
        Write-Host "Modified: $($_.Name)"
    }
    else {
        $skippedCount++
        # Write-Host "Skipped: $($_.Name)"
    }
}

Write-Host "`nComplete! Modified $modifiedCount files. Skipped $skippedCount."
