@echo off
title WeebCentral Extractor
cls

echo.
echo  +------------------------------------------------------+
echo  ^|          WEEBCENTRAL SUBSCRIPTION EXTRACTOR           ^|
echo  +------------------------------------------------------+
echo.

:: ─── Check for Node.js ──────────────────────────────────────
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo  [ERROR]  Node.js is not installed.
    echo.
    echo  This application requires Node.js to run.
    echo  Please install it from:
    echo.
    echo    https://nodejs.org/
    echo.
    echo  Download the LTS version, run the installer,
    echo  then re-run this script.
    echo.
    echo  Press any key to open the download page...
    pause >nul
    start https://nodejs.org/en/download/
    exit /b 1
)

:: ─── Show Node version ──────────────────────────────────────
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo  [OK]     Node.js found: %NODE_VER%

:: ─── Check for npm ──────────────────────────────────────────
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo  [ERROR]  npm is not available.
    echo           Please reinstall Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: ─── Install dependencies if needed ─────────────────────────
if not exist "node_modules" (
    echo  [INFO]   Installing dependencies (first run)...
    echo.
    call npm install
    echo.
    if %ERRORLEVEL% neq 0 (
        echo  [ERROR]  Dependency installation failed.
        pause
        exit /b 1
    )
    echo  [OK]     Dependencies installed.
) else (
    echo  [OK]     Dependencies already installed.
)

echo.
echo  --------------------------------------------------------
echo   Starting server...
echo   The app will open in your browser automatically.
echo   Press Ctrl+C in this window to stop the server.
echo  --------------------------------------------------------
echo.

:: ─── Wait briefly, then open browser ────────────────────────
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: ─── Start the server ───────────────────────────────────────
node src/server.js

pause
