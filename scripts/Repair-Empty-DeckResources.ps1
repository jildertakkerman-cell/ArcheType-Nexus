# Repair-Empty-DeckResources.ps1
# Repopulates the deck resources container if it was accidentally emptied

$pagesDir = "c:\Visual Studio Code\Apps\ArcheType-Nexus\pages"
$htmlFiles = Get-ChildItem -Path $pagesDir -Filter "*.html" -Recurse

$modified = 0

foreach ($file in $htmlFiles) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        # Pattern for the empty container
        # We look for the comment, the wrapper div, and an empty (or whitespace only) body
        $emptyPattern = '<!-- Deck Resources & Card Browser \(below banner\) -->\s*\r?\n\s*<div class="flex flex-col items-center gap-3 mb-10 md:mb-16">\s*\r?\n\s*</div>'
        
        $filledContent = @"
<!-- Deck Resources & Card Browser (below banner) -->
        <div class="flex flex-col items-center gap-3 mb-10 md:mb-16">
            <div id="deck-resources-compact"></div>
            <div id="archetype-cards-browser" class="flex justify-center"></div>
        </div>
"@
        
        if ($content -match '<!-- Deck Resources & Card Browser \(below banner\) -->\s*\r?\n\s*<div class="flex flex-col items-center gap-3 mb-10 md:mb-16">\s*\r?\n\s*</div>') {
            $content = $content -replace $emptyPattern, $filledContent
        }
        
        # Also fix cases where the div exists but might have lost one of its children
        if ($content -match '<!-- Deck Resources & Card Browser \(below banner\) -->') {
            if ($content -notmatch 'id="deck-resources-compact"') {
                # Add deck-resources-compact if missing inside the wrapper
                $wrapperPattern = '(<div class="flex flex-col items-center gap-3 mb-10 md:mb-16">)(\s*)'
                $content = $content -replace $wrapperPattern, "`$1`n            <div id=`"deck-resources-compact`"></div>`$2"
            }
            if ($content -notmatch 'id="archetype-cards-browser"') {
                # Add archetype-cards-browser if missing inside the wrapper
                # Assume it should go after deck-resources-compact if that exists, or first
                if ($content -match 'id="deck-resources-compact"') {
                    $content = $content -replace '(<div id="deck-resources-compact"></div>)', "`$1`n            <div id=`"archetype-cards-browser`" class=`"flex justify-center`"></div>"
                }
                else {
                    $wrapperPattern = '(<div class="flex flex-col items-center gap-3 mb-10 md:mb-16">)(\s*)'
                    $content = $content -replace $wrapperPattern, "`$1`n            <div id=`"archetype-cards-browser`" class=`"flex justify-center`"></div>`$2"
                }
            }
        }

        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "[REPAIRED] $($file.Name)" -ForegroundColor Green
            $modified++
        }
    }
    catch {
        Write-Host "[ERROR] $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host "Total Repaired: $modified" -ForegroundColor Cyan
