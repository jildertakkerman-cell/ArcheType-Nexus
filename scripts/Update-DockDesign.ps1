# Update-DockDesign.ps1
# Updates the deck resources section to the new "Floating Dock" glassmorphism design.

$pagesDir = "c:\Visual Studio Code\Apps\ArcheType-Nexus\pages"
$htmlFiles = Get-ChildItem -Path $pagesDir -Filter "*.html" -Recurse

$modified = 0

foreach ($file in $htmlFiles) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        # Define the old structure pattern (from Move-ButtonsBelowBanner.ps1)
        # We look for the flex-col container
        $oldPattern = '<!-- Deck Resources & Card Browser \(below banner\) -->\s*\r?\n\s*<div class="flex flex-col items-center gap-3 mb-10 md:mb-16">\s*\r?\n\s*<div id="deck-resources-compact"(?:></div>| class="flex items-center"></div>)\s*\r?\n\s*<div id="archetype-cards-browser"[^>]*></div>\s*\r?\n\s*</div>'
        
        # New Dock Design Structure
        $newStructure = @"
<!-- Deck Resources & Card Browser (Dock Design) -->
        <div class="relative z-10 -mt-8 mb-12 mx-auto max-w-fit">
            <div class="flex flex-wrap items-center justify-center gap-4 p-3 rounded-2xl bg-[#0f172a]/80 backdrop-blur-md border border-indigo-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                <div id="deck-resources-compact" class="flex items-center"></div>
                
                <!-- Vertical Divider (Desktop) -->
                <div class="hidden md:block w-px h-6 bg-indigo-500/30 mx-1"></div>
                
                <div id="archetype-cards-browser" class="flex justify-center"></div>
            </div>
            <!-- Glow effect behind -->
            <div class="absolute inset-0 bg-indigo-500/20 blur-xl -z-10 rounded-full opacity-50"></div>
        </div>
"@
        
        # Perform replacement
        # We need a robust regex because whitespace can vary slightly
        # Let's match the container by its class and content structure
        
        $regexPattern = '<!-- Deck Resources & Card Browser \(below banner\) -->\s*<div class="flex flex-col items-center gap-3 mb-10 md:mb-16">\s*<div id="deck-resources-compact"></div>\s*<div id="archetype-cards-browser" class="flex justify-center"></div>\s*</div>'
        
        if ($content -match $regexPattern) {
            $content = $content -replace $regexPattern, $newStructure
        }
        else {
            # Fallback simpler match if exact whitespace fails
            # Matches: Comment... <div class="flex flex-col... ... </div>
            $loosePattern = '<!-- Deck Resources & Card Browser \(below banner\) -->[\s\S]*?<div class="flex flex-col items-center gap-3 mb-10 md:mb-16">[\s\S]*?</div>\s*</div>'
            # Be careful not to match too much. The inner divs are specific.
             
            # Let's try matching the wrapper div specifically
            $wrapperRegex = '<div class="flex flex-col items-center gap-3 mb-10 md:mb-16">\s*<div id="deck-resources-compact"></div>\s*<div id="archetype-cards-browser" class="flex justify-center"></div>\s*</div>'
             
            if ($content -match $wrapperRegex) {
                # Replace the wrapper and the preceding comment if possible
                $content = $content -replace '<!-- Deck Resources & Card Browser \(below banner\) -->\s*', ''
                $content = $content -replace $wrapperRegex, $newStructure
            }
        }

        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "[UPDATED] $($file.Name)" -ForegroundColor Green
            $modified++
        }
    }
    catch {
        Write-Host "[ERROR] $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host "Total Dock Updated: $modified" -ForegroundColor Cyan
