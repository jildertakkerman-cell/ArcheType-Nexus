# Final cleanup script to handle remaining edge cases
# This removes leftover function definitions and handles mixed patterns

$files = Get-ChildItem -Path '.\*.html' -File

$cleanedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Remove any remaining fetchAndDisplayCardImage function definitions
    $content = [regex]::Replace($content, '(?s)async function fetchAndDisplayCardImage.*?(?=\n\s*[a-zA-Z]|\n\s*//|\n\s*\}|\n\s*CardLoader|\n\s*fetchAnd)', '')

    # Remove any remaining fetchAndProcessCardData function definitions
    $content = [regex]::Replace($content, '(?s)async function fetchAndProcessCardData.*?(?=\n\s*[a-zA-Z]|\n\s*//|\n\s*\}|\n\s*CardLoader|\n\s*fetchAnd)', '')

    # Remove displayCardImage, showPopup, hidePopup function definitions
    $content = [regex]::Replace($content, '(?s)function displayCardImage.*?(?=\n\s*[a-zA-Z]|\n\s*//|\n\s*\}|\n\s*CardLoader)', '')
    $content = [regex]::Replace($content, '(?s)function showPopup.*?(?=\n\s*[a-zA-Z]|\n\s*//|\n\s*\}|\n\s*CardLoader)', '')
    $content = [regex]::Replace($content, '(?s)function hidePopup.*?(?=\n\s*[a-zA-Z]|\n\s*//|\n\s*\}|\n\s*CardLoader)', '')

    # Remove empty imageContainers objects and their loops
    $content = [regex]::Replace($content, '(?s)const imageContainers = \{\s*\};\s*for \(const \[containerId, cardName\] of Object\.entries\(imageContainers\)\) \{\s*fetchAndDisplayCardImage\(cardName, containerId\);\s*\}', '')

    # Remove any remaining direct calls that weren't caught before
    # Handle double quotes for card names
    $content = [regex]::Replace($content, 'fetchAndDisplayCardImage\("[^"]+",\s*''[^'']+''\)\.catch\(\(\) => \{\s*fetchAndDisplayCardImage\("[^"]+",\s*''[^'']+''\);\s*\}\);', '')

    # Remove any remaining loops with cardsToLoad
    $content = [regex]::Replace($content, '(?s)for \(const \[containerId, cardName\] of Object\.entries\(cardsToLoad\)\) \{\s*if\(containerId !== ''[^'']+''\) \{\s*fetchAndDisplayCardImage\(cardName, containerId\);\s*\}\s*\}', '')

    # Clean up extra whitespace
    $content = $content -replace '`n\s*`n\s*`n', '`n`n'

    # Save only if content changed
    if ($content -ne $originalContent) {
        $content | Set-Content $file.FullName -Encoding UTF8
        $cleanedCount++
        Write-Host 'Cleaned:' $file.Name
    }
}

Write-Host ''
Write-Host 'Cleanup Summary:'
Write-Host 'Files cleaned:' $cleanedCount
Write-Host 'Total files processed:' $files.Count