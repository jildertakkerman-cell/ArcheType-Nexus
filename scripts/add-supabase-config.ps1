# Add supabase-config.js to all HTML pages that already have the Supabase CDN
# This enables the gameplay tags feature with user credentials

$pagesDir = "c:\Visual Studio Code\Apps\ArcheType-Nexus\pages"
$configScript = '    <script src="../assets/js/supabase-config.js"></script>'

# Pattern to find where Supabase CDN was added (just before card-loader.js)
$insertPattern = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
$cardLoaderLine = '<script src="../assets/js/card-loader.js"></script>'

$modifiedCount = 0
$skippedCount = 0

Get-ChildItem -Path $pagesDir -Filter "*.html" | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content -Path $filePath -Raw
    
    # Check if Supabase CDN is present but config is not
    if ($content -match 'supabase-js@2') {
        if ($content -notmatch 'supabase-config\.js') {
            # Add config script after CDN script and before card-loader
            $newContent = $content -replace [regex]::Escape($insertPattern), "$insertPattern`r`n$configScript"
            Set-Content -Path $filePath -Value $newContent -NoNewline
            $modifiedCount++
            Write-Host "Modified: $($_.Name)"
        }
        else {
            $skippedCount++
        }
    }
}

Write-Host "`nComplete! Modified $modifiedCount files. Skipped $skippedCount (already had config)."
