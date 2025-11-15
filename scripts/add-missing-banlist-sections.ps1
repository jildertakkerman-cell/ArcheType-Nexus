# PowerShell script to add banlist sections to files that are missing them
# This script adds the banlist section inside the container, before the closing </div>

$files = @(
    "Ancient Gear Deck Analysis.html",
    "Doom-Z Archetype Deep Dive.html",
    "Fusion Deck Analysis.html",
    "Yummy Archetype Deep Dive.html"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$banlistSectionTemplate = @"

        <!-- TCG Banlist Impact Section -->
        <section class="mb-10 md:mb-16">
            <h2 class="text-xl md:text-3xl font-bold text-white mb-6 text-center"><i class="fas fa-gavel mr-2"></i>TCG Banlist Impact</h2>
            <div id="banlist-status">
                <!-- Banlist section will be populated by CardLoader.renderBanlistSection -->
            </div>
        </section>
"@

$successCount = 0
$failedCount = 0
$alreadyHasCount = 0

foreach ($fileName in $files) {
    $filePath = Join-Path $scriptDir $fileName
    
    if (-not (Test-Path $filePath)) {
        Write-Host "File not found: $fileName" -ForegroundColor Red
        $failedCount++
        continue
    }
    
    $content = Get-Content $filePath -Raw
    
    # Check if file already has banlist section
    if ($content -match 'banlist-status') {
        Write-Host "SKIP: $fileName (already has banlist section)" -ForegroundColor Yellow
        $alreadyHasCount++
        continue
    }
    
    # Find the closing </div> before the first <script> tag (end of container)
    # Pattern: find </section>\s*</div>\s*<script
    if ($content -match '(</section>)\s*(</div>)\s*(<script)') {
        $insertPoint = $matches[0]
        $newContent = $insertPoint -replace '(</section>)\s*(</div>)\s*(<script)', "`$1$banlistSectionTemplate`n    `$2`n`n    `$3"
        
        $content = $content -replace [regex]::Escape($insertPoint), $newContent
        
        # Save the file
        $content | Out-File -FilePath $filePath -Encoding UTF8 -NoNewline
        
        Write-Host "SUCCESS: $fileName" -ForegroundColor Green
        $successCount++
    }
    else {
        Write-Host "FAILED: $fileName (could not find insertion point)" -ForegroundColor Red
        $failedCount++
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Successfully updated: $successCount files" -ForegroundColor Green
Write-Host "Already had section: $alreadyHasCount files" -ForegroundColor Yellow
Write-Host "Failed: $failedCount files" -ForegroundColor Red
