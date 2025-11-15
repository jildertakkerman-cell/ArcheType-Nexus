# Get files that have banlist-status but not renderDeckSearchSection
$files = Get-ChildItem "c:\Users\jilde\Documents\VSCode-Projects-main\Apps\ArcheType Nexus\*.html" | Where-Object { 
    $content = Get-Content $_.FullName -Raw
    $content -match 'id="banlist-status"' -and $content -notmatch 'renderDeckSearchSection'
}

Write-Host "Found $($files.Count) files to update"

foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)"
    $content = Get-Content $file.FullName -Raw
    
    # Extract archetype name from filename
    $baseName = $file.BaseName
    $archetypeName = $baseName -replace ' Deck Analysis$', '' -replace ' Archetype Breakdown$', '' -replace ' Deck$', ''
    
    # Special cases
    if ($archetypeName -eq 'D_D') { $archetypeName = 'D.D.' }
    if ($archetypeName -eq 'Pot of Deck Analyis') { $archetypeName = 'Pot of Greed' }
    if ($archetypeName -eq 'Sylvan Deck Analyis') { $archetypeName = 'Sylvan' }
    if ($archetypeName -eq 'Mathmech Deck Analyis') { $archetypeName = 'Mathmech' }
    if ($archetypeName -eq 'Junk Deck Analyis') { $archetypeName = 'Junk' }
    if ($archetypeName -eq 'Tindangle Deck Analyis') { $archetypeName = 'Tindangle' }
    
    # Add deck search section after banlist section
    $pattern = '(<!-- TCG Banlist Impact Section -->\s*<section>\s*<div id="banlist-status"[^>]*>.*?</div>\s*</section>)'
    $replacement = @"
`$1

        <!-- Deck Resources Section -->
        <section>
            <div id="deck-resources-container">
                <!-- Deck search section will be populated by CardLoader.renderDeckSearchSection -->
            </div>
        </section>
"@
    
    if ($content -match $pattern) {
        $content = $content -replace $pattern, $replacement
        Write-Host "  Added deck search section"
    } else {
        Write-Host "  Could not find banlist section pattern"
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
