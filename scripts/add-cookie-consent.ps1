# Add Cookie Consent Banner to all HTML files
# Run this script from the ArcheType-Nexus root directory

$pagesDir = ".\pages"
$cssTag = '    <link rel="stylesheet" href="../assets/css/cookie-consent.css">'
$jsTagsBody = @"
    <!-- Cookie Consent Banner -->
    <script src="../assets/js/cookie-consent.js"></script>
    <script src="../assets/js/cookie-consent-config.js"></script>
</body>
"@

$updatedCss = 0
$updatedJs = 0
$skippedCss = 0
$skippedJs = 0

Get-ChildItem -Path $pagesDir -Filter "*.html" | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content -Path $filePath -Raw
    $modified = $false
    
    # Add CSS if not present
    if ($content -notmatch 'cookie-consent\.css') {
        # Insert before </head> or after the last <link> in head
        if ($content -match '(</head>)') {
            $content = $content -replace '(</head>)', "$cssTag`r`n`$1"
            $modified = $true
            $updatedCss++
        }
    }
    else {
        $skippedCss++
    }
    
    # Add JS if not present
    if ($content -notmatch 'cookie-consent\.js') {
        # Insert before </body>
        if ($content -match '</body>') {
            $content = $content -replace '</body>', $jsTagsBody
            $modified = $true
            $updatedJs++
        }
    }
    else {
        $skippedJs++
    }
    
    if ($modified) {
        Set-Content -Path $filePath -Value $content -NoNewline
        Write-Host "Updated: $($_.Name)" -ForegroundColor Green
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "CSS added to: $updatedCss files" -ForegroundColor Green
Write-Host "JS added to: $updatedJs files" -ForegroundColor Green
Write-Host "CSS already present: $skippedCss files" -ForegroundColor Yellow
Write-Host "JS already present: $skippedJs files" -ForegroundColor Yellow
