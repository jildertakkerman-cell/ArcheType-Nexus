# PowerShell script to find and update mentions of banned cards across all HTML files
# This script identifies files mentioning banned cards and provides options to update them

param(
    [switch]$FindOnly = $false,
    [switch]$UpdateAll = $false,
    [string]$BannedCard = "Apollousa"
)

$rootPath = "c:\Users\jilde\Downloads\Hobby-20250926T223016Z-1-001\Hobby"

# List of currently banned cards to check for
$bannedCards = @{
    "Apollousa" = @{
        "FullName" = "Apollousa, Bow of the Goddess"
        "Alternatives" = @("Accesscode Talker", "Knightmare Unicorn", "Borreload Dragon")
        "Type" = "Link Monster"
    }
    "Cyber-Stein" = @{
        "FullName" = "Cyber-Stein"
        "Alternatives" = @("Alternative FTK engines", "Control strategies")
        "Type" = "Effect Monster"
    }
    "Maxx C" = @{
        "FullName" = "Maxx 'C'"
        "Alternatives" = @("Ash Blossom & Joyous Spring", "Effect Veiler")
        "Type" = "Hand Trap"
    }
}

function Find-BannedCardMentions {
    param([string]$CardName)
    
    $files = Get-ChildItem -Path $rootPath -Name "*.html" | Where-Object { 
        $_ -notlike "*index*" -and $_ -notlike "*backup*" -and $_ -notlike "*dev*" 
    }
    
    $foundFiles = @()
    
    foreach ($file in $files) {
        $filePath = Join-Path $rootPath $file
        $content = Get-Content -Path $filePath -Raw -Encoding UTF8
        
        if ($content -match $CardName) {
            $cardMatches = [regex]::Matches($content, $CardName, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            $foundFiles += @{
                "File" = $file
                "Path" = $filePath
                "Matches" = $cardMatches.Count
            }
        }
    }
    
    return $foundFiles
}

function Add-BannedCardWarning {
    param(
        [string]$FilePath,
        [string]$CardName,
        [hashtable]$CardInfo
    )
    
    try {
        $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
        $originalContent = $content
        
        # Check if warning already exists
        if ($content -match "BANNED IN TCG" -or $content -match "banned.*TCG") {
            return $false
        }
        
        # Pattern to find endboard sections or sections mentioning the card
        $patterns = @(
            # Look for sections with the card name as a heading
            "(<h[1-6][^>]*>[^<]*$CardName[^<]*</h[1-6]>)",
            # Look for card descriptions in divs
            "(<div[^>]*>[^<]*$CardName[^<]*)",
            # Look for mentions in paragraphs
            "(<p[^>]*>[^<]*$CardName[^<]*)"
        )
        
        $updated = $false
        foreach ($pattern in $patterns) {
            if ($content -match $pattern) {
                # Add warning before the first significant mention
                $warningHTML = @"
                <div class="bg-red-900 border border-red-600 p-3 rounded-lg mb-4">
                    <p class="text-red-200 font-bold text-center"><i class="fas fa-ban mr-2"></i>TCG STATUS: $($CardInfo.FullName) is currently banned in official TCG play.</p>
                </div>
"@
                
                # Find a good place to insert the warning (before a section or major content block)
                $insertPatterns = @(
                    "(<section[^>]*>)",
                    "(<div[^>]*class=[^>]*card[^>]*>)",
                    "(<h[1-6][^>]*>[^<]*$CardName)"
                )
                
                foreach ($insertPattern in $insertPatterns) {
                    if ($content -match $insertPattern -and !$updated) {
                        $content = $content -replace $insertPattern, "$warningHTML`n`$1"
                        $updated = $true
                        break
                    }
                }
                break
            }
        }
        
        # Save if changed
        if ($updated -and $content -ne $originalContent) {
            Set-Content -Path $FilePath -Value $content -Encoding UTF8
            return $true
        }
        
        return $false
        
    } catch {
        Write-Host "  Error updating $FilePath`: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host "Yu-Gi-Oh! Banned Card Scanner" -ForegroundColor Cyan
Write-Host "=" * 40 -ForegroundColor Cyan
Write-Host ""

if ($FindOnly -or (!$UpdateAll -and !$BannedCard)) {
    Write-Host "Scanning for mentions of banned cards..." -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($card in $bannedCards.Keys) {
        Write-Host "Searching for: $card" -ForegroundColor White
        $found = Find-BannedCardMentions -CardName $card
        
        if ($found.Count -gt 0) {
            Write-Host "  Found in $($found.Count) files:" -ForegroundColor Green
            foreach ($file in $found) {
                Write-Host "    $($file.File) ($($file.Matches) mentions)" -ForegroundColor Gray
            }
        } else {
            Write-Host "  No mentions found" -ForegroundColor Gray
        }
        Write-Host ""
    }
    
} elseif ($UpdateAll) {
    Write-Host "Updating all files with banned card warnings..." -ForegroundColor Yellow
    Write-Host ""
    
    $totalUpdated = 0
    
    foreach ($card in $bannedCards.Keys) {
        Write-Host "Processing: $card" -ForegroundColor White
        $found = Find-BannedCardMentions -CardName $card
        $cardInfo = $bannedCards[$card]
        
        foreach ($file in $found) {
            Write-Host "  Updating: $($file.File)" -ForegroundColor Gray
            if (Add-BannedCardWarning -FilePath $file.Path -CardName $card -CardInfo $cardInfo) {
                Write-Host "    ✓ Added warning" -ForegroundColor Green
                $totalUpdated++
            } else {
                Write-Host "    - Already has warning or no suitable location" -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host ""
    Write-Host "Summary: Updated $totalUpdated files" -ForegroundColor Cyan
    
} elseif ($BannedCard -and $bannedCards.ContainsKey($BannedCard)) {
    Write-Host "Processing specific card: $BannedCard" -ForegroundColor Yellow
    Write-Host ""
    
    $found = Find-BannedCardMentions -CardName $BannedCard
    $cardInfo = $bannedCards[$BannedCard]
    $updated = 0
    
    foreach ($file in $found) {
        Write-Host "Updating: $($file.File)" -ForegroundColor Gray
        if (Add-BannedCardWarning -FilePath $file.Path -CardName $BannedCard -CardInfo $cardInfo) {
            Write-Host "  ✓ Added warning" -ForegroundColor Green
            $updated++
        } else {
            Write-Host "  - Already has warning or no suitable location" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "Updated $updated files" -ForegroundColor Cyan
    
} else {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  Scan for banned cards:" -ForegroundColor White
    Write-Host "    .\banned-card-scanner.ps1 -FindOnly" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Update specific card:" -ForegroundColor White
    Write-Host "    .\banned-card-scanner.ps1 -BannedCard 'Apollousa'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Update all:" -ForegroundColor White
    Write-Host "    .\banned-card-scanner.ps1 -UpdateAll" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Available banned cards:" -ForegroundColor Green
    foreach ($card in $bannedCards.Keys) {
        Write-Host "  - $card ($($bannedCards[$card].FullName))" -ForegroundColor White
    }
}