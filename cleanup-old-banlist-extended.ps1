# Enhanced cleanup script to remove old banlist sections and code from all HTML pages

$pagesPath = "c:\Users\jilde\Documents\VSCode-Projects-main\Apps\ArcheType Nexus"
$pages = Get-ChildItem -Path $pagesPath -Filter "*Deck Analysis.html" -File

Write-Host "Found $($pages.Count) pages to check..." -ForegroundColor Cyan

$cleanedCount = 0
$skippedCount = 0

foreach ($page in $pages) {
    $content = Get-Content $page.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $changed = $false
    
    # Pattern 1: Remove old HTML banlist section (<!-- TCG Banlist Status --> through closing </section>)
    # This handles various formats like "TCG Banlist Status Section", "Live TCG Banlist Status", etc.
    $pattern1 = '(?s)\s*<!--\s*(?:Live\s+)?(?:Current\s+)?TCG\s+Banlist\s+Status(?:\s+Section)?(?:\s+\(Dynamic\))?\s*-->\s*<section[^>]*>.*?<h2[^>]*>(?:Live\s+)?(?:Current\s+)?TCG\s+Banlist\s+Status.*?</h2>.*?<div\s+class="card\s+p-6">.*?<div\s+class="grid.*?</div>\s*</div>\s*</div>\s*</section>'
    if ($content -match $pattern1) {
        $content = $content -replace $pattern1, ''
        $changed = $true
        Write-Host "  - Removed old HTML banlist section" -ForegroundColor Yellow
    }
    
    # Pattern 2: Remove standalone banlist section without comment
    $pattern2 = '(?s)<section[^>]*>\s*<h2[^>]*>(?:Live\s+)?(?:Current\s+)?TCG\s+Banlist\s+Status</h2>.*?<div\s+id="unrestricted-list"[^>]*>.*?</div>.*?<div\s+id="limited-list"[^>]*>.*?</div>.*?</section>'
    if ($content -match $pattern2) {
        $content = $content -replace $pattern2, ''
        $changed = $true
        Write-Host "  - Removed standalone HTML banlist section" -ForegroundColor Yellow
    }
    
    # Pattern 3: Remove JavaScript banlist check code block (// Banlist check or // --- BANLIST CHECKER --- through the fetch/then/catch)
    $pattern3 = '(?s)\s*//\s*(?:---\s*)?(?:Initialize\s+)?Banlist\s+[Cc]heck(?:\s*---)?(?:\s*-\s*Kashtira\s+style)?\s*\n\s*const\s+cardsToCheck\s*=\s*\[[\s\S]*?\]\s*;?\s*\n\s*const\s+unrestrictedList\s*=\s*document\.getElementById\([''"]unrestricted-list[''"]\)\s*;?\s*\n\s*const\s+limitedList\s*=\s*document\.getElementById\([''"]limited-list[''"]\)\s*;?\s*\n\s*const\s+implicationsText\s*=\s*document\.getElementById\([''"]banlist-implications[''"]\)\s*;?\s*\n\s*fetch\([''"]https://db\.ygoprodeck\.com/api/v7/cardinfo\.php\?banlist=tcg[''"]\)[\s\S]*?\.catch\([^)]*\)\s*;?\s*'
    if ($content -match $pattern3) {
        $content = $content -replace $pattern3, "`n"
        $changed = $true
        Write-Host "  - Removed JavaScript banlist check code" -ForegroundColor Yellow
    }
    
    # Pattern 4: Remove variables for banlist checking (unrestrictedList, limitedList, implicationsText)
    $pattern4 = '(?m)^\s*const\s+(?:unrestrictedList|limitedList|implicationsText)\s*=\s*document\.getElementById\([^)]+\)\s*;?\s*\n'
    if ($content -match $pattern4) {
        $content = $content -replace $pattern4, ''
        $changed = $true
        Write-Host "  - Removed banlist variable declarations" -ForegroundColor Yellow
    }
    
    # Pattern 5: Remove cardsToCheck array
    $pattern5 = '(?s)\s*const\s+cardsToCheck\s*=\s*\[[^\]]*\]\s*;?\s*\n'
    if ($content -match $pattern5) {
        $content = $content -replace $pattern5, "`n"
        $changed = $true
        Write-Host "  - Removed cardsToCheck array" -ForegroundColor Yellow
    }
    
    # Pattern 6: Clean up excessive blank lines (more than 2 consecutive)
    $pattern6 = '(?m)^\s*\n\s*\n\s*\n+'
    if ($content -match $pattern6) {
        $content = $content -replace $pattern6, "`n`n"
        $changed = $true
    }
    
    if ($changed) {
        Set-Content -Path $page.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "CLEANED: $($page.Name)" -ForegroundColor Green
        $cleanedCount++
    } else {
        Write-Host "SKIP: $($page.Name) (no old code found)" -ForegroundColor Gray
        $skippedCount++
    }
}

Write-Host "`nCleaned: $cleanedCount pages, Skipped: $skippedCount pages" -ForegroundColor Cyan
Write-Host "NOTE: Verify that pages still have the new banlist section with id='banlist-status'" -ForegroundColor Yellow
