# Script to verify and fix CardLoader.loadCards execution order
# Ensures loadCards is called BEFORE renderBanlistSection for proper cache population

Write-Host "Checking execution order in all HTML files..." -ForegroundColor Cyan
Write-Host ""

$htmlFiles = Get-ChildItem -Filter "*.html" | Where-Object { $_.Name -like "*Deck Analysis*" -or $_.Name -like "*Archetype*" }
$needsFixCount = 0
$alreadyCorrectCount = 0
$noRenderCount = 0
$fixedCount = 0
$failedCount = 0

foreach ($file in $htmlFiles) {
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction Stop
        
        # Check if file has renderBanlistSection
        if ($content -notmatch 'renderBanlistSection') {
            $noRenderCount++
            continue
        }
        
        # Find the DOMContentLoaded block
        if ($content -match '(?s)document\.addEventListener\([''"]DOMContentLoaded[''"],\s*async\s*\(\)\s*=>\s*\{(.*?)\}\);') {
            $domBlock = $matches[1]
            
            # Check if loadCards comes before renderBanlistSection
            $loadCardsPos = $domBlock.IndexOf('CardLoader.loadCards')
            $renderPos = $domBlock.IndexOf('renderBanlistSection')
            
            if ($loadCardsPos -eq -1) {
                Write-Host "SKIP: $($file.Name) (no loadCards found)" -ForegroundColor Yellow
                continue
            }
            
            if ($renderPos -eq -1) {
                Write-Host "SKIP: $($file.Name) (no renderBanlistSection found in DOM block)" -ForegroundColor Yellow
                continue
            }
            
            if ($loadCardsPos -lt $renderPos) {
                # Already in correct order
                $alreadyCorrectCount++
                continue
            }
            
            # Needs fixing
            $needsFixCount++
            Write-Host "FIX NEEDED: $($file.Name)" -ForegroundColor Red
            
            # Extract loadCards call
            if ($content -match '(CardLoader\.loadCards\(\{[^}]*(?:\{[^}]*\}[^}]*)*\}\);)') {
                $loadCardsCall = $matches[1]
                
                # Extract renderBanlistSection call (including await)
                if ($content -match '(await\s+CardLoader\.renderBanlistSection\([^;]*\);)') {
                    $renderCall = $matches[1]
                    
                    # Find the full DOMContentLoaded block
                    if ($content -match '(?s)(document\.addEventListener\([''"]DOMContentLoaded[''"],\s*async\s*\(\)\s*=>\s*\{)(.*?)(\}\);)') {
                        $beforeBlock = $matches[1]
                        $blockContent = $matches[2]
                        $afterBlock = $matches[3]
                        
                        # Remove both calls from the block
                        $blockContent = $blockContent -replace [regex]::Escape($loadCardsCall), ''
                        $blockContent = $blockContent -replace [regex]::Escape($renderCall), ''
                        
                        # Remove any comment about card loading
                        $blockContent = $blockContent -replace '(?m)^\s*//\s*---\s*CARD.*?---\s*$[\r\n]*', ''
                        $blockContent = $blockContent -replace '(?m)^\s*//\s*Load cards.*?$[\r\n]*', ''
                        
                        # Clean up extra whitespace
                        $blockContent = $blockContent -replace '[\r\n]{3,}', "`r`n`r`n"
                        $blockContent = $blockContent.Trim()
                        
                        # Reconstruct in correct order
                        $newBlock = @"
$beforeBlock
            // --- CARD POPUP AND IMAGE FETCHER SCRIPT ---
            // Load cards first so they're in the cache for banlist auto-extraction
            $loadCardsCall
            
            $renderCall
            
            $blockContent
$afterBlock
"@
                        
                        # Replace in content
                        $pattern = [regex]::Escape($beforeBlock) + '(?s).*?' + [regex]::Escape($afterBlock)
                        $newContent = $content -replace $pattern, $newBlock
                        
                        # Write back
                        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8 -NoNewline
                        
                        $fixedCount++
                        Write-Host "  FIXED: Reordered loadCards before renderBanlistSection" -ForegroundColor Green
                    }
                    else {
                        Write-Host "  FAILED: Could not match DOMContentLoaded block" -ForegroundColor Red
                        $failedCount++
                    }
                }
                else {
                    Write-Host "  FAILED: Could not extract renderBanlistSection call" -ForegroundColor Red
                    $failedCount++
                }
            }
            else {
                Write-Host "  FAILED: Could not extract loadCards call" -ForegroundColor Red
                $failedCount++
            }
        }
        else {
            Write-Host "SKIP: $($file.Name) (no DOMContentLoaded block found)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "ERROR: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
        $failedCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Execution Order Check Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total HTML files checked: $($htmlFiles.Count)" -ForegroundColor White
Write-Host "Already in correct order: $alreadyCorrectCount" -ForegroundColor Green
Write-Host "Fixed: $fixedCount" -ForegroundColor Green
Write-Host "Needed fixing: $needsFixCount" -ForegroundColor Yellow
Write-Host "No renderBanlistSection: $noRenderCount" -ForegroundColor Gray
Write-Host "Failed to fix: $failedCount" -ForegroundColor Red
Write-Host ""
Write-Host "Complete!" -ForegroundColor Cyan
