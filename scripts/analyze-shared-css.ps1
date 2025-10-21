# CSS Analysis Script - Find Shared CSS Elements
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $projectDir

Write-Host "🎨 CSS ANALYSIS - SHARED ELEMENTS" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

# Find all archetype HTML files
$archetypeFiles = Get-ChildItem $projectDir -Filter "*Deck Analysis.html" | Select-Object -First 10

Write-Host "📊 Analyzing $($archetypeFiles.Count) archetype files..." -ForegroundColor Green

# Define common CSS selectors to look for
$commonSelectors = @(
    '.container',
    '.card',
    '.card-placeholder', 
    '.animate-fadeIn',
    '.combo-step-card',
    '.pro-con-card',
    '.card-image',
    '.card-image-container',
    '.icon-glow',
    '.text-accent',
    '.arrow-color',
    '.pro-icon',
    '.con-icon', 
    '.neutral-icon',
    'body',
    '@keyframes fadeIn'
)

$selectorCounts = @{}
$selectorDefinitions = @{}

# Initialize counters
foreach ($selector in $commonSelectors) {
    $selectorCounts[$selector] = 0
    $selectorDefinitions[$selector] = @()
}

# Analyze each file
foreach ($file in $archetypeFiles) {
    $content = Get-Content $file.FullName -Raw
    
    foreach ($selector in $commonSelectors) {
        $escapedSelector = [regex]::Escape($selector)
        if ($selector -eq '@keyframes fadeIn') {
            $pattern = '@keyframes\s+fadeIn\s*\{'
        } else {
            $pattern = "$escapedSelector\s*\{"
        }
        
        if ($content -match $pattern) {
            $selectorCounts[$selector]++
            
            # Extract the CSS definition
            if ($selector -eq '@keyframes fadeIn') {
                $match = [regex]::Match($content, '@keyframes\s+fadeIn\s*\{([^}]+)\}')
            } else {
                $match = [regex]::Match($content, "$escapedSelector\s*\{([^}]+)\}")
            }
            
            if ($match.Success) {
                $definition = $match.Groups[1].Value.Trim()
                $selectorDefinitions[$selector] += $definition
            }
        }
    }
}

Write-Host "`n📈 SHARED CSS ANALYSIS RESULTS:" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

# Sort by frequency (most common first)
$sortedSelectors = $selectorCounts.GetEnumerator() | Sort-Object Value -Descending

foreach ($item in $sortedSelectors) {
    $selector = $item.Key
    $count = $item.Value
    $percentage = [math]::Round(($count / $archetypeFiles.Count) * 100, 1)
    
    if ($count -gt 0) {
        Write-Host "🎯 $selector" -ForegroundColor Cyan
        Write-Host "   Found in: $count/$($archetypeFiles.Count) files ($percentage%)" -ForegroundColor White
        
        if ($count -ge ($archetypeFiles.Count * 0.5)) {
            Write-Host "   Status: SHARED ELEMENT ✅" -ForegroundColor Green
        } elseif ($count -ge ($archetypeFiles.Count * 0.3)) {
            Write-Host "   Status: COMMON ELEMENT ⚠️" -ForegroundColor Yellow
        } else {
            Write-Host "   Status: RARE ELEMENT ❌" -ForegroundColor Red
        }
        Write-Host ""
    }
}

Write-Host "💡 RECOMMENDATIONS:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

$sharedElements = $sortedSelectors | Where-Object { $_.Value -ge ($archetypeFiles.Count * 0.7) }
if ($sharedElements.Count -gt 0) {
    Write-Host "✅ Create a shared CSS file with these elements:" -ForegroundColor Green
    foreach ($element in $sharedElements) {
        Write-Host "   - $($element.Key)" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  No elements found in 70%+ of files" -ForegroundColor Yellow
}

$commonElements = $sortedSelectors | Where-Object { $_.Value -ge ($archetypeFiles.Count * 0.5) -and $_.Value -lt ($archetypeFiles.Count * 0.7) }
if ($commonElements.Count -gt 0) {
    Write-Host "`n📋 Consider standardizing these elements:" -ForegroundColor Yellow
    foreach ($element in $commonElements) {
        Write-Host "   - $($element.Key)" -ForegroundColor White
    }
}

Write-Host "`n🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Create shared-archetype-styles.css with common elements"
Write-Host "2. Update archetype HTML files to use shared CSS"
Write-Host "3. Keep archetype-specific colors as CSS variables"
Write-Host "4. Test with a few archetype files first"