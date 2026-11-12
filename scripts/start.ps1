# Starts everything SupportDesk AI needs: Docker Desktop, the database and API containers,
# the app's packages, and the Expo dev server (QR code for Expo Go). Run via "Start SupportDesk.bat".
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$Host.UI.RawUI.WindowTitle = 'SupportDesk AI'

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Fail($msg) {
  Write-Host "`nCould not start: $msg" -ForegroundColor Red
  exit 1
}
function Wait-Until($seconds, [scriptblock]$test) {
  $deadline = (Get-Date).AddSeconds($seconds)
  while ((Get-Date) -lt $deadline) {
    if (& $test) { return $true }
    Start-Sleep -Seconds 3
  }
  return $false
}

# 1. Tools ---------------------------------------------------------------------------------
Step 'Checking Docker and Node.js'
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Start-Process 'https://www.docker.com/products/docker-desktop/'
  Fail 'Docker Desktop is not installed. The download page is open; install it, then run this again.'
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Start-Process 'https://nodejs.org/en/download'
  Fail 'Node.js is not installed. The download page is open; install the LTS version, then run this again.'
}

# 2. Docker Desktop --------------------------------------------------------------------------
function Test-Docker { cmd /c "docker info >nul 2>&1"; return $LASTEXITCODE -eq 0 }
if (-not (Test-Docker)) {
  Step 'Starting Docker Desktop (this can take a minute)'
  $dockerExe = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
  if (-not (Test-Path $dockerExe)) { Fail "Docker Desktop not found at $dockerExe." }
  Start-Process $dockerExe
  if (-not (Wait-Until 240 { Test-Docker })) { Fail 'Docker Desktop did not start within 4 minutes. Open it once by hand, accept any prompts, then run this again.' }
}

# 3. Database + API ---------------------------------------------------------------------------
Step 'Starting the database and API (the first run downloads and builds; later runs are quick)'
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { Fail 'docker compose failed (see the messages above). If port 5432 or 8000 is in use by another program, close it and try again.' }

Write-Host 'Waiting for the API to answer...'
$apiUp = Wait-Until 180 {
  try { (Invoke-WebRequest 'http://localhost:8000/health' -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200 } catch { $false }
}
if (-not $apiUp) {
  docker compose logs backend --tail 40
  Fail 'The API did not start (its last log lines are above).'
}
Write-Host 'API is running.' -ForegroundColor Green

# The container only migrates when it starts; run it again so updated code always gets its tables.
Step 'Updating the database tables'
docker compose exec -T backend alembic upgrade head
if ($LASTEXITCODE -ne 0) { Fail 'The database update failed (see the messages above).' }

# Demo logins (admin / agent / customer). Skips accounts that already exist.
Step 'Making sure the demo accounts exist'
docker compose exec -T backend python scripts/seed_demo_accounts.py
if ($LASTEXITCODE -ne 0) { Write-Host 'Could not create the demo accounts (see above). You can still sign up in the app.' -ForegroundColor Yellow }

# 4. Laptop's Wi-Fi / LAN address -------------------------------------------------------------
$ip = (Get-NetIPConfiguration |
  Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } |
  Select-Object -First 1).IPv4Address.IPAddress
if (-not $ip) { Fail 'No network connection found. Connect to Wi-Fi and run this again.' }

# Phones reach the API through Docker Desktop; make sure the firewall lets them on this network.
$category = (Get-NetConnectionProfile | Where-Object { $_.IPv4Connectivity -ne 'Disconnected' } | Select-Object -First 1).NetworkCategory
$allowed = Get-NetFirewallRule -Direction Inbound -Enabled True -Action Allow -ErrorAction SilentlyContinue |
  Where-Object { $_.DisplayName -like 'Docker Desktop Backend*' -or $_.DisplayName -eq 'SupportDesk AI API' } |
  Where-Object { $_.Profile -eq 'Any' -or "$($_.Profile)" -match "$category" }
if (-not $allowed) {
  Step 'Allowing phones to reach the API through Windows Firewall (click Yes on the prompt)'
  $cmd = "New-NetFirewallRule -DisplayName 'SupportDesk AI API' -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow -Profile Any"
  try { Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile', '-Command', $cmd }
  catch { Write-Host 'Skipped. The app works on this PC, but a phone may not reach the API.' -ForegroundColor Yellow }
}

# 5. App packages -----------------------------------------------------------------------------
Set-Location (Join-Path $root 'frontend')
$stamp = 'node_modules\.package-lock.json'
if (-not (Test-Path $stamp) -or (Get-Item 'package-lock.json').LastWriteTime -gt (Get-Item $stamp).LastWriteTime) {
  Step 'Installing the app packages (first run only, a few minutes)'
  npm install --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { Fail 'npm install failed (see above). Check the internet connection and run this again.' }
}

# 6. Expo -------------------------------------------------------------------------------------
$port = 8081..8090 | Where-Object { -not (Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue) } | Select-Object -First 1
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
$env:EXPO_PUBLIC_API_URL = "http://${ip}:8000"

Write-Host ''
Write-Host '  SupportDesk AI is starting' -ForegroundColor Green
Write-Host "  Phone (Expo Go):  scan the QR code below, or enter  exp://${ip}:$port"
Write-Host "  API check:        http://${ip}:8000/health  (open on the phone's browser if the app can't connect)"
Write-Host '  Demo logins:      admin@demo.com / agent@demo.com / customer@demo.com, password Password123!'
Write-Host '  In this browser:  press  w  once the QR code appears'
Write-Host '  Phone and PC must be on the same Wi-Fi. Close this window to stop the app;'
Write-Host '  run "Stop SupportDesk.bat" to also stop the database and API.'
Write-Host ''

npx expo start --lan --port $port
