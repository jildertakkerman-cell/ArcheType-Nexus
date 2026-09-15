# Fix-DeckResourcesSection.ps1
# Adds the missing CardLoader.renderDeckSearchSection() call to all Deck Analysis pages

$pagesDir = "c:\Visual Studio Code\Apps\ArcheType-Nexus\pages"
$fixedCount = 0
$skippedCount = 0
$errorCount = 0
$fixedFiles = @()

# Get all Deck Analysis HTML files
$htmlFiles = Get-ChildItem -Path $pagesDir -Filter "*Deck Analysis*.html"

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Skip if already has renderDeckSearchSection call
    if ($content -match 'renderDeckSearchSection\(') {
        $skippedCount++
        continue
    }
    
    # Skip if doesn't have the container
    if ($content -notmatch 'deck-resources-container') {
        $skippedCount++
        continue
    }
    
    # Try to extract archetype name from existing calls
    $archetypeName = $null
    
    # Method 1: Extract from renderBanlistSectionByArchetype
    if ($content -match "renderBanlistSectionByArchetype\s*\(\s*['""]banlist-status['""],\s*['""]([^'""]+)['""]") {
        $archetypeName = $matches[1]
    }
    # Method 2: Extract from renderArchetypeCardsBrowser
    elseif ($content -match "renderArchetypeCardsBrowser\s*\(\s*['""]archetype-cards-browser['""],\s*['""]([^'""]+)['""]") {
        $archetypeName = $matches[1]
    }
    # Method 3: Extract from page title
    elseif ($content -match "<title>([^:]+?)(?:\s*[:|-]|Deck Analysis)") {
        $archetypeName = $matches[1].Trim()
    }
    # Method 4: Extract from filename
    else {
        $archetypeName = $file.BaseName -replace " Deck Analysis.*$", ""
    }
    
    if (-not $archetypeName) {
        Write-Host "Could not determine archetype name for: $($file.Name)" -ForegroundColor Yellow
        $errorCount++
        continue
    }
    
    # Escape single quotes in archetype name for JS
    $escapedArchetypeName = $archetypeName -replace "'", "\'"
    
    # The line to insert
    $insertLine = "            await CardLoader.renderDeckSearchSection('deck-resources-container', '$escapedArchetypeName');"
    
    # Try to find an appropriate insertion point
    $modified = $false
    
    # Pattern 1: Insert after renderBanlistSectionByArchetype call (most common)
    if ($content -match "(await\s+CardLoader\.renderBanlistSectionByArchetype\s*\([^)]+\)[^;]*;)") {
        $matchedLine = $matches[1]
        $newContent = $content -replace [regex]::Escape($matchedLine), "$matchedLine`r`n`r`n            // Render deck search section`r`n$insertLine"
        if ($newContent -ne $content) {
            $content = $newContent
            $modified = $true
        }
    }
    # Pattern 2: Insert after CardLoader.renderBanlistSectionByArchetype without await
    elseif ($content -match "(CardLoader\.renderBanlistSectionByArchetype\s*\([^)]+\)[^;]*;)") {
        $matchedLine = $matches[1]
        $newContent = $content -replace [regex]::Escape($matchedLine), "$matchedLine`r`n`r`n            // Render deck search section`r`n$insertLine"
        if ($newContent -ne $content) {
            $content = $newContent
            $modified = $true
        }
    }
    # Pattern 3: Insert before renderArchetypeCardsBrowser if exists
    elseif ($content -match "(// Render archetype cards browser|await\s+CardLoader\.renderArchetypeCardsBrowser)") {
        $matchedLine = $matches[1]
        $newContent = $content -replace [regex]::Escape($matchedLine), "// Render deck search section`r`n$insertLine`r`n`r`n            $matchedLine"
        if ($newContent -ne $content) {
            $content = $newContent
            $modified = $true
        }
    }
    # Pattern 4: Insert before closing script tag as last resort
    elseif ($content -match "(\s*</script>\s*\r?\n\s*<!--\s*Cookie)") {
        $matchedLine = $matches[1]
        $newContent = $content -replace [regex]::Escape($matchedLine), "`r`n            // Render deck search section`r`n$insertLine`r`n        $matchedLine"
        if ($newContent -ne $content) {
            $content = $newContent
            $modified = $true
        }
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $fixedCount++
        $fixedFiles += $file.Name
        Write-Host "Fixed: $($file.Name) -> $archetypeName" -ForegroundColor Green
    } else {
        Write-Host "Could not find insertion point for: $($file.Name)" -ForegroundColor Yellow
        $errorCount++
    }
}

Write-Host "`n========== SUMMARY ==========" -ForegroundColor Cyan
Write-Host "Total files scanned: $($htmlFiles.Count)" -ForegroundColor White
Write-Host "Files fixed: $fixedCount" -ForegroundColor Green
Write-Host "Files skipped (already had call): $skippedCount" -ForegroundColor Gray
Write-Host "Files with errors: $errorCount" -ForegroundColor Yellow

if ($fixedFiles.Count -gt 0) {
    Write-Host "`nFixed files:" -ForegroundColor Cyan
    $fixedFiles | ForEach-Object { Write-Host "  - $_" }
}
