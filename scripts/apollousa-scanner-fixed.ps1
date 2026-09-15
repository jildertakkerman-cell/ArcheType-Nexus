# Function to find all HTML files mentioning Apollousa
function Find-ApollousalFiles {
    param (
        [string]$Path = "."
    )
    
    Write-Host "Scanning for files mentioning 'Apollousa'..." -ForegroundColor Green
    
    $htmlFiles = Get-ChildItem -Path $Path -Filter "*.html" -File
    $found = @()
    
    foreach ($file in $htmlFiles) {
        $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -and $content -match "Apollousa") {
            $matches = [regex]::Matches($content, "Apollousa", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            $found += [PSCustomObject]@{
                File = $file.Name
                Path = $file.FullName
                Mentions = $matches.Count
            }
        }
    }
    
    return $found
}

# Function to add banned card warning
function Add-ApollousalWarning {
    param (
        [string]$FilePath
    )
    
    $content = Get-Content -Path $FilePath -Raw
    
    # Check if warning already exists
    if ($content -match "Currently banned in the TCG.*Apollousa") {
        return $false
    }
    
    # Pattern to find Apollousa mentions in endboard descriptions
    $pattern = '((?:End\s*Board|Final\s*Board)[^<]*?Apollousa[^<]*?(?:</p>|</div>|</li>))'
    
    if ($content -match $pattern) {
        $warningHTML = @"
                    <div class="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-4 mt-4 mb-4">
                        <div class="flex items-center">
                            <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                            <h4 class="text-red-400 font-bold">Currently Banned in TCG</h4>
                        </div>
                        <p class="text-red-300 mt-2">Apollousa, Bow of the Goddess is currently banned in the TCG. Modern builds use alternatives like Accesscode Talker or Knightmare Unicorn.</p>
                    </div>
"@
        
        # Insert warning after the first Apollousa endboard mention
        $updatedContent = $content -replace $pattern, ('$1' + $warningHTML)
        
        Set-Content -Path $FilePath -Value $updatedContent -Encoding UTF8
        return $true
    }
    
    return $false
}

# Main execution
Write-Host "=== Apollousa Ban Status Scanner ===" -ForegroundColor Cyan
Write-Host "This script will scan for mentions of Apollousa and add banned card warnings." -ForegroundColor Yellow
Write-Host ""

$found = Find-ApollousalFiles

if ($found.Count -gt 0) {
    Write-Host "Found $($found.Count) files mentioning Apollousa:" -ForegroundColor Green
    foreach ($file in $found) {
        Write-Host "  - $($file.File) ($($file.Mentions) mentions)" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "Adding banned card warnings..." -ForegroundColor Green
    
    $updated = 0
    foreach ($file in $found) {
        Write-Host "Processing: $($file.File)" -ForegroundColor White
        
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
Write-Host "Scan complete!" -ForegroundColor Cyan