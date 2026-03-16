@echo off
chcp 65001 >nul
echo ========================================
echo   AIOS LeadMagnet - Development Server
echo ========================================
echo.

REM Zum frontend-Verzeichnis wechseln
cd /d "%~dp0frontend"

echo Starte Development Server...
echo.
echo Die App öffnet sich automatisch im Browser auf:
echo http://localhost:3000
echo.
echo Zum Beenden: STRG+C drücken
echo.
echo ========================================
echo.

npm run dev

pause
