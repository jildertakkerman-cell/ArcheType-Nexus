# PowerShell script to add Yu-Gi-Oh! themed home buttons to all HTML files
# This script replaces the basic home button with a themed version

$rootPath = "c:\Users\jilde\Downloads\Hobby-20250926T223016Z-1-001\Hobby"
$files = Get-ChildItem -Path $rootPath -Name "*.html" | Where-Object { 
    $_ -notlike "*index*" -and $_ -notlike "*backup*" -and $_ -notlike "*dev*" 
}

$themedHomeButtonCSS = @'
        /* --- Yu-Gi-Oh! Themed Home Button Styles --- */
        .ygo-home-button {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1000;
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
            color: white;
            border: 2px solid #6366f1;
            border-radius: 12px;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 
                0 4px 15px rgba(99, 102, 241, 0.4),
                0 0 20px rgba(99, 102, 241, 0.2);
            transition: all 0.3s ease;
            cursor: pointer;
            text-decoration: none;
            overflow: hidden;
        }
        
        .ygo-home-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.2) 0%, transparent 50%),
                radial-gradient(circle at 70% 70%, rgba(139, 92, 246, 0.2) 0%, transparent 50%);
            animation: ygoButtonPulse 3s ease-in-out infinite;
            pointer-events: none;
        }
        
        .ygo-home-button:hover {
            transform: translateY(-3px) scale(1.05);
            box-shadow: 
                0 8px 25px rgba(99, 102, 241, 0.6),
                0 0 30px rgba(99, 102, 241, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
            border-color: #8b5cf6;
        }
        
        .ygo-home-button:active {
            transform: translateY(-1px) scale(1.02);
        }
        
        .ygo-home-button i {
            font-size: 22px;
            position: relative;
            z-index: 2;
            text-shadow: 0 0 10px rgba(99, 102, 241, 0.8);
            animation: ygoIconGlow 2s ease-in-out infinite alternate;
        }
        
        .ygo-home-button .ygo-home-text {
            position: absolute;
            bottom: -25px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 10px;
            font-weight: 600;
            color: #a5b4fc;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
            opacity: 0;
            transition: opacity 0.3s ease;
            white-space: nowrap;
            pointer-events: none;
        }
        
        .ygo-home-button:hover .ygo-home-text {
            opacity: 1;
        }
        
        @keyframes ygoButtonPulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
        }
        
        @keyframes ygoIconGlow {
            0% { 
                text-shadow: 
                    0 0 10px rgba(99, 102, 241, 0.8),
                    0 0 20px rgba(139, 92, 246, 0.4);
            }
            100% { 
                text-shadow: 
                    0 0 15px rgba(99, 102, 241, 1),
                    0 0 30px rgba(139, 92, 246, 0.6),
                    0 0 40px rgba(59, 130, 246, 0.3);
            }
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
            .ygo-home-button {
                width: 50px;
                height: 50px;
                top: 15px;
                left: 15px;
            }
            
            .ygo-home-button i {
                font-size: 18px;
            }
        }

'@

$themedHomeButtonHTML = @'
    <!-- Yu-Gi-Oh! Themed Home Button -->
    <a href="index.html" class="ygo-home-button" title="Return to Archetype Nexus">
        <i class="fas fa-home"></i>
        <span class="ygo-home-text">NEXUS</span>
    </a>

'@

$processedCount = 0
$skippedCount = 0

foreach ($file in $files) {
    $filePath = Join-Path $rootPath $file
    Write-Host "Processing: $file"
    
    try {
        $content = Get-Content -Path $filePath -Raw -Encoding UTF8
        $originalContent = $content
        
        # Remove old home button styles if they exist
        $content = $content -replace '(?s)/\* --- Home Button Styles --- \*/.*?/\* --- [^-]+ --- \*/', ''
        $content = $content -replace '(?s)/\* --- Home Button Styles --- \*/.*?</style>', '</style>'
        
        # Remove old home button HTML if it exists
        $content = $content -replace '(?s)    <!-- Home Button -->.*?</a>\s*', ''
        $content = $content -replace '(?s)    <!-- Yu-Gi-Oh! Themed Home Button -->.*?</a>\s*', ''
        
        # Add new themed CSS styles before the closing </style> tag
        if ($content -match "</style>") {
            $content = $content -replace "</style>", "$themedHomeButtonCSS    </style>"
        }
        
        # Add new themed HTML after <body> tag
        if ($content -match '<body[^>]*>') {
            $bodyMatch = $matches[0]
            $content = $content -replace [regex]::Escape($bodyMatch), "$bodyMatch`n$themedHomeButtonHTML"
        }
        
        # Only save if content actually changed
        if ($content -ne $originalContent) {
            Set-Content -Path $filePath -Value $content -Encoding UTF8
            Write-Host "  Updated with themed home button" -ForegroundColor Green
            $processedCount++
        } else {
            Write-Host "  No changes needed" -ForegroundColor Yellow
            $skippedCount++
        }
        
    } catch {
        Write-Host "  Error processing file: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "Updated: $processedCount files" -ForegroundColor Green
Write-Host "Skipped: $skippedCount files" -ForegroundColor Yellow
Write-Host "Total files checked: $($files.Count)" -ForegroundColor White