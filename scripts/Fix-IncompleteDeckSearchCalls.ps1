# Fix-IncompleteDeckSearchCalls.ps1
# This script fixes pages where the Fix-DeckResourcesSection.ps1 script left incomplete await statements

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
        
        # Pattern to match the incomplete await statement followed by archetype card browser comment
        # This captures the broken pattern and extracts the archetype name from the renderArchetypeCardsBrowser call
        
        # First, check if this file has the broken pattern
        if ($content -match '// Render deck search section\s*\r?\n\s*await\s*\r?\n\s*// Render (?:deck search section|archetype cards browser)') {
            
            # Try to extract archetype name from renderArchetypeCardsBrowser call
            if ($content -match "renderArchetypeCardsBrowser\s*\(\s*'[^']+'\s*,\s*'([^']+)'") {
                $archetypeName = $Matches[1]
                
                # Replace the broken pattern with the correct one
                $pattern = '// Render deck search section\s*\r?\n\s*await\s*\r?\n(\s*)// Render'
                $replacement = "// Render deck search section`r`n`$1await CardLoader.renderDeckSearchSection('deck-resources-container', '$archetypeName');`r`n`r`n`$1// Render"
                
                $content = $content -replace $pattern, $replacement
            }
        }
        
        # Also fix double "Render deck search section" comments
        $content = $content -replace '// Render deck search section\s*\r?\n\s*await CardLoader\.renderDeckSearchSection\([^)]+\);\s*\r?\n\s*// Render deck search section\s*\r?\n\s*await\s*\r?\n', "// Render deck search section`r`n            await CardLoader.renderDeckSearchSection('deck-resources-container', '$archetypeName');`r`n`r`n"
        
        # Check if modifications were made
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

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Modified: $modified files" -ForegroundColor Green
Write-Host "  Errors: $errors files" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
