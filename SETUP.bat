@echo off
echo ========================================
echo AIOS LeadMagnet - Setup
echo ========================================
echo.

cd /d "%~dp0frontend"

echo [1/3] Pruefe Node.js Installation...
node --version
npm --version
echo.

echo [2/3] Installiere Dependencies...
echo Dies dauert 2-3 Minuten...
echo.

npm install

echo.
echo [3/3] Starte Development Server...
echo.

npm run dev

pause
