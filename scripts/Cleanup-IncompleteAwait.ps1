# Cleanup-IncompleteAwait.ps1
# This script removes incomplete "await" statements that were left behind by the previous fix script

$pagesDir = "c:\Visual Studio Code\Apps\ArcheType-Nexus\pages"

# Get all HTML files
$htmlFiles = Get-ChildItem -Path $pagesDir -Filter "*.html" -Recurse

$modified = 0
$errors = 0

foreach ($file in $htmlFiles) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        # Pattern 1: Remove duplicate/broken deck search sections with just "await" 
        # Pattern: "// Render deck search section" followed by just "await" on its own line
        $pattern1 = '// Render deck search section\s*\r?\n\s*if \(typeof CardLoader !== ''undefined'' && CardLoader\.renderDeckSearchSection\) \{\s*\r?\n\s*await\s*\r?\n\s*// Render'
        $replacement1 = '// Render'
        $content = $content -replace $pattern1, $replacement1
        
        # Pattern 2: Standalone incomplete await sections
        # This matches "await" on its own line followed by "// Render archetype"
        $pattern2 = '(\s*)await\s*\r?\n(\s*)// Render archetype'
        $replacement2 = '$1// Render archetype'
        $content = $content -replace $pattern2, $replacement2
        
        # Pattern 3: Check for if block with just await inside followed by archetype comment
        $pattern3 = 'if \(typeof CardLoader !== ''undefined'' && CardLoader\.renderDeckSearchSection\) \{\s*\r?\n\s*await\s*\r?\n\s*// Render archetype cards browser.*?\r?\n.*?await CardLoader\.renderArchetypeCardsBrowser\([^)]+\);?\s*\r?\n\s*\} else \{\s*\r?\n\s*console\.warn\([^)]+\);\s*\r?\n\s*\}'
        $replacement3 = ''
        
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
