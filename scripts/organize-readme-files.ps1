# PowerShell script to organize README files into docs structure
# Use this script when new README files are created outside the docs folder

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $projectDir

Write-Host "📚 README ORGANIZATION TOOL" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Find all README files outside the docs folder
$readmeFiles = Get-ChildItem $projectDir -Recurse -Filter "README*.md" | Where-Object {
    $_.FullName -notlike "*\docs\*" -and 
    $_.FullName -notlike "*\VSCode-Projects-main\*" -and
    $_.Name -ne "README.md"  # Exclude main project README
}

if ($readmeFiles.Count -eq 0) {
    Write-Host "✅ All README files are properly organized in docs folder" -ForegroundColor Green
    exit 0
}

Write-Host "📋 Found $($readmeFiles.Count) README files to organize:" -ForegroundColor Yellow
foreach ($file in $readmeFiles) {
    $relativePath = $file.FullName.Replace($projectDir, "").TrimStart('\')
    Write-Host "   - $relativePath" -ForegroundColor Gray
}

$confirm = Read-Host "`n🔄 Move these files to docs structure? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "❌ Operation cancelled."
    exit 0
}

# Create organization mapping
$docsDir = Join-Path $projectDir "docs"
$devDocsDir = Join-Path $docsDir "development"

foreach ($file in $readmeFiles) {
    $folder = Split-Path -Parent $file.FullName
    $folderName = Split-Path -Leaf $folder
    
    # Determine target location based on source folder
    $targetPath = switch ($folderName) {
        "scripts" { Join-Path $docsDir "scripts-README.md" }
        "dev" { Join-Path $devDocsDir "dev-README.md" }
        "archive" { 
            if ($folder -like "*\js\archive") {
                Join-Path $devDocsDir "js-archive-README.md"
            } else {
                Join-Path $devDocsDir "$folderName-README.md"
            }
        }
        default { Join-Path $devDocsDir "$folderName-README.md" }
    }
    
    try {
        Move-Item $file.FullName $targetPath -Force
        Write-Host "✅ Moved: $($file.Name) → $($targetPath.Replace($projectDir, '').TrimStart('\'))" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to move: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n📋 ORGANIZATION COMPLETE!" -ForegroundColor Cyan
Write-Host "🔄 Next steps:"
Write-Host "1. Update docs\README.md with new file references"
Write-Host "2. Update main README.md if needed"
Write-Host "3. Verify all documentation links still work"