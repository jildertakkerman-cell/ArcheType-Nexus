# PowerShell script to create a lightweight version for initial loading
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceFile = Join-Path (Split-Path -Parent $scriptDir) "assets\js\archive\archetypes-data.js"
$lightFile = Join-Path (Split-Path -Parent $scriptDir) "assets\js\archive\archetypes-light.js"

Write-Host "Creating lightweight archetype data for faster initial loading..."

# Read the source file
$content = Get-Content $sourceFile -Raw

# Extract just the basic info (name, description, filepath) without SVG icons
$lightData = @"
// Lightweight archetype data for fast initial loading
// Full icons loaded on demand
const archetypesLight = [
"@

# Use regex to extract basic archetype info
$pattern = '(?s)\{\s*name:\s*[''"]([^''"]*)[''"],\s*description:\s*[''"]([^''"]*)[''"],\s*filepath:\s*[''"]([^''"]*)[''"]'
$matches = [regex]::Matches($content, $pattern)

$archetypeEntries = @()
foreach ($match in $matches) {
    $name = $match.Groups[1].Value
    $description = $match.Groups[2].Value
    $filepath = $match.Groups[3].Value
    
    $entry = @"
    {
        name: '$name',
        description: '$description',
        filepath: '$filepath',
        iconLoaded: false
    }
"@
    $archetypeEntries += $entry
}

$lightData += $archetypeEntries -join ",`n"
$lightData += @"

];

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = archetypesLight;
}
"@

# Write to light file
$lightData | Out-File -FilePath $lightFile -Encoding UTF8

Write-Host "✅ Lightweight data created!"
Write-Host "📁 Original file: $([math]::Round(((Get-Item $sourceFile).Length / 1KB), 2)) KB"
Write-Host "📁 Light file: $([math]::Round(((Get-Item $lightFile).Length / 1KB), 2)) KB"
Write-Host "🚀 Reduction: $([math]::Round((1 - (Get-Item $lightFile).Length / (Get-Item $sourceFile).Length) * 100, 1))%"