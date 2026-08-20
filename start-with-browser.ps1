# C Learning Platform - Start server + open browser
# Usage: powershell -ExecutionPolicy Bypass -File start-with-browser.ps1

$PORT = 3000
$URL = "http://localhost:$PORT"
$WORKDIR = "C:\embedded\learning-program"

Write-Host "=== C Learning Platform ===" -ForegroundColor Cyan

# 1. Check if server is already running
$listening = Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue

if ($listening) {
    Write-Host "[1/3] Server already running (port $PORT)" -ForegroundColor Yellow
} else {
    Write-Host "[1/3] Starting server..." -ForegroundColor Green
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run start" -WorkingDirectory $WORKDIR -WindowStyle Minimized
}

# 2. Wait for server to respond (max 30s)
Write-Host "[2/3] Waiting for server..." -ForegroundColor Green
$deadline = (Get-Date).AddSeconds(30)
$ready = $false

while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 800
    try {
        $response = Invoke-WebRequest -Uri $URL -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch {
        # not ready yet - keep waiting
    }
}

if ($ready) {
    Write-Host "[3/3] Server ready! Opening browser..." -ForegroundColor Green
    Start-Process $URL
} else {
    Write-Host "[3/3] No response. Open $URL manually." -ForegroundColor Red
}

Write-Host ""
Write-Host "Server is running in background. To stop it, kill the node process in Task Manager." -ForegroundColor DarkGray