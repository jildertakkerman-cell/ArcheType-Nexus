# PowerShell script to find and update mentions of Apollousa across all HTML files

$rootPath = "c:\Users\jilde\Downloads\Hobby-20250926T223016Z-1-001\Hobby"

function Find-ApollousalMentions {
    $files = Get-ChildItem -Path $rootPath -Name "*.html" | Where-Object { 
        $_ -notlike "*index*" -and $_ -notlike "*backup*" -and $_ -notlike "*dev*" 
    }
    
    $foundFiles = @()
    
    foreach ($file in $files) {
        $filePath = Join-Path $rootPath $file
        $content = Get-Content -Path $filePath -Raw -Encoding UTF8
        
        if ($content -match "Apollousa") {
            $cardMatches = [regex]::Matches($content, "Apollousa", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            $foundFiles += @{
                "File" = $file
                "Path" = $filePath
                "Matches" = $cardMatches.Count
            }
        }
    }
    
    return $foundFiles
}

function Add-ApollousalWarning {
    param([string]$FilePath)
    
    try {
        $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
        $originalContent = $content
        
        # Check if warning already exists
        if ($content -match "BANNED IN TCG" -or $content -match "banned.*TCG") {
            return $false
        }
        
        # Look for endboard sections or major sections mentioning Apollousa
        $patterns = @(
            "(<h[1-6][^>]*>[^<]*Apollousa[^<]*</h[1-6]>)",
            "(<section[^>]*>[^<]*Apollousa)",
            "(<div[^>]*class=[^>]*card[^>]*>[^<]*Apollousa)"
        )
        
        $updated = $false
        foreach ($pattern in $patterns) {
            if ($content -match $pattern) {
                # Find the section containing Apollousa
                $apollousaPattern = '(<section[^>]*>[^<]*(?:endboard|boss|monsters?)[^<]*</h[1-6]>)'
                if ($content -match $apollousaPattern) {
                    $warningHTML = @"
            <div class="bg-red-900 border border-red-600 p-4 rounded-lg mb-6">
                <p class="text-red-200 font-bold text-center"><i class="fas fa-exclamation-triangle mr-2"></i>Note: Apollousa, Bow of the Goddess is currently banned in TCG play. Modern builds use alternatives like Accesscode Talker or Knightmare Unicorn.</p>
            </div>
"@
                    
                    # Insert warning after the section header
                    $content = $content -replace $apollousaPattern, "`$1`n$warningHTML"
                    $updated = $true
                    break
                }
            }
        }
        
        # Alternative: Look for specific card mentions and add inline warnings
        if (!$updated) {
            $apollousaCardPattern = '(<h[1-6][^>]*>[^<]*Apollousa[^<]*</h[1-6]>)'
            if ($content -match $apollousaCardPattern) {
                $inlineWarning = @"
                    <div class="bg-red-900 border border-red-600 p-2 rounded mb-3">
                        <p class="text-red-200 text-sm font-bold text-center"><i class="fas fa-ban mr-1"></i>BANNED IN TCG</p>
                    </div>
"@
                
                # Add warning before the card title
                $content = $content -replace $apollousaCardPattern, "$inlineWarning`n`$1"
                $updated = $true
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
Write-Host "Apollousa Banned Card Scanner" -ForegroundColor Cyan
Write-Host "=" * 35 -ForegroundColor Cyan
Write-Host ""

Write-Host "Scanning for mentions of Apollousa..." -ForegroundColor Yellow
$found = Find-ApollousalMentions

if ($found.Count -gt 0) {
    Write-Host "Found Apollousa in $($found.Count) files:" -ForegroundColor Green
    Write-Host ""
    
    $updated = 0
    foreach ($file in $found) {
        Write-Host "Processing: $($file.File) ($($file.Matches) mentions)" -ForegroundColor White
        
        if (Add-ApollousalWarning -FilePath $file.Path) {
            Write-Host "  ✓ Added banned card warning" -ForegroundColor Green
            $updated++
        } else {
            Write-Host "  - Already has warning or could not find suitable location" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "Files with Apollousa: $($found.Count)" -ForegroundColor White
    Write-Host "Files updated: $updated" -ForegroundColor Green
    
} else {
    Write-Host "No mentions of Apollousa found." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Files that mentioned Apollousa:" -ForegroundColor Yellow
foreach ($file in $found) {
    Write-Host "  - $($file.File)" -ForegroundColor Gray
}