@echo off
chcp 65001 >nul
echo ========================================
echo   AIOS LeadMagnet - Setup
echo ========================================
echo.

REM Zum frontend-Verzeichnis wechseln
cd /d "%~dp0frontend"

echo [1/3] Prüfe Node.js Installation...
node --version
if %errorlevel% neq 0 (
    echo FEHLER: Node.js ist nicht installiert!
    echo Bitte installiere Node.js von https://nodejs.org
    pause
    exit /b 1
)

npm --version
if %errorlevel% neq 0 (
    echo FEHLER: npm ist nicht verfügbar!
    pause
    exit /b 1
)

echo.
echo [2/3] Installiere Dependencies...
echo Dies dauert 2-3 Minuten...
echo.

npm install

if %errorlevel% neq 0 (
    echo.
    echo FEHLER: Installation fehlgeschlagen!
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Installation erfolgreich! ✓
echo ========================================
echo.
echo Starte jetzt den Development Server...
echo.
echo Die App öffnet sich automatisch im Browser.
echo Zum Beenden: STRG+C drücken
echo.
pause

echo.
echo [3/3] Starte Development Server...
echo.

npm run dev

pause
