# start-slack-worker.ps1 — Launch slackWorker.ts in a new PowerShell window
# Usage: powershell -File backend/scripts/start-slack-worker.ps1

$backendDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$backendDir = Join-Path $backendDir "backend"

# If invoked from within backend/scripts, resolve correctly
if (!(Test-Path (Join-Path $backendDir "package.json"))) {
    $backendDir = Split-Path -Parent $PSScriptRoot
}

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$backendDir'; Write-Host '=== Slack Worker ===' -ForegroundColor Cyan; npx tsx watch src/workers/slackWorker.ts"
)

Write-Host "Slack worker launched in new PowerShell window." -ForegroundColor Green
