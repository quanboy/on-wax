# One-time admin setup for https://onwax.test
# Run this once from an elevated (Run as Administrator) PowerShell prompt.
#
# What it does:
#   1. Adds onwax.test -> 127.0.0.1 to the Windows hosts file
#   2. Installs Caddy as a Windows service (so it binds port 443 on boot)
#   3. Trusts Caddy's local CA so the self-signed cert is green in browsers

$caddyExe  = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\CaddyServer.Caddy_Microsoft.Winget.Source_8wekyb3d8bbwe\caddy.exe"
$caddyFile = "$PSScriptRoot\Caddyfile"

function Write-Status($label, $ok, $detail = '') {
    $mark  = if ($ok) { '[ OK ]' } else { '[FAIL]' }
    $color = if ($ok) { 'Green' } else { 'Red' }
    Write-Host ("{0}  {1} {2}" -f $mark, $label, $detail) -ForegroundColor $color
}

Write-Host "`n=== on-wax one-time admin setup ===" -ForegroundColor Cyan

# 1. Hosts file
$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$entry     = "127.0.0.1 onwax.test"
if ((Get-Content $hostsPath -Raw) -notmatch "onwax\.test") {
    Add-Content -Path $hostsPath -Value "`n$entry" -Encoding ASCII
    Write-Status "hosts file (onwax.test -> 127.0.0.1)" $true
} else {
    Write-Status "hosts file (onwax.test -> 127.0.0.1)" $true "already present"
}

# 2. Caddy Windows service
$svc = Get-Service caddy -ErrorAction SilentlyContinue
if ($svc) {
    Write-Status "Caddy service" $true "already installed ($($svc.Status))"
} else {
    $binPath = "`"$caddyExe`" run --config `"$caddyFile`" --adapter caddyfile"
    sc.exe create caddy binPath= $binPath start= auto DisplayName= "Caddy Web Server" | Out-Null
    sc.exe description caddy "Caddy reverse proxy for local on-wax.test dev domain" | Out-Null
    Write-Status "Caddy service" ($LASTEXITCODE -eq 0) "installed"
    Start-Service caddy
    Write-Status "Caddy service start" ($?) ""
}

# 3. Trust Caddy local CA (installs cert into Windows + browser trust stores)
Write-Host "Trusting Caddy local CA (may open a UAC prompt)..." -ForegroundColor Yellow
& $caddyExe trust
Write-Status "Caddy CA trust" $true

Write-Host "`nAll done. Start everything with: .\start-onwax.ps1" -ForegroundColor Cyan
