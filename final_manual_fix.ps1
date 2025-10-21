# Final manual fix for remaining files with mixed patterns

$files = Get-ChildItem -Path '.\*.html' -File

$fixedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Check if file still has fetchAndDisplayCardImage
    if ($content -notmatch 'fetchAndDisplayCardImage') {
        continue
    }

    Write-Host 'Processing:' $file.Name

    # Pattern: Mixed fetchAndProcessCardData and fetchAndDisplayCardImage with same imageContainers
    if ($content -match 'fetchAndProcessCardData' -and $content -match 'fetchAndDisplayCardImage' -and $content -match 'imageContainers') {
        # Extract the imageContainers object
        $imageContainersMatch = [regex]::Match($content, 'const imageContainers = \{([^\}]+)\};')
        if ($imageContainersMatch.Success) {
            $containersContent = $imageContainersMatch.Groups[1].Value
            $cardLoaderCall = "            CardLoader.loadCards({$containersContent});"

            # Remove both loops
            $content = [regex]::Replace($content, '(?s)for \(const \[containerId, cardName\] of Object\.entries\(imageContainers\)\) \{\s*fetchAndProcessCardData\(cardName, containerId\);\s*\}', '')
            $content = [regex]::Replace($content, '(?s)for \(const \[containerId, cardName\] of Object\.entries\(imageContainers\)\) \{\s*fetchAndDisplayCardImage\(cardName, containerId\);\s*\}', $cardLoaderCall)
        }
    }

    # Pattern: Only fetchAndDisplayCardImage with imageContainers
    elseif ($content -match 'fetchAndDisplayCardImage' -and $content -match 'imageContainers') {
        # Extract the imageContainers object
        $imageContainersMatch = [regex]::Match($content, 'const imageContainers = \{([^\}]+)\};')
        if ($imageContainersMatch.Success) {
            $containersContent = $imageContainersMatch.Groups[1].Value
            $cardLoaderCall = "            CardLoader.loadCards({$containersContent});"

            # Replace the loop
            $content = [regex]::Replace($content, '(?s)for \(const \[containerId, cardName\] of Object\.entries\(imageContainers\)\) \{\s*fetchAndDisplayCardImage\(cardName, containerId\);\s*\}', $cardLoaderCall)
        }
    }

    # Remove any remaining function definitions
    $content = [regex]::Replace($content, '(?s)async function fetchAndDisplayCardImage.*?(?=\n\s*[a-zA-Z]|\n\s*//|\n\s*\}|\n\s*CardLoader)', '')
    $content = [regex]::Replace($content, '(?s)async function fetchAndProcessCardData.*?(?=\n\s*[a-zA-Z]|\n\s*//|\n\s*\}|\n\s*CardLoader)', '')
    $content = [regex]::Replace($content, '(?s)function displayCardImage.*?(?=\n\s*[a-zA-Z]|\n\s*//|\n\s*\}|\n\s*CardLoader)', '')
    $content = [regex]::Replace($content, '(?s)function showPopup.*?(?=\n\s*[a-zA-Z]|\n\s*//|\n\s*\}|\n\s*CardLoader)', '')
    $content = [regex]::Replace($content, '(?s)function hidePopup.*?(?=\n\s*[a-zA-Z]|\n\s*//|\n\s*\}|\n\s*CardLoader)', '')

    # Clean up extra whitespace
    $content = $content -replace '`n\s*`n\s*`n', '`n`n'

    # Save only if content changed
    if ($content -ne $originalContent) {
        $content | Set-Content $file.FullName -Encoding UTF8
        $fixedCount++
        Write-Host 'Fixed:' $file.Name
    }
}

Write-Host ''
Write-Host 'Final fix Summary:'
Write-Host 'Files fixed:' $fixedCount
Write-Host 'Total files processed:' $files.Count