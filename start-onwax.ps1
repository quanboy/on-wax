# Brings up everything needed to use https://onwax.test, then prints a status board.
#
# First-time setup: run setup-admin.ps1 once from an elevated prompt to install the
# Caddy service, trust its local CA, and add onwax.test to the hosts file.
#
# After that: Caddy auto-starts on boot; this script handles the volatile pieces:
# Docker + onwax-db, backend, Vite.
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

# --- Caddy (reverse proxy for onwax.test:443) ---
$caddy = Get-Service caddy -ErrorAction SilentlyContinue
if (-not $caddy) {
    Write-Status 'Caddy service' $false 'not installed — run setup-admin.ps1 as Administrator first'
} elseif ($caddy.Status -ne 'Running') {
    Start-Service caddy -ErrorAction SilentlyContinue
    $caddy.Refresh()
    Write-Status 'Caddy service' ($caddy.Status -eq 'Running') "started"
} else {
    Write-Status 'Caddy service (443)' $true 'Running'
}

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
    Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$client'; `$env:VITE_USE_TEST_DOMAIN='true'; npm run dev"
    Write-Status 'Vite (5173)' $true 'launched in new window (booting...)'
}

Write-Host "`nWhen the backend + Vite windows finish booting, open " -NoNewline
Write-Host 'https://onwax.test' -ForegroundColor Cyan
