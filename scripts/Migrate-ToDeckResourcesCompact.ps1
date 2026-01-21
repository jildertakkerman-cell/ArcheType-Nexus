# Migrate-ToDeckResourcesCompact.ps1
# This script migrates pages from the old renderDeckSearchSection 
# (bloated bottom section) to the new renderDeckResourcesCompact (compact header buttons)

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
        
        # Skip if already migrated (has deck-resources-compact)
        if ($content -match 'deck-resources-compact') {
            $skipped++
            continue
        }
        
        # Skip if doesn't have the old pattern
        if ($content -notmatch 'renderDeckSearchSection') {
            $skipped++
            continue
        }
        
        # Extract archetype name from the existing call
        $archetypeMatch = [regex]::Match($content, "renderDeckSearchSection\s*\(\s*'deck-resources-container'\s*,\s*'([^']+)'")
        if (-not $archetypeMatch.Success) {
            # Try alternate pattern for older format
            $archetypeMatch = [regex]::Match($content, "renderArchetypeCardsBrowser\s*\(\s*'[^']+'\s*,\s*'([^']+)'")
        }
        
        if (-not $archetypeMatch.Success) {
            Write-Host "[SKIP - No archetype] $($file.Name)" -ForegroundColor Yellow
            $skipped++
            continue
        }
        
        $archetypeName = $archetypeMatch.Groups[1].Value
        
        # STEP 1: Add deck-resources-compact container to header
        # Pattern: Find the archetype-cards-browser div
        $headerPattern = '(<div id="archetype-cards-browser"[^>]*>)'
        if ($content -match $headerPattern) {
            $headerReplacement = @"
<!-- Compact deck resource buttons -->
            <div id="deck-resources-compact" class="mt-4 relative z-10"></div>
            `$1
"@
            $content = $content -replace $headerPattern, $headerReplacement
        }
        
        # STEP 2: Remove the old deck-resources-container section
        # Pattern: <section> containing deck-resources-container
        $sectionPattern = '\s*<section[^>]*>\s*\r?\n\s*<div id="deck-resources-container"[^>]*>.*?</div>\s*\r?\n\s*</section>'
        $content = $content -replace $sectionPattern, ''
        
        # Also handle inline versions
        $inlinePattern = '<section>\s*<div id="deck-resources-container"></div>\s*</section>'
        $content = $content -replace $inlinePattern, ''
        
        # Handle just the div without section wrapper
        $divOnlyPattern = '<div id="deck-resources-container"></div>'
        $content = $content -replace $divOnlyPattern, ''
        
        # STEP 3: Replace JS call to use new compact function
        # Pattern: Various forms of renderDeckSearchSection call
        $jsPattern = "// Render deck search section\s*\r?\n\s*await CardLoader\.renderDeckSearchSection\s*\(\s*'deck-resources-container'\s*,\s*'[^']+'\s*\)\s*;"
        $jsReplacement = "// Render compact deck resources in header`r`n            await CardLoader.renderDeckResourcesCompact('deck-resources-compact', '$archetypeName');"
        $content = $content -replace $jsPattern, $jsReplacement
        
        # Also handle alternative patterns
        $jsPattern2 = "await CardLoader\.renderDeckSearchSection\s*\(\s*'deck-resources-container'\s*,\s*'[^']+'\s*\)\s*;"
        $jsReplacement2 = "await CardLoader.renderDeckResourcesCompact('deck-resources-compact', '$archetypeName');"
        $content = $content -replace $jsPattern2, $jsReplacement2
        
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
Write-Host "Migration Summary:" -ForegroundColor Cyan
Write-Host "  Modified: $modified files" -ForegroundColor Green
Write-Host "  Skipped: $skipped files" -ForegroundColor Yellow
Write-Host "  Errors: $errors files" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
