# Brings up everything needed to use https://onwax.test, then prints a status board.
#
# Self-running services (Caddy + Acrylic DNS) auto-start on boot; this script only
# verifies them and handles the volatile pieces: Docker + onwax-db, backend, Vite.
#
# Spotify creds come from secrets.local.ps1 (gitignored). Backend + Vite each launch
# in their own window so you can watch logs / Ctrl+C them.

$root        = $PSScriptRoot
$client      = Join-Path $root 'on-wax-client'
$secretsFile = Join-Path $root 'secrets.local.ps1'

function Write-Status($label, $ok, $detail = '') {
    $mark  = if ($ok) { '[ OK ]' } else { '[FAIL]' }
    $color = if ($ok) { 'Green' } else { 'Red' }
    Write-Host ("{0}  {1} {2}" -f $mark, $label, $detail) -ForegroundColor $color
}

Write-Host "`n=== on-wax startup ===" -ForegroundColor Cyan

# --- Spotify creds ---
if (-not (Test-Path $secretsFile)) {
    Write-Status 'Spotify creds' $false "missing $secretsFile (see start-onwax.ps1 header)"
    return
}
. $secretsFile
if (-not $env:SPOTIFY_CLIENT_ID -or -not $env:SPOTIFY_CLIENT_SECRET) {
    Write-Status 'Spotify creds' $false 'secrets.local.ps1 did not set CLIENT_ID/SECRET'
    return
}
Write-Status 'Spotify creds' $true 'loaded from secrets.local.ps1'

# --- Self-running services (informational) ---
$caddy = Get-Service caddy -ErrorAction SilentlyContinue
Write-Status 'Caddy service (443)' ($caddy.Status -eq 'Running') "$($caddy.Status)"
$acr = Get-Service AcrylicDNSProxySvc -ErrorAction SilentlyContinue
Write-Status 'Acrylic DNS service' ($acr.Status -eq 'Running') "$($acr.Status)"

# --- Docker daemon ---
docker ps *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Docker daemon down; starting Docker Desktop (give it a minute)...' -ForegroundColor Yellow
    $dd = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
    if (Test-Path $dd) { Start-Process $dd }
    for ($i = 0; $i -lt 36; $i++) { Start-Sleep 5; docker ps *> $null; if ($LASTEXITCODE -eq 0) { break } }
}
docker ps *> $null
Write-Status 'Docker daemon' ($LASTEXITCODE -eq 0)

# --- onwax-db (Postgres) ---
docker start onwax-db *> $null
Start-Sleep 2
$dbUp = ((docker ps --filter 'name=onwax-db' --filter 'status=running' --format '{{.Names}}') -eq 'onwax-db')
Write-Status 'onwax-db (Postgres)' $dbUp

# --- Backend (8080) ---
if (Get-NetTCPConnection -State Listen -LocalPort 8080 -ErrorAction SilentlyContinue) {
    Write-Status 'Backend (8080)' $true 'already running'
} else {
    $backendCmd = "Set-Location '$root'; . '$secretsFile'; " +
        '$env:SPOTIFY_REDIRECT_URI=''https://onwax.test/api/spotify/callback''; ' +
        '$env:FRONTEND_URL=''https://onwax.test''; .\mvnw.cmd spring-boot:run'
    Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCmd
    Write-Status 'Backend (8080)' $true 'launched in new window (booting...)'
}

# --- Vite (5173) ---
if (Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue) {
    Write-Status 'Vite (5173)' $true 'already running'
} else {
    Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$client'; npm run dev"
    Write-Status 'Vite (5173)' $true 'launched in new window (booting...)'
}

Write-Host "`nWhen the backend + Vite windows finish booting, open " -NoNewline
Write-Host 'https://onwax.test' -ForegroundColor Cyan
