# Script to add renderBanlistSection to all restored HTML files
# This adds the new banlist functionality to pages that were just restored

$corruptedFiles = Get-Content "CORRUPTED_FILES.txt"

Write-Host "Adding banlist functionality to $($corruptedFiles.Count) restored files..." -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$skipCount = 0
$failCount = 0

foreach ($file in $corruptedFiles) {
    $file = $file.Trim()
    if ([string]::IsNullOrWhiteSpace($file)) { continue }
    
    try {
        $content = Get-Content $file -Raw -ErrorAction Stop
        
        # Check if file already has renderBanlistSection
        if ($content -match 'renderBanlistSection') {
            Write-Host "SKIP: $file (already has renderBanlistSection)" -ForegroundColor Yellow
            $skipCount++
            continue
        }
        
        # Extract archetype name from title tag
        if ($content -match '<title>(.+?)\s+(?:Archetype|Deck)') {
            $archetypeName = $matches[1]
        } else {
            Write-Host "SKIP: $file (could not extract archetype name)" -ForegroundColor Yellow
            $skipCount++
            continue
        }
        
        Write-Host "Processing: $file ($archetypeName)" -ForegroundColor Gray
        
        # Find the closing </body> tag to insert before it
        if ($content -match '(?s)(.*)</body>\s*</html>\s*$') {
            $beforeBody = $matches[1]
            
            # Remove old banlist code if it exists
            $beforeBody = $beforeBody -replace '(?s)<!-- Banlist Processing -->.*?cardsToCheck\.forEach.*?\}\);[\r\n\s]*', ''
            $beforeBody = $beforeBody -replace '(?s)const banlistData = \{.*?\};[\r\n\s]*function createBanlistCard.*?\}[\r\n\s]*', ''
            
            # Add banlist section container before closing body
            $banlistSection = @"

    <!-- TCG Banlist Impact Section -->
    <section class="mb-10 md:mb-16">
        <div id="banlist-status"></div>
    </section>

    <script>
        document.addEventListener('DOMContentLoaded', async () => {
            // --- CARD POPUP AND IMAGE FETCHER SCRIPT ---
            // Load cards first so they're in the cache for banlist auto-extraction
            CardLoader.loadCards({
"@
            
            # Extract card mappings from existing loadCards if present
            if ($content -match 'CardLoader\.loadCards\(\{([^}]+)\}\)') {
                $cardMappings = $matches[1]
                $banlistSection += $cardMappings
            }
            
            $banlistSection += @"

            });
            
            await CardLoader.renderBanlistSection('banlist-status', [
                // Core archetype cards will be auto-populated from loadCards cache
            ], {
                archetypeName: '$archetypeName',
                archetypeTraits: {
                    coreMechanic: 'archetype-specific mechanics',
                    supportReliance: 'Moderate',
                    adaptability: 'Moderate adaptability',
                    resilience: 'Moderate resilience',
                    keyLoss: 'key combo pieces',
                    alternativeStrategy: 'exploring alternative builds'
                }
            });
        });
    </script>
"@
            
            # Reconstruct the file
            $newContent = $beforeBody + $banlistSection + "`r`n</body>`r`n</html>"
            
            # Write the updated content
            Set-Content -Path $file -Value $newContent -Encoding UTF8 -NoNewline
            
            $successCount++
            Write-Host "  Added banlist section" -ForegroundColor Green
        }
        else {
            Write-Host "FAIL: $file (could not find closing body tag)" -ForegroundColor Red
            $failCount++
        }
    }
    catch {
        Write-Host "FAIL: $file - $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Banlist Addition Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total files: $($corruptedFiles.Count)" -ForegroundColor White
Write-Host "Successfully updated: $successCount" -ForegroundColor Green
Write-Host "Skipped: $skipCount" -ForegroundColor Yellow
Write-Host "Failed: $failCount" -ForegroundColor Red
Write-Host ""
Write-Host "Complete!" -ForegroundColor Cyan
