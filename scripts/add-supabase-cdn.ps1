# Add Supabase CDN to all HTML pages that use card-loader.js
# This enables the gameplay tags feature

$pagesDir = "c:\Visual Studio Code\Apps\ArcheType-Nexus\pages"
$supabaseCDN = '    <!-- Supabase CDN for gameplay tags (optional) -->'
$supabaseScript = '    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'

# Pattern to find card-loader.js script inclusion
$cardLoaderPattern = '<script src="../assets/js/card-loader.js"></script>'

$modifiedCount = 0
$skippedCount = 0

Get-ChildItem -Path $pagesDir -Filter "*.html" | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content -Path $filePath -Raw
    
    # Check if card-loader.js is used and Supabase isn't already added
    if ($content -match [regex]::Escape($cardLoaderPattern)) {
        if ($content -notmatch 'supabase-js@2') {
            # Add Supabase CDN before card-loader.js
            $newContent = $content -replace [regex]::Escape($cardLoaderPattern), "$supabaseCDN`r`n$supabaseScript`r`n    $cardLoaderPattern"
            Set-Content -Path $filePath -Value $newContent -NoNewline
            $modifiedCount++
            Write-Host "Modified: $($_.Name)"
        }
        else {
            $skippedCount++
        }
    }
}

Write-Host "`nComplete! Modified $modifiedCount files. Skipped $skippedCount (already had Supabase)."
