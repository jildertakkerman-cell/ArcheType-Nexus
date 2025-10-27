$htmlFiles = (Get-ChildItem -Path "c:\Users\jilde\Documents\VSCode-Projects-main\Apps\ArcheType Nexus" -Filter *.html | Where-Object { $_.Name -ne 'index.html' }).Name
$existing = Get-Content "c:\Users\jilde\Documents\VSCode-Projects-main\Apps\ArcheType Nexus\assets\js\archetypes-data.js" | Select-String "filepath:" | ForEach-Object { $_.Line -replace ".*filepath: '", "" -replace "',", "" }
$missing = $htmlFiles | Where-Object { $_ -notin $existing }
$entries = $missing | ForEach-Object {
    $file = $_
    $name = $file -replace '\.html$', '' -replace ' Deck Analysis', '' -replace ' Archetype Breakdown', '' -replace ' Archetype Deep Dive', '' -replace ' deck analysis', ''
    $description = "A deck analysis for the $name archetype."
    @"
            {
                name: "$name",
                description: "$description",
                filepath: "$file",
                icon: "<svg viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"50\" cy=\"50\" r=\"45\" fill=\"#ccc\" stroke=\"#000\" stroke-width=\"2\"/><text x=\"50\" y=\"57\" text-anchor=\"middle\" font-size=\"10\" fill=\"#000\" font-weight=\"bold\">$name</text></svg>"
            },
"@
}
$entries