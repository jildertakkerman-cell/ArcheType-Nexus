# PowerShell script to add home buttons to all HTML files
# This script adds a fixed-position home button to all deck analysis HTML files

$rootPath = "c:\Users\jilde\Downloads\Hobby-20250926T223016Z-1-001\Hobby"
$files = Get-ChildItem -Path $rootPath -Name "*.html" | Where-Object { 
    $_ -notlike "*index*" -and $_ -notlike "*backup*" -and $_ -notlike "*dev*" 
}

$homeButtonCSS = @"
        /* --- Home Button Styles --- */
        .home-button {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1000;
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            transition: all 0.3s ease;
            cursor: pointer;
            text-decoration: none;
        }
        
        .home-button:hover {
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
            background: linear-gradient(135deg, #1d4ed8, #2563eb);
        }
        
        .home-button i {
            font-size: 20px;
        }

"@

$homeButtonHTML = @"
    <!-- Home Button -->
    <a href="index-refactored.html" class="home-button" title="Return to Home">
        <i class="fas fa-home"></i>
    </a>

"@

$processedCount = 0
$skippedCount = 0

foreach ($file in $files) {
    $filePath = Join-Path $rootPath $file
    Write-Host "Processing: $file"
    
    try {
        $content = Get-Content -Path $filePath -Raw -Encoding UTF8
        
        # Skip if already has home button
        if ($content -match "home-button") {
            Write-Host "  Skipped - already has home button" -ForegroundColor Yellow
            $skippedCount++
            continue
        }
        
        # Add CSS styles before the closing </style> tag
        if ($content -match "</style>") {
            $content = $content -replace "</style>", "$homeButtonCSS    </style>"
        }
        
        # Add HTML after <body> tag
        if ($content -match '<body[^>]*>') {
            $bodyMatch = $matches[0]
            $content = $content -replace [regex]::Escape($bodyMatch), "$bodyMatch`n$homeButtonHTML"
        }
        
        # Save the modified content
        Set-Content -Path $filePath -Value $content -Encoding UTF8
        Write-Host "  ✓ Added home button" -ForegroundColor Green
        $processedCount++
        
    } catch {
        Write-Host "  ✗ Error processing file: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "Processed: $processedCount files" -ForegroundColor Green
Write-Host "Skipped: $skippedCount files" -ForegroundColor Yellow
Write-Host "Total files checked: $($files.Count)" -ForegroundColor White