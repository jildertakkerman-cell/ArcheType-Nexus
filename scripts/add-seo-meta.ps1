# Adds meta description and canonical tag to all archetype pages.
# Run with -DryRun to preview without writing changes.

param(
    [switch]$DryRun
)

$pagesDir = "C:\Users\jilde\Documents\VSCode-Projects-main\Apps\ArcheType Nexus\pages"
$baseUrl  = "https://archetypesnexus.com/pages"

$skipPages = @(
    "Admin.html",
    "Banlist.html",
    "Card-Browser.html",
    "My-Replays.html",
    "Privacy-Policy.html",
    "Replay-Analyzer.html",
    "Replay-Converter.html",
    "suggestion-form.html",
    "Updates.html"
)

$files = Get-ChildItem -Path $pagesDir -Filter "*.html"

$updated   = 0
$skipped   = 0
$alreadyOk = 0

foreach ($file in $files) {
    if ($skipPages -contains $file.Name) {
        Write-Host "SKIP (utility): $($file.Name)" -ForegroundColor Yellow
        $skipped++
        continue
    }

    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8

    # Derive archetype name from filename
    $archetypeName = $file.BaseName `
        -replace " Deck Analysis$",       "" `
        -replace " Archetype Breakdown$", "" `
        -replace " Archetype Deep Dive$", "" `
        -replace " Archetype Analysis$",  "" `
        -replace " Deck Analyis$",        "" `
        -replace " deck analysis$",       "" `
        -replace " deck Analysis$",       ""

    # Skip if description already present
    if ($content -match 'name="description"') {
        Write-Host "OK (already has description): $($file.Name)" -ForegroundColor DarkGray
        $alreadyOk++
        continue
    }

    # Build the description (plain ASCII dashes to avoid encoding issues)
    $description = "Discover the $archetypeName Yu-Gi-Oh! archetype - deck strategy, combos, banlist status, and card analysis. Part of the Archetype Nexus database sorted by release date and year."

    # URL-encode spaces in the filename for the canonical href
    $encodedName = [Uri]::EscapeDataString($file.Name)
    $canonicalUrl = "$baseUrl/$encodedName"

    $metaDescription = "    <meta name=`"description`" content=`"$description`">"
    $metaCanonical   = "    <link rel=`"canonical`" href=`"$canonicalUrl`">"

    # Insert after the viewport meta tag
    $viewportPattern = '(<meta name="viewport"[^>]*>)'
    $replacement     = "`$1`r`n$metaDescription`r`n$metaCanonical"
    $newContent      = $content -replace $viewportPattern, $replacement

    if ($DryRun) {
        Write-Host "DRY RUN: $($file.Name)" -ForegroundColor Cyan
        Write-Host "  Description : $description" -ForegroundColor Gray
        Write-Host "  Canonical   : $canonicalUrl" -ForegroundColor Gray
    } else {
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.Name)" -ForegroundColor Green
    }
    $updated++
}

Write-Host ""
Write-Host "Done. Updated: $updated | Already had description: $alreadyOk | Skipped: $skipped" -ForegroundColor Magenta
if ($DryRun) {
    Write-Host "(Dry run - no files were written)" -ForegroundColor Yellow
}
