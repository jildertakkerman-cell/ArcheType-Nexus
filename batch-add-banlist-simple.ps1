# Simple PowerShell script to add banlist sections
$archetypeDir = "c:\Users\jilde\Documents\VSCode-Projects-main\Apps\ArcheType Nexus"

$htmlFiles = Get-ChildItem -Path $archetypeDir -Filter "*Deck Analysis.html" | Where-Object { $_.Name -notlike "index.html" }
$htmlFiles += Get-ChildItem -Path $archetypeDir -Filter "*Archetype Breakdown.html"

Write-Host "Found $($htmlFiles.Count) pages" -ForegroundColor Cyan

$processed = 0
$skipped = 0

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Skip if already has banlist
    if ($content -match 'banlist-status') {
        Write-Host "SKIP: $($file.Name)" -ForegroundColor Green
        $skipped++
        continue
    }
    
    # Get archetype name
    $name = $file.BaseName -replace ' Deck Analysis$', '' -replace ' Archetype Breakdown$', ''
    
    # Add HTML section
    $htmlSection = @"


        <!-- TCG Banlist Impact Section -->
        <section>
            <div id="banlist-status">
                <!-- Banlist section will be populated by CardLoader.renderBanlistSection -->
            </div>
        </section>
"@
    
    $content = $content -replace '(</section>\s*</div>\s*<script>)', ($htmlSection + '$1')
    
    # Make async
    $content = $content -replace "addEventListener\('DOMContentLoaded', \(\) =>", "addEventListener('DOMContentLoaded', async () =>"
    
    # Add JavaScript call
    $jsCall = @"


            // Render banlist section
            await CardLoader.renderBanlistSectionByArchetype('banlist-status', '$name', {
                relatedCards: []
            });
"@
    
    $content = $content -replace '(\}\);\s*</script>)', ($jsCall + '$1')
    
    # Save
    Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
    
    Write-Host "ADDED: $($file.Name)" -ForegroundColor Cyan
    $processed++
}

Write-Host "`nProcessed: $processed, Skipped: $skipped" -ForegroundColor White
