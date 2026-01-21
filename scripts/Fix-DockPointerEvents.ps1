# Fix-DockPointerEvents.ps1
# Adds pointer-events-none to the decorative glow element in the dock design
# so it doesn't block clicks on the buttons.

$pagesDir = "c:\Visual Studio Code\Apps\ArcheType-Nexus\pages"
$htmlFiles = Get-ChildItem -Path $pagesDir -Filter "*.html" -Recurse

$modified = 0

foreach ($file in $htmlFiles) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        # We target the specific div string
        $oldGlow = '<div class="absolute inset-0 bg-indigo-500/20 blur-xl -z-10 rounded-full opacity-50"></div>'
        $newGlow = '<div class="absolute inset-0 bg-indigo-500/20 blur-xl -z-10 rounded-full opacity-50 pointer-events-none"></div>'
        
        if ($content -match [regex]::Escape($oldGlow)) {
            $content = $content -replace [regex]::Escape($oldGlow), $newGlow
        }

        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "[FIXED] $($file.Name)" -ForegroundColor Green
            $modified++
        }
    }
    catch {
        Write-Host "[ERROR] $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host "Total Files Fixed: $modified" -ForegroundColor Cyan
