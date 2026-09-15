# PowerShell script to reorder loadCards before renderBanlist calls
# This ensures cards are in the cache when banlist auto-extraction runs

$htmlFiles = Get-ChildItem -Path "." -Filter "*.html" -File
$processedCount = 0
$skippedCount = 0

Write-Host "Starting to process HTML files..." -ForegroundColor Cyan
Write-Host "Total files found: $($htmlFiles.Count)" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $htmlFiles) {
    $filePath = $file.FullName
    $content = Get-Content -Path $filePath -Raw
    
    # Check if file has both loadCards and renderBanlist calls
    if ($content -notmatch 'CardLoader\.loadCards\s*\(' -or 
        ($content -notmatch 'CardLoader\.renderBanlistSection\s*\(' -and 
         $content -notmatch 'CardLoader\.renderBanlistSectionByArchetype\s*\(')) {
        Write-Host "  [SKIP] $($file.Name) - No loadCards or renderBanlist found" -ForegroundColor Gray
        $skippedCount++
        continue
    }
    
    # Pattern to find the DOMContentLoaded listener with renderBanlist before loadCards
    # This matches cases where renderBanlist comes before loadCards in the same listener
    $pattern = '(?s)(document\.addEventListener\([''"]DOMContentLoaded[''"],\s*async\s*\(\)\s*=>\s*\{)(.*?)(await\s+CardLoader\.renderBanlist(?:Section|SectionByArchetype)\s*\([^)]*\)[^;]*;)(.*?)(CardLoader\.loadCards\s*\(\{[^}]*\}\);)(.*?)(\}\);)'
    
    if ($content -match $pattern) {
        $before = $matches[1]
        $betweenStart = $matches[2]
        $renderBanlist = $matches[3]
        $middle = $matches[4]
        $loadCards = $matches[5]
        $betweenEnd = $matches[6]
        $after = $matches[7]
        
        # Reconstruct with loadCards first, then renderBanlist
        $loadCardsWithComment = @"
// --- CARD POPUP AND IMAGE FETCHER SCRIPT ---
            // Load cards first so they're in the cache for banlist auto-extraction
            $loadCards
            
"@
        
        $newContent = $before + $betweenStart + $loadCardsWithComment + $renderBanlist + $middle + $betweenEnd + $after
        
        # Remove the old loadCards section if it exists later
        $newContent = $newContent -replace '\n\s*// --- CARD POPUP AND IMAGE FETCHER SCRIPT ---\s*\n\s*CardLoader\.loadCards\s*\(\{[^}]*\}\);', ''
        
        Set-Content -Path $filePath -Value $newContent -NoNewline
        Write-Host "  [FIXED] $($file.Name)" -ForegroundColor Green
        $processedCount++
    }
    else {
        # Check if loadCards is already before renderBanlist
        if ($content -match '(?s)CardLoader\.loadCards.*?CardLoader\.renderBanlist') {
            Write-Host "  [OK] $($file.Name) - Already in correct order" -ForegroundColor Cyan
            $skippedCount++
        }
        else {
            Write-Host "  [SKIP] $($file.Name) - Pattern not matched (manual review needed)" -ForegroundColor Yellow
            $skippedCount++
        }
    }
}

Write-Host ""
Write-Host "Processing complete!" -ForegroundColor Cyan
Write-Host "Files fixed: $processedCount" -ForegroundColor Green
Write-Host "Files skipped: $skippedCount" -ForegroundColor Yellow
