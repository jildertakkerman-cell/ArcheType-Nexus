# PowerShell script to remove redundant card loading functions from HTML files
Get-ChildItem -Filter "*.html" | Where-Object { 
    (Get-Content $_.FullName -Raw) -match "CardLoader\.loadCards" -and 
    (Get-Content $_.FullName -Raw) -match "fetchAndProcessCardData" 
} | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Remove the redundant functions and code
    # Remove const cardDataCache and related functions
    $content = $content -replace '(?s)const cardDataCache = \{\};.*?function fetchAndProcessCardData.*?(?=\s*CardLoader\.loadCards)', '            // --- CARD LOADING ---'
    
    # Remove displayCardImage function
    $content = $content -replace '(?s)function displayCardImage.*?(?=\s*(?:function|CardLoader\.loadCards|const|\}))', ''
    
    # Remove showPopup function
    $content = $content -replace '(?s)function showPopup.*?(?=\s*(?:function|CardLoader\.loadCards|const|\}))', ''
    
    # Remove hidePopup function
    $content = $content -replace '(?s)function hidePopup.*?(?=\s*(?:function|CardLoader\.loadCards|const|\}))', ''
    
    # Remove movePopup function
    $content = $content -replace '(?s)function movePopup.*?(?=\s*(?:function|CardLoader\.loadCards|const|\}))', ''
    
    # Remove global click listener
    $content = $content -replace '\s*document\.addEventListener\(''click'', hidePopup\);', ''
    
    # Remove cardsToLoad object and loop
    $content = $content -replace '(?s)const cardsToLoad = \{.*?\};\s*for \(const \[containerId, cardName\] of Object\.entries\(cardsToLoad\)\) \{\s*fetchAndProcessCardData\(cardName, containerId\);\s*\}', ''
    
    # Remove individual fetchAndProcessCardData calls
    $content = $content -replace 'fetchAndProcessCardData\([^;]+\);\s*', ''
    
    # Clean up extra whitespace
    $content = $content -replace '\n\s*\n\s*\n', "

"
    
    Set-Content $_.FullName $content
    Write-Host "Updated $_.Name"
}
