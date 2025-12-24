# Add Google Analytics script to all HTML files in the pages directory
# Run this script from the ArcheType-Nexus root directory

$pagesDir = ".\pages"
$scriptTag = '    <script src="../assets/js/google-analytics.js"></script>'
$counter = 0
$skipped = 0

Get-ChildItem -Path $pagesDir -Filter "*.html" | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content -Path $filePath -Raw
    
    # Skip if already has the analytics script
    if ($content -match 'google-analytics\.js') {
        Write-Host "Skipped (already has analytics): $($_.Name)" -ForegroundColor Yellow
        $skipped++
        return
    }
    
    # Find the </title> tag and insert the script after it
    if ($content -match '(</title>\r?\n)') {
        $replacement = "`$1$scriptTag`r`n"
        $newContent = $content -replace '(</title>\r?\n)', $replacement
        Set-Content -Path $filePath -Value $newContent -NoNewline
        Write-Host "Updated: $($_.Name)" -ForegroundColor Green
        $counter++
    } else {
        Write-Host "Warning: Could not find </title> tag in $($_.Name)" -ForegroundColor Red
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Updated: $counter files" -ForegroundColor Green
Write-Host "Skipped: $skipped files" -ForegroundColor Yellow
