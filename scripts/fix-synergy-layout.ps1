$pagesDir = Join-Path $PSScriptRoot "..\pages"

$utf8Strict = New-Object System.Text.UTF8Encoding($false, $true)  # no BOM, throw on invalid
$utf8Out    = New-Object System.Text.UTF8Encoding($false)          # no BOM

$filesFixed = 0
$filesSkipped = 0

# The regex targets the extra closing div added by the previous buggy script.
# It matches:
# </div>
#             </div>
#             <!-- Community Synergy Tags
$buggyRegex = [regex]'(?s)(</div>\s+)</div>(\s+<!-- Community Synergy Tags)'

Get-ChildItem -Path $pagesDir -Filter "*.html" | ForEach-Object {
    $filePath = $_.FullName

    try {
        $content = [System.IO.File]::ReadAllText($filePath, $utf8Strict)
    } catch {
        Write-Host "Skipped (encoding): $($_.Name)"
        $filesSkipped++
        return
    }

    if ($buggyRegex.IsMatch($content)) {
        $content = $buggyRegex.Replace($content, '$1$2', 1)
        [System.IO.File]::WriteAllText($filePath, $content, $utf8Out)
        Write-Host "Fixed: $($_.Name)"
        $filesFixed++
    } else {
        $filesSkipped++
    }
}

Write-Host "`n--- Summary ---"
Write-Host "Files Fixed: $filesFixed"
Write-Host "Files Skipped: $filesSkipped"
