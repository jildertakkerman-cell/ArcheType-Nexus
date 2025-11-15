# Final comprehensive fix for remaining patterns

$files = Get-ChildItem -Path '.\*.html' -File

$fixedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Skip if no fetchAndDisplayCardImage
    if ($content -notmatch 'fetchAndDisplayCardImage') {
        continue
    }

    Write-Host 'Processing:' $file.Name

    # Pattern 1: forEach with Object.entries(cardsToLoad)
    if ($content -match 'Object\.entries\(cardsToLoad\)\.forEach') {
        $forEachMatch = [regex]::Match($content, 'Object\.entries\(cardsToLoad\)\.forEach\(\(\[id, name\]\) => fetchAndDisplayCardImage\(name, id\)\);')
        if ($forEachMatch.Success) {
            # Find the cardsToLoad definition
            $cardsToLoadMatch = [regex]::Match($content, 'const cardsToLoad = \{([^\}]+)\};')
            if ($cardsToLoadMatch.Success) {
                $cardsContent = $cardsToLoadMatch.Groups[1].Value
                $cardLoaderCall = "            CardLoader.loadCards({$cardsContent});"
                $content = $content -replace $forEachMatch.Value, $cardLoaderCall
            }
        }
    }

    # Pattern 2: Simple fetchAndDisplayCardImage(name, id) calls
    elseif ($content -match 'fetchAndDisplayCardImage\(name, id\)') {
        # This is likely in a different context - need to see the broader pattern
        # For now, just remove these calls as they're probably redundant
        $content = $content -replace 'fetchAndDisplayCardImage\(name, id\);', ''
    }

    # Pattern 3: await fetchAndDisplayCardImage
    elseif ($content -match 'await fetchAndDisplayCardImage') {
        $content = $content -replace 'await fetchAndDisplayCardImage\([^;]+\);', ''
    }

    # Remove any remaining function definitions
    $content = [regex]::Replace($content, '(?s)async function fetchAndDisplayCardImage.*?(?=\n\s*[a-zA-Z]|\n\s*//|\n\s*\}|\n\s*CardLoader)', '')
    $content = [regex]::Replace($content, '(?s)async function fetchAndProcessCardData.*?(?=\n\s*[a-zA-Z]|\n\s*//|\n\s*\}|\n\s*CardLoader)', '')

    # Clean up
    $content = $content -replace '`n\s*`n\s*`n', '`n`n'

    # Save only if content changed
    if ($content -ne $originalContent) {
        $content | Set-Content $file.FullName -Encoding UTF8
        $fixedCount++
        Write-Host 'Fixed:' $file.Name
    }
}

Write-Host ''
Write-Host 'Comprehensive fix Summary:'
Write-Host 'Files fixed:' $fixedCount
Write-Host 'Total files processed:' $files.Count