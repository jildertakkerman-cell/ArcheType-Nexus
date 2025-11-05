# PowerShell script to remove old banlist code and replace with new CardLoader method
$archetypeDir = "c:\Users\jilde\Documents\VSCode-Projects-main\Apps\ArcheType Nexus"

$htmlFiles = Get-ChildItem -Path $archetypeDir -Filter "*Deck Analysis.html" | Where-Object { $_.Name -notlike "index.html" }
$htmlFiles += Get-ChildItem -Path $archetypeDir -Filter "*Archetype Breakdown.html"

Write-Host "Found $($htmlFiles.Count) pages to check..." -ForegroundColor Cyan

$processed = 0
$skipped = 0

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $archName = $file.BaseName -replace ' Deck Analysis$', '' -replace ' Archetype Breakdown$', ''
    
    # Check if it has old banlist code patterns
    $hasOldCode = $false
    
    # Pattern 1: fetchBanlistAndCards function
    if ($content -match 'async function fetchBanlistAndCards\(\)') {
        $hasOldCode = $true
        # Remove entire fetchBanlistAndCards function
        $content = $content -replace '(?s)async function fetchBanlistAndCards\(\).*?^\s*\}', ''
    }
    
    # Pattern 2: getBanStatus function
    if ($content -match 'function getBanStatus\(') {
        $hasOldCode = $true
        $content = $content -replace '(?s)function getBanStatus\([^)]*\).*?^\s*\}', ''
    }
    
    # Pattern 3: processCards function
    if ($content -match 'async function processCards\(\)') {
        $hasOldCode = $true
        $content = $content -replace '(?s)async function processCards\(\).*?^\s*\}\}', ''
    }
    
    # Pattern 4: Old tcgBanlist array declarations
    if ($content -match 'const tcgBanlist\s*=\s*\[\];') {
        $hasOldCode = $true
        $content = $content -replace 'const tcgBanlist\s*=\s*\[\];', ''
    }
    
    # Pattern 5: cardsToAnalyze array
    if ($content -match 'const cardsToAnalyze\s*=\s*\[') {
        $hasOldCode = $true
        $content = $content -replace '(?s)const cardsToAnalyze\s*=\s*\[[^\]]*\];', ''
    }
    
    # Pattern 6: cardImageMapping object
    if ($content -match 'const cardImageMapping\s*=\s*\{') {
        $hasOldCode = $true
        $content = $content -replace '(?s)const cardImageMapping\s*=\s*\{[^}]*\};', ''
    }
    
    # Pattern 7: await fetchBanlistAndCards() calls
    if ($content -match 'await fetchBanlistAndCards\(\);') {
        $hasOldCode = $true
        $content = $content -replace '\s*await fetchBanlistAndCards\(\);', ''
    }
    
    # Pattern 8: Old renderBanlistSection with manual card arrays
    if ($content -match 'await CardLoader\.renderBanlistSection\(') {
        # Extract the archetype name and related cards if possible
        if ($content -match "await CardLoader\.renderBanlistSection\('banlist-status',\s*\[(.*?)\],\s*\{(.*?)archetypeName:\s*'([^']+)'") {
            $relatedCardsMatch = $content -match "relatedCards:\s*\[(.*?)\]"
            
            # Replace with new dynamic method
            $newCall = @"


            // Render banlist section - automatically fetches all $archName cards
            await CardLoader.renderBanlistSectionByArchetype('banlist-status', '$archName', {
                relatedCards: []
            });
"@
            
            $content = $content -replace "(?s)await CardLoader\.renderBanlistSection\('banlist-status',.*?\}\);", $newCall
            $hasOldCode = $true
        }
    }
    
    # Clean up excessive whitespace
    $content = $content -replace '\n\s*\n\s*\n+', "`n`n"
    
    if ($hasOldCode -and $content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
        Write-Host "CLEANED: $($file.Name)" -ForegroundColor Cyan
        $processed++
    } else {
        Write-Host "SKIP: $($file.Name) (no old code found)" -ForegroundColor Green
        $skipped++
    }
}

Write-Host "`nCleaned: $processed pages, Skipped: $skipped pages" -ForegroundColor White
Write-Host "NOTE: You may need to add relatedCards arrays manually to some pages" -ForegroundColor Yellow
