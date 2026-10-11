# scripts/setup-weekly-task.ps1
# Registers a Windows Scheduled Task to run the data update script every Sunday at 12:00 PM.

$TaskName = "ArcheTypeNexus-WeeklyDataUpdate"
$ProjectPath = Resolve-Path (Join-Path $PSScriptRoot "..")
$ScriptPath = Join-Path $ProjectPath "scripts\update-genesys-points.js"

# Find node.exe executable path
$NodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $NodePath) {
    Write-Error "node.exe was not found in PATH. Please install Node.js or ensure it is in your system PATH."
    exit 1
}

Write-Host "Creating/Updating Windows Scheduled Task: $TaskName"
Write-Host "Project Directory: $ProjectPath"
Write-Host "Target Script: $ScriptPath"
Write-Host "Node Executable: $NodePath"

# Use schtasks to create weekly schedule on Sundays at 12:00
$SchtasksCmd = "schtasks /Create /SC WEEKLY /D SUN /TN `"$TaskName`" /TR `"`"$NodePath`" `"$ScriptPath`"`" /ST 12:00 /F"

Invoke-Expression $SchtasksCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccessfully registered weekly scheduled task '$TaskName'!" -ForegroundColor Green
    Write-Host "It will run every Sunday at 12:00 PM."
    Write-Host "You can test-run it anytime by running: schtasks /Run /TN `"$TaskName`""
} else {
    Write-Error "Failed to register scheduled task. If permission was denied, please run PowerShell as Administrator."
}
