# AIOS LeadMagnet - Setup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AIOS LeadMagnet - Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Zum frontend-Verzeichnis wechseln
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptPath\frontend"

Write-Host "[1/3] Pruefe Node.js Installation..." -ForegroundColor Yellow
node --version
npm --version
Write-Host ""

Write-Host "[2/3] Installiere Dependencies..." -ForegroundColor Yellow
Write-Host "Dies dauert 2-3 Minuten..." -ForegroundColor Gray
Write-Host ""

npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Installation erfolgreich!" -ForegroundColor Green
    Write-Host ""
    Write-Host "[3/3] Starte Development Server..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Die App oeffnet sich auf: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Zum Beenden: STRG+C druecken" -ForegroundColor Gray
    Write-Host ""
    
    npm run dev
} else {
    Write-Host ""
    Write-Host "FEHLER: Installation fehlgeschlagen!" -ForegroundColor Red
    Write-Host ""
    Read-Host "Druecke Enter zum Beenden"
}
