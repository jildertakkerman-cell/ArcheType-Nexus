# Fix-RemainingDeckResources.ps1
# This script catches remaining pages that weren't fully migrated

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
        
        # Skip if doesn't have the old renderDeckSearchSection call
        if ($content -notmatch 'renderDeckSearchSection') {
            $skipped++
            continue
        }
        
        # Extract archetype name from the compact call if it exists, or from renderArchetypeCardsBrowser
        $archetypeMatch = [regex]::Match($content, "renderDeckResourcesCompact\s*\(\s*'deck-resources-compact'\s*,\s*'([^']+)'")
        if (-not $archetypeMatch.Success) {
            $archetypeMatch = [regex]::Match($content, "renderArchetypeCardsBrowser\s*\(\s*'[^']+'\s*,\s*'([^']+)'")
        }
        if (-not $archetypeMatch.Success) {
            $archetypeMatch = [regex]::Match($content, "renderDeckSearchSection\s*\(\s*'deck-resources-container'\s*,\s*'([^']+)'")
        }
        
        if (-not $archetypeMatch.Success) {
            Write-Host "[SKIP - No archetype] $($file.Name)" -ForegroundColor Yellow
            $skipped++
            continue
        }
        
        $archetypeName = $archetypeMatch.Groups[1].Value
        
        # Replace old JS calls with various patterns (including those with options)
        # Pattern with options object
        $patterns = @(
            "await CardLoader\.renderDeckSearchSection\s*\(\s*'deck-resources-container'\s*,\s*'[^']+'\s*,\s*\{[^}]*\}\s*\)\s*;",
            "await CardLoader\.renderDeckSearchSection\s*\(\s*'deck-resources-container'\s*,\s*'[^']+'\s*\)\s*;",
            "CardLoader\.renderDeckSearchSection\s*\(\s*'deck-resources-container'\s*,\s*'[^']+'\s*,\s*\{[^}]*\}\s*\)\s*;",
            "CardLoader\.renderDeckSearchSection\s*\(\s*'deck-resources-container'\s*,\s*'[^']+'\s*\)\s*;"
        )
        
        foreach ($pattern in $patterns) {
            $content = $content -replace $pattern, "await CardLoader.renderDeckResourcesCompact('deck-resources-compact', '$archetypeName');"
        }
        
        # Remove old deck-resources-container section if it still exists
        $content = $content -replace '<section>\s*\r?\n\s*<div id="deck-resources-container">.*?</div>\s*\r?\n\s*</section>\s*', ''
        $content = $content -replace '<section class="[^"]*">\s*\r?\n\s*<div id="deck-resources-container">.*?</div>\s*\r?\n\s*</section>\s*', ''
        
        # Remove HTML comments about the old function
        $content = $content -replace '<!-- Deck search section will be populated by CardLoader\.renderDeckSearchSection -->', ''
        
        # Also handle: // Render deck search section comment followed by compact call
        $content = $content -replace '// Render deck search section\s*\r?\n\s*(await CardLoader\.renderDeckResourcesCompact)', '// Render compact deck resources in header' + "`r`n" + '            $1'
        
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
Write-Host "Fix Summary:" -ForegroundColor Cyan
Write-Host "  Modified: $modified files" -ForegroundColor Green
Write-Host "  Skipped: $skipped files" -ForegroundColor Yellow
Write-Host "  Errors: $errors files" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
