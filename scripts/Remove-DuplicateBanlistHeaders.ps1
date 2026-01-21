# Remove-DuplicateBanlistHeaders.ps1
# This script removes hardcoded "Banlist Impact" header elements from HTML files
# that will be duplicated by the dynamically-injected JavaScript headers.

$pagesDir = "c:\Visual Studio Code\Apps\ArcheType-Nexus\pages"

# Get all HTML files that contain the renderBanlistSectionByArchetype call
$htmlFiles = Get-ChildItem -Path $pagesDir -Filter "*.html" -Recurse

$modified = 0
$skipped = 0
$errors = 0

foreach ($file in $htmlFiles) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        # Only process files that have the renderBanlistSection or renderBanlistSectionByArchetype call
        # These are the ones that will have the header injected dynamically
        if ($content -notmatch 'renderBanlistSection') {
            $skipped++
            continue
        }
        
        # Pattern 1: Remove standalone <h2> with Banlist Impact text (various styles)
        # This captures the entire h2 element including any attributes and inner text
        $pattern1 = '<h2[^>]*>(?:[^<]*<i[^>]*>[^<]*</i>)?[^<]*(?:TCG |Live TCG |Critical )?Banlist Impact[^<]*</h2>\s*\r?\n?'
        $content = $content -replace $pattern1, ''
        
        # Pattern 2: Remove standalone <h3> with Banlist Impact text
        $pattern2 = '<h3[^>]*>(?:[^<]*<i[^>]*>[^<]*</i>)?[^<]*(?:TCG |Live TCG |Critical )?Banlist Impact[^<]*</h3>\s*\r?\n?'
        $content = $content -replace $pattern2, ''
        
        # Pattern 3: Handle multi-line h2 tags (like in Radiant Typhoon where h2 might wrap)
        $pattern3 = '(?s)<h2[^>]*>(?:[^<]*<i[^>]*>[^<]*</i>)?\s*(?:TCG |Live TCG |Critical )?Banlist Impact\s*(?:</i>)?\s*</h2>\s*\r?\n?'
        $content = $content -replace $pattern3, ''
        
        # Check if modifications were made
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "[MODIFIED] $($file.Name)" -ForegroundColor Green
            $modified++
        }
        else {
            Write-Host "[NO CHANGE] $($file.Name) - Has renderBanlistSectionByArchetype but no hardcoded header found" -ForegroundColor Yellow
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
Write-Host "  Skipped (no renderBanlistSectionByArchetype): $skipped files" -ForegroundColor Gray
Write-Host "  Errors: $errors files" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
