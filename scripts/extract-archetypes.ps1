# PowerShell script to extract archetype data from index.html
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$indexFile = Join-Path (Split-Path -Parent $scriptDir) "index.html"
$outputFile = Join-Path (Split-Path -Parent $scriptDir) "assets\js\archetypes-data-complete.js"

Write-Host "Extracting archetype data from $indexFile..."

# Read the entire file
$content = Get-Content $indexFile -Raw

# Find the start pattern (with exact spacing from line 350)
$startPattern = "const archetypes = ["
$startIndex = $content.IndexOf($startPattern)

if ($startIndex -eq -1) {
    Write-Error "Could not find start of archetype array"
    exit 1
}

# Find the end pattern - look for the closing bracket with same indentation
$remainingContent = $content.Substring($startIndex)
$endMatch = [regex]::Match($remainingContent, "\s+\];")

if (-not $endMatch.Success) {
    Write-Error "Could not find end of archetype array"
    exit 1
}

$endIndex = $startIndex + $endMatch.Index + $endMatch.Length

# Extract the archetypes array (remove the leading spaces to clean it up)
$archetypeData = $content.Substring($startIndex, $endIndex - $startIndex).Trim()

# Create the complete JavaScript file
$jsContent = @"
// Complete archetype data extracted from index.html
// Generated on $(Get-Date)
// Total file size: $([math]::Round(($archetypeData.Length / 1KB), 2)) KB

$archetypeData

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = archetypes;
}
"@

# Write to output file
$jsContent | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "✅ Archetype data extracted successfully!"
Write-Host "📁 Output file: $outputFile"
Write-Host "📊 File size: $([math]::Round(((Get-Item $outputFile).Length / 1KB), 2)) KB"

# Count the number of archetypes
$archetypeCount = ($archetypeData | Select-String -Pattern "name:" -AllMatches).Matches.Count
Write-Host "🎯 Total archetypes: $archetypeCount"

Write-Host "`n🔄 Next steps:"
Write-Host "1. Review the generated file: $outputFile"
Write-Host "2. Replace the current archetypes-data.js with this complete version"
Write-Host "3. Test the refactored index.html"