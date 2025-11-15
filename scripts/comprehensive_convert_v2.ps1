# Comprehensive script to convert all remaining HTML files to use CardLoader.loadCards
# This handles multiple patterns of the old card loading functions

$files = Get-ChildItem -Path '.\*.html' -File

$convertedCount = 0
$skippedCount = 0
$alreadyConvertedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    # Skip if already converted (has CardLoader.loadCards and no old functions)
    if ($content -match 'CardLoader\.loadCards' -and
        $content -notmatch 'fetchAndDisplayCardImage|fetchAndProcessCardData|displayCardImage|showPopup|hidePopup') {
        Write-Host 'Already converted:' $file.Name
        $alreadyConvertedCount++
        continue
    }

    # Skip if no old functions
    if ($content -notmatch 'fetchAndDisplayCardImage|fetchAndProcessCardData') {
        $skippedCount++
        continue
    }

    Write-Host 'Processing:' $file.Name

    # Pattern 1: Direct calls like fetchAndDisplayCardImage('card', 'container')
    $directCallPattern = "fetchAndDisplayCardImage\('([^']+)',\s*'([^']+)'\);?"
    $directCalls = [regex]::Matches($content, $directCallPattern)

    if ($directCalls.Count -gt 0) {
        # Build the CardLoader.loadCards object
        $cardMappings = @()
        foreach ($match in $directCalls) {
            $cardName = $match.Groups[1].Value
            $containerId = $match.Groups[2].Value
            $cardMappings += "                '$containerId': '$cardName'"
        }

        # Create the CardLoader call
        $cardLoaderCall = "            CardLoader.loadCards({`n$($cardMappings -join ',`n')`n            });"

        # Remove the direct calls
        $content = [regex]::Replace($content, $directCallPattern, '')

        # Add CardLoader call before the closing script tag
        $content = $content -replace '(?s)(</script>\s*$)', "            $cardLoaderCall`n        `$1"
    }

    # Pattern 2: Variable-based calls with imageContainers object
    if ($content -match 'const imageContainers = \{') {
        # Extract the imageContainers object
        $imageContainersMatch = [regex]::Match($content, 'const imageContainers = \{([^\}]+)\};')
        if ($imageContainersMatch.Success) {
            $containersContent = $imageContainersMatch.Groups[1].Value

            # Convert to CardLoader format
            $cardLoaderCall = "            CardLoader.loadCards({$containersContent});"

            # Remove the old code block
            $oldCodePattern = '(?s)// --- EXISTING SCRIPT FOR CARD IMAGES ---.*?for \(const \[containerId, cardName\] of Object\.entries\(imageContainers\)\) \{\s*fetchAndDisplayCardImage\(cardName, containerId\);\s*\}'
            $content = [regex]::Replace($content, $oldCodePattern, $cardLoaderCall)
        }
    }

    # Pattern 3: fetchAndProcessCardData with cardsToLoad
    if ($content -match 'fetchAndProcessCardData' -and $content -match 'cardsToLoad') {
        # This is more complex - need to find the cardsToLoad definition
        $cardsToLoadMatch = [regex]::Match($content, 'const cardsToLoad = \{([^\}]+)\};')
        if ($cardsToLoadMatch.Success) {
            $cardsContent = $cardsToLoadMatch.Groups[1].Value
            $cardLoaderCall = "            CardLoader.loadCards({$cardsContent});"

            # Remove the old functions and loop
            $oldFunctionsPattern = '(?s)async function fetchAndProcessCardData.*?function hidePopup\(\) \{.*?\}'
            $content = [regex]::Replace($content, $oldFunctionsPattern, '')

            $oldLoopPattern = 'for \(const \[containerId, cardName\] of Object\.entries\(cardsToLoad\)\) \{\s*fetchAndProcessCardData\(cardName, containerId\);\s*\}'
            $content = [regex]::Replace($content, $oldLoopPattern, $cardLoaderCall)
        }
    }

    # Remove any remaining old function definitions
    $content = [regex]::Replace($content, '(?s)async function fetchAndDisplayCardImage.*?(?=\n\s*[a-zA-Z]|\n\s*//|\n\s*\})', '')
    $content = [regex]::Replace($content, '(?s)async function fetchAndProcessCardData.*?(?=\n\s*[a-zA-Z]|\n\s*//|\n\s*\})', '')
    $content = [regex]::Replace($content, '(?s)function displayCardImage.*?(?=\n\s*[a-zA-Z]|\n\s*//|\n\s*\})', '')
    $content = [regex]::Replace($content, '(?s)function showPopup.*?(?=\n\s*[a-zA-Z]|\n\s*//|\n\s*\})', '')
    $content = [regex]::Replace($content, '(?s)function hidePopup.*?(?=\n\s*[a-zA-Z]|\n\s*//|\n\s*\})', '')

    # Clean up empty lines and extra whitespace
    $content = $content -replace '`n\s*`n\s*`n', '`n`n'

    # Save the file
    $content | Set-Content $file.FullName -Encoding UTF8
    $convertedCount++
    Write-Host 'Converted:' $file.Name
}

Write-Host ''
Write-Host 'Conversion Summary:'
Write-Host 'Files converted:' $convertedCount
Write-Host 'Files skipped (no old functions):' $skippedCount
Write-Host 'Files already converted:' $alreadyConvertedCount
Write-Host 'Total files processed:' $files.Count