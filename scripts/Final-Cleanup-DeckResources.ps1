# Final-Cleanup-DeckResources.ps1
# Catches stragglers using the old function and ensures buttons are outside the header

$pagesDir = "c:\Visual Studio Code\Apps\ArcheType-Nexus\pages"
$htmlFiles = Get-ChildItem -Path $pagesDir -Filter "*.html" -Recurse

$modified = 0
$errors = 0

foreach ($file in $htmlFiles) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        # --- FIX 1: Convert old renderDeckSearchSection to renderDeckResourcesCompact ---
        if ($content -match 'CardLoader\.renderDeckSearchSection') {
            # Try to capture archetype name
            $archetype = "Unknown"
            if ($content -match "renderDeckSearchSection\s*\(\s*'[^']+'\s*,\s*'([^']+)'") {
                $archetype = $Matches[1]
            }
            elseif ($content -match "renderArchetypeCardsBrowser\s*\(\s*'[^']+'\s*,\s*'([^']+)'") {
                $archetype = $Matches[1]
            }

            if ($archetype -ne "Unknown") {
                # Replace the old call with the new one
                # Pattern handles optional 3rd argument (options object)
                $oldCallPattern = "(await\s+)?CardLoader\.renderDeckSearchSection\s*\(\s*'[^']+'\s*,\s*'[^']+'(?:\s*,\s*\{[^}]*\})?\s*\)\s*;"
                $newCall = "await CardLoader.renderDeckResourcesCompact('deck-resources-compact', '$archetype');"
                
                # We need to be careful if we are replacing inside the DOMContentLoaded event
                $content = $content -replace $oldCallPattern, $newCall
            }
        }

        # --- FIX 2: Ensure containers exist and are in the correct place (BELOW header) ---
        
        # Check if we have the containers at all
        $hasCompactDiv = $content -match 'id="deck-resources-compact"'
        
        # If we don't have the div, but have the old one at the bottom, we need to restructure
        if (-not $hasCompactDiv -and $content -match 'id="deck-resources-container"') {
            # Remove old bottom section
            $content = $content -replace '\s*<section[^>]*>\s*\r?\n\s*<div id="deck-resources-container"[^>]*>.*?</div>\s*\r?\n\s*</section>', ''
             
            # We need to insert the new structure below the header
            # This part requires finding the header end
             
            $newStructure = @"

        <!-- Deck Resources & Card Browser (below banner) -->
        <div class="flex flex-col items-center gap-3 mb-10 md:mb-16">
            <div id="deck-resources-compact"></div>
            <div id="archetype-cards-browser" class="flex justify-center"></div>
        </div>
"@
            if ($content -notmatch '<!-- Deck Resources & Card Browser \(below banner\) -->') {
                $content = $content -replace '(</header>)\s*\r?\n', "`$1`r`n$newStructure`r`n"
            }
        }

        # --- FIX 3: If div is INSIDE header, move it OUTSIDE ---
        if ($content -match '<header[^>]*>[\s\S]*?<div id="deck-resources-compact"') {
            # Remove from inside header
            $content = $content -replace '(\s*<!-- Compact deck resource buttons -->\s*\r?\n)?\s*<div id="deck-resources-compact"[^>]*></div>', ''
             
            # Remove archetype browser from inside header
            $content = $content -replace '\s*<div id="archetype-cards-browser"[^>]*>[\s\S]*?</div>', ''
             
            # Add outside if not present
            if ($content -notmatch '<!-- Deck Resources & Card Browser \(below banner\) -->') {
                $newStructure = @"

        <!-- Deck Resources & Card Browser (below banner) -->
        <div class="flex flex-col items-center gap-3 mb-10 md:mb-16">
            <div id="deck-resources-compact"></div>
            <div id="archetype-cards-browser" class="flex justify-center"></div>
        </div>
"@
                $content = $content -replace '(</header>)\s*\r?\n', "`$1`r`n$newStructure`r`n"
            }
             
            # Fix header margin
            $content = $content -replace 'class="banner-header text-center mb-10 md:mb-16"', 'class="banner-header text-center mb-6 md:mb-8"'
        }

        # --- FIX 4: Remove any duplicate or leftover deck-resources-container ---
        $content = $content -replace '<div id="deck-resources-container"></div>', ''

        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "[MODIFIED] $($file.Name)" -ForegroundColor Green
            $modified++
        }
    }
    catch {
        Write-Host "[ERROR] $($file.Name): $_" -ForegroundColor Red
        $errors++
    }
}

Write-Host "Total Modified: $modified" -ForegroundColor Cyan
