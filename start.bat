@echo off
title WeebCentral Extractor
cd /d "%~dp0"
cls

echo.
echo   +------------------------------------------------------+
echo   ^|                                                      ^|
echo   ^|       WEEBCENTRAL SUBSCRIPTION EXTRACTOR             ^|
echo   ^|                                                      ^|
echo   +------------------------------------------------------+
echo.

:: ─── Check for Node.js ──────────────────────────────────────
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo   x  Node.js is not installed.
    echo.
    echo      This application requires Node.js to run.
    echo      Download it from: https://nodejs.org/
    echo.
    echo      Press any key to open the download page...
    pause >nul
    start https://nodejs.org/en/download/
    exit /b 1
)

:: ─── Show Node version ──────────────────────────────────────
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo   +  Node.js found: %NODE_VER%

:: ─── Install dependencies if needed ─────────────────────────
if not exist "node_modules" (
    echo   ^>  Installing dependencies (first run)...
    echo.
    call npm install
    echo.
    if %ERRORLEVEL% neq 0 (
        echo   x  Dependency installation failed.
        pause
        exit /b 1
    )
    echo   +  Dependencies installed.
) else (
    echo   +  Dependencies ready.
)

echo.
echo   ^>  Starting server...
echo      Press Ctrl+C to stop.
echo.

:: ─── Open browser after a short delay ───────────────────────
start "" /b cmd /c "timeout /t 3 /nobreak >nul 2>nul && start http://localhost:6767" >nul 2>nul

:: ─── Start the server ───────────────────────────────────────
call node src/server.js

echo.
echo   Server stopped.
echo   Press any key to close...
pause >nul
exit /b 0
