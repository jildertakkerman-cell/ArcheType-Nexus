# Move-ButtonsBelowBanner.ps1
# This script moves the deck-resources-compact and archetype-cards-browser divs
# from inside the header to below it

$pagesDir = "c:\Visual Studio Code\Apps\ArcheType-Nexus\pages"

# Get all HTML files
$htmlFiles = Get-ChildItem -Path $pagesDir -Filter "*.html" -Recurse

$modified = 0
$skipped = 0
$errors = 0

foreach ($file in $htmlFiles) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        # Skip if doesn't have deck-resources-compact inside header
        if ($content -notmatch '<header[^>]*>[\s\S]*?<div id="deck-resources-compact"') {
            $skipped++
            continue
        }
        
        # Skip if already has the buttons below banner pattern
        if ($content -match '</header>\s*\r?\n\s*\r?\n\s*<!-- Deck Resources') {
            $skipped++
            continue
        }
        
        # Pattern 1: header with both deck-resources-compact and archetype-cards-browser inside
        # We need to extract and move them outside
        
        # First, let's remove them from inside the header and add them after
        # Pattern matches: content inside header after the h1 title that includes the divs
        
        # Remove deck-resources-compact from inside header
        $content = $content -replace '(\s*<!-- Compact deck resource buttons -->\s*\r?\n)?\s*<div id="deck-resources-compact"[^>]*></div>', ''
        
        # Remove archetype-cards-browser from inside header (with various formats)
        $content = $content -replace '\s*<div id="archetype-cards-browser"[^>]*>\s*\r?\n\s*<!-- Button will be injected here -->\s*\r?\n\s*</div>', ''
        $content = $content -replace '\s*<div id="archetype-cards-browser"[^>]*></div>', ''
        
        # Now add them after the header with proper structure
        # Find the closing </header> tag and add the new structure after it
        $newButtonSection = @"

        <!-- Deck Resources & Card Browser (below banner) -->
        <div class="flex flex-col items-center gap-3 mb-10 md:mb-16">
            <div id="deck-resources-compact"></div>
            <div id="archetype-cards-browser" class="flex justify-center"></div>
        </div>
"@
        
        # Only add if we don't already have this structure
        if ($content -notmatch '<!-- Deck Resources & Card Browser \(below banner\) -->') {
            # Find closing header and insert after it
            $content = $content -replace '(</header>)\s*\r?\n(\s*\r?\n)?(\s*<!-- )', "`$1`r`n$newButtonSection`r`n`r`n        `$3"
        }
        
        # Also reduce header margin since buttons add spacing
        $content = $content -replace 'class="banner-header text-center mb-10 md:mb-16"', 'class="banner-header text-center mb-6 md:mb-8"'
        
        # Check if modifications were made
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "[MODIFIED] $($file.Name)" -ForegroundColor Green
            $modified++
        }
        else {
            Write-Host "[NO CHANGE] $($file.Name)" -ForegroundColor Gray
        }
        
    }
    catch {
        Write-Host "[ERROR] $($file.Name): $_" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Modified: $modified files" -ForegroundColor Green
Write-Host "  Skipped: $skipped files" -ForegroundColor Yellow
Write-Host "  Errors: $errors files" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
