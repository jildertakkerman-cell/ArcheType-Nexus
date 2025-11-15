at# Fix encoding issues in HTML files
$files = Get-ChildItem -Path "." -Filter "*.html" -File

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Replace common encoding issues using Unicode escapes
    $content = $content -replace [char]0xE2 + [char]0x80 + [char]0x94, [char]0x2014  # em dash
    $content = $content -replace [char]0xE2 + [char]0x80 + [char]0x99, [char]0x2019  # right single quote
    $content = $content -replace [char]0xE2 + [char]0x80 + [char]0x9C, [char]0x201C  # left double quote
    $content = $content -replace [char]0xE2 + [char]0x80 + [char]0x9D, [char]0x201D  # right double quote
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`nDone! All encoding issues fixed." -ForegroundColor Cyan
