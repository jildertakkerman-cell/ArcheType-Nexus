# PowerShell script to batch add banlist sections to all archetype pages
# This will add the HTML structure and automatically use the YGOProDeck API

$archetypeDir = "c:\Users\jilde\Documents\VSCode-Projects-main\Apps\ArcheType Nexus"

# Get all HTML files that match the pattern
$htmlFiles = Get-ChildItem -Path $archetypeDir -Filter "*Deck Analysis.html" | Where-Object { $_.Name -notlike "index.html" }
$htmlFiles += Get-ChildItem -Path $archetypeDir -Filter "*Archetype Breakdown.html"

Write-Host "Found $($htmlFiles.Count) archetype pages to process..." -ForegroundColor Cyan

$processed = 0
$skipped = 0
$errors = 0

foreach ($file in $htmlFiles) {
    $filePath = $file.FullName
    $fileName = $file.Name
    
    try {
        # Read the file content
        $content = Get-Content $filePath -Raw -Encoding UTF8
        
        # Check if banlist section already exists
        if ($content -match 'banlist-status|renderBanlistSection') {
            Write-Host "SKIP: $fileName (already has banlist section)" -ForegroundColor Green
            $skipped++
            continue
        }
        
        # Extract archetype name from filename
        $archetypeName = $fileName -replace ' Deck Analysis\.html$', '' -replace ' Archetype Breakdown\.html$', ''
        
        Write-Host "Processing: $archetypeName" -ForegroundColor Gray
        
        # Step 1: Add HTML section before </div></script> pattern
        $banlistHTML = @"

        <!-- TCG Banlist Impact Section -->
        <section>
            <div id="banlist-status">
                <!-- Banlist section will be populated by CardLoader.renderBanlistSection -->
            </div>
        </section>
"@
        
        # Find and replace the closing pattern
        if ($content -match '(</section>\s*)(</div>\s*<script>)') {
            $content = $content -replace '(</section>\s*)(</div>\s*<script>)', "`$1$banlistHTML`$2"
        } else {
            Write-Host "⚠ WARNING: Could not find insertion point in $fileName" -ForegroundColor Yellow
            $errors++
            continue
        }
        
        # Step 2: Make DOMContentLoaded async
        $content = $content -replace "addEventListener\('DOMContentLoaded',\s*\(\)\s*=>", "addEventListener('DOMContentLoaded', async () =>"
        
        # Step 3: Add banlist rendering code after CardLoader.loadCards
        # Using the new dynamic method that fetches cards from API
        $banlistJS = @"

            // Render banlist section - automatically fetches all cards in the archetype
            await CardLoader.renderBanlistSectionByArchetype('banlist-status', '$archetypeName', {
                relatedCards: [
                    // TODO: Add generic/synergistic cards here (e.g., 'Ash Blossom & Joyous Spring')
                ]
            });
"@
        
        # Add before the last }); in the script section
        if ($content -match '(\s*CardLoader\.loadCards\([^)]+\);\s*)(\s*}\);)') {
            $content = $content -replace '(\s*CardLoader\.loadCards\([^)]+\);\s*)(\s*}\);)', "`$1$banlistJS`$2"
        } else {
            # Alternative pattern: just before });
            $content = $content -replace '(\s*)(}\);\s*</script>)', "$banlistJS`$1`$2"
        }
        
        # Write back to file
        Set-Content -Path $filePath -Value $content -NoNewline -Encoding UTF8
        
        Write-Host "✓ ADDED: $fileName" -ForegroundColor Cyan
        $processed++
        
    } catch {
        Write-Host "✗ ERROR: $fileName - $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }
}

Write-Host "`n========================================" -ForegroundColor White
Write-Host "SUMMARY:" -ForegroundColor White
Write-Host "  Processed: $processed files" -ForegroundColor Cyan
Write-Host "  Skipped:   $skipped files (already have banlist)" -ForegroundColor Green
Write-Host "  Errors:    $errors files" -ForegroundColor Red
Write-Host "========================================`n" -ForegroundColor White

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review the files and add actual card names in the TODO sections" -ForegroundColor White
Write-Host "2. Test a few pages to ensure they display correctly" -ForegroundColor White
Write-Host "3. The banlist section will automatically fetch real banlist data from the API" -ForegroundColor White
