# Script to restore all corrupted HTML files from git commit cb886e6
# This commit is from before the PowerShell script corruption

$commitHash = "cb886e6"
$corruptedFiles = Get-Content "CORRUPTED_FILES.txt"

Write-Host "Starting restoration of $($corruptedFiles.Count) corrupted files..." -ForegroundColor Cyan
Write-Host "Restoring from commit: $commitHash" -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failCount = 0
$failedFiles = @()

foreach ($file in $corruptedFiles) {
    $file = $file.Trim()
    if ([string]::IsNullOrWhiteSpace($file)) { continue }
    
    try {
        Write-Host "Restoring: $file" -ForegroundColor Gray
        
        # Restore the file from git
        git show "${commitHash}:${file}" | Out-File -FilePath $file -Encoding UTF8
        
        # Verify the file was restored correctly
        $firstLine = Get-Content $file -First 1 -ErrorAction Stop
        if ($firstLine -match '^<\!DOCTYPE html>') {
            $successCount++
            Write-Host "  Successfully restored" -ForegroundColor Green
        } else {
            $failCount++
            $failedFiles += $file
            Write-Host "  File restored but still appears corrupted" -ForegroundColor Red
        }
    }
    catch {
        $failCount++
        $failedFiles += $file
        Write-Host "  Failed to restore: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Restoration Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total files: $($corruptedFiles.Count)" -ForegroundColor White
Write-Host "Successfully restored: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red

if ($failedFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "Failed files:" -ForegroundColor Red
    foreach ($file in $failedFiles) {
        Write-Host "  - $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Restoration complete!" -ForegroundColor Cyan
