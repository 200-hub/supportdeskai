# Stops the SupportDesk AI database and API containers and any Expo server left running.
# Data stays in the Docker volume. Run via "Stop SupportDesk.bat".
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

cmd /c "docker info >nul 2>&1"
if ($LASTEXITCODE -eq 0) {
  Write-Host 'Stopping the database and API...'
  docker compose stop
} else {
  Write-Host 'Docker Desktop is not running, so the database and API are already stopped.'
}

# Expo servers started from this project's frontend folder.
$frontend = Join-Path $root 'frontend'
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Where-Object { $_.CommandLine -match 'expo' -and $_.CommandLine -like "*$frontend*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

Write-Host 'SupportDesk AI is stopped.' -ForegroundColor Green
