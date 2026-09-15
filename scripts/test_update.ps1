# Get files that have banlist-status but not renderDeckSearchSection (limit to first 5)
$files = Get-ChildItem "c:\Users\jilde\Documents\VSCode-Projects-main\Apps\ArcheType Nexus\*.html" | Where-Object { 
    $content = Get-Content $_.FullName -Raw
    $content -match 'id="banlist-status"' -and $content -notmatch 'renderDeckSearchSection'
} | Select-Object -First 5

Write-Host "Processing first 5 files: $($files.Count)"

foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)"
    $content = Get-Content $file.FullName -Raw
    
    # Extract archetype name from filename
    $baseName = $file.BaseName
    $archetypeName = $baseName -replace ' Deck Analysis$', '' -replace ' Archetype Breakdown$', '' -replace ' Deck$', ''
    
    # Find the banlist section and add deck search after it
    $lines = $content -split "`n"
    $banlistSectionEnd = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match 'id="banlist-status"') {
            # Find the end of this section
            $bracketCount = 0
            for ($j = $i; $j -lt $lines.Count; $j++) {
                if ($lines[$j] -match ''<section') { $bracketCount++ }
                if ($lines[$j] -match ''</section>') { 
                    $bracketCount--
                    if ($bracketCount -le 0) {
                        $banlistSectionEnd = $j
                        break
                    }
                }
            }
            if ($banlistSectionEnd -eq -1) {
                # If no section wrapper, find next section or closing div
                for ($j = $i; $j -lt $lines.Count; $j++) {
                    if ($lines[$j] -match ''</section>|<section|^\s*</div>\s*$' -and $j -gt $i) {
                        $banlistSectionEnd = $j - 1
                        break
                    }
                }
            }
            break
        }
    }
    
    if ($banlistSectionEnd -gt 0) {
        # Insert deck search section after banlist section
        $deckSearchSection = @"

        <!-- Deck Resources Section -->
        <section>
            <div id="deck-resources-container">
                <!-- Deck search section will be populated by CardLoader.renderDeckSearchSection -->
            </div>
        </section>
"@
        
        $lines[$banlistSectionEnd + 1] = $deckSearchSection + $lines[$banlistSectionEnd + 1]
        $content = $lines -join "`n"
        Write-Host "  Added deck search section at line $($banlistSectionEnd + 1)"
    } else {
        Write-Host "  Could not find banlist section end"
        continue
    }
    
    # Add renderDeckSearchSection call after renderBanlistSection
    $banlistPattern = '(await CardLoader\.renderBanlistSection[^}]+\}\);)'
    $deckSearchAddition = @"

            // Render deck search section
            await CardLoader.renderDeckSearchSection('deck-resources-container', '$archetypeName');
"@
    
    if ($content -match $banlistPattern) {
        $content = $content -replace $banlistPattern, "`$1$deckSearchAddition"
        Write-Host "  Added renderDeckSearchSection call"
    } else {
        Write-Host "  Could not find renderBanlistSection pattern"
    }
    
    # Fix script closure if needed
    if ($content -match "document\.addEventListener\('DOMContentLoaded', async \(\) => \{") {
        if ($content -notmatch "\}\);\s*</script>") {
            $content = $content -replace "(\}\);)\s*(</script>)", "`$1});`$2"
            Write-Host "  Fixed script closure"
        }
    }
    
    # Save the file
    $content | Set-Content $file.FullName -Encoding UTF8
    Write-Host "  Saved: $($file.Name)"
}
