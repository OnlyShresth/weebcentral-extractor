@echo off
title WeebCentral Extractor
cd /d "%~dp0"
cls

:: Run everything inside :main, then ALWAYS pause before closing
call :main
echo.
echo   Press any key to close...
pause >nul
exit /b

:: ─────────────────────────────────────────────────────────────
:main
echo.
echo   +------------------------------------------------------+
echo   ^|                                                      ^|
echo   ^|       WEEBCENTRAL SUBSCRIPTION EXTRACTOR             ^|
echo   ^|                                                      ^|
echo   +------------------------------------------------------+
echo.

:: Check for Node.js
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
    goto :eof
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo   +  Node.js %NODE_VER%

:: Install dependencies if needed
if not exist "node_modules" (
    echo   ^>  Installing dependencies...
    echo.
    call npm install
    echo.
    if %ERRORLEVEL% neq 0 (
        echo   x  Install failed.
        goto :eof
    )
    echo   +  Dependencies installed.
) else (
    echo   +  Dependencies ready.
)

echo.
echo   ^>  Starting server...
echo      Press Ctrl+C to stop.
echo.

:: Open browser after delay
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:6767"

:: Start server (call ensures batch continues after node exits)
call node src/server.js

echo.
echo   Server stopped.
goto :eof
