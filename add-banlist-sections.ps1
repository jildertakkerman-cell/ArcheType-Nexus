# PowerShell script to add banlist sections to archetype pages
# This script adds the banlist section before the closing </div> and <script> tags

$archetypeDir = "c:\Users\jilde\Documents\VSCode-Projects-main\Apps\ArcheType Nexus"

# List of pages that need banlist section added
$pagesToUpdate = @(
    "Armed Dragon Deck Analysis.html",
    "Artifact Deck Analysis.html",
    "Artmage Deck Analysis.html",
    "Ashened Deck Analysis.html",
    "Assault Mode Archetype Breakdown.html",
    "Azamina Deck Analysis.html",
    "B.E.S. Deck Analysis.html"
)

# HTML template for banlist section
$banlistSectionHTML = @'

        <!-- TCG Banlist Impact Section -->
        <section>
            <div id="banlist-status">
                <!-- Banlist section will be populated by CardLoader.renderBanlistSection -->
            </div>
        </section>
'@

foreach ($page in $pagesToUpdate) {
    $filePath = Join-Path $archetypeDir $page
    
    if (-not (Test-Path $filePath)) {
        Write-Host "Skipping $page - file not found" -ForegroundColor Yellow
        continue
    }
    
    # Read the file
    $content = Get-Content $filePath -Raw
    
    # Check if banlist section already exists
    if ($content -match 'banlist-status|renderBanlistSection') {
        Write-Host "Skipping $page - already has banlist section" -ForegroundColor Green
        continue
    }
    
    # Find the position to insert (before closing </div> that precedes <script>)
    # Look for pattern: </section>\s*</div>\s*<script>
    if ($content -match '(</section>\s*)(</div>\s*<script>)') {
        # Insert banlist section before the closing </div>
        $updatedContent = $content -replace '(</section>\s*)(</div>\s*<script>)', "`$1$banlistSectionHTML`$2"
        
        # Write back to file
        Set-Content -Path $filePath -Value $updatedContent -NoNewline
        Write-Host "Added banlist section to: $page" -ForegroundColor Cyan
    } else {
        Write-Host "Could not find insertion point in: $page" -ForegroundColor Red
    }
}

Write-Host "`nDone! Banlist sections added." -ForegroundColor Green
