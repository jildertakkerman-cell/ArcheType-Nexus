# Update-CardBrowserButton.ps1
# Updates the Archetype Card Browser button text to be more descriptive across all pages.
# It removes the hardcoded "View All Cards" option so the new default "Browse [Archetype] Cards" is used.

$pagesDir = "c:\Visual Studio Code\Apps\ArcheType-Nexus\pages"
$htmlFiles = Get-ChildItem -Path $pagesDir -Filter "*.html" -Recurse

$modified = 0

foreach ($file in $htmlFiles) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        # Remove the buttonText line from the options object
        # Pattern matches: buttonText: 'View All Cards', (with optional trailing comma and whitespace)
        $content = $content -replace "buttonText:\s*'View All Cards',?\s*\r?\n\s*", ""
        $content = $content -replace 'buttonText:\s*"View All Cards",?\s*\r?\n\s*', ""
        
        # Also clean up any potential empty lines left behind or malformed objects?
        # The regex above includes the newline, so it should be fine.
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "[UPDATED] $($file.Name)" -ForegroundColor Green
            $modified++
        }
    }
    catch {
        Write-Host "[ERROR] $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host "Total Pages Updated: $modified" -ForegroundColor Cyan
