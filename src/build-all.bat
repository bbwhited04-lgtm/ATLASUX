@echo off
echo ========================================
echo Atlas UX - Windows Installer Builder
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Checking Node.js version...
node --version
npm --version
echo.

echo [2/4] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo.

echo [3/4] Building React app...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build React app!
    pause
    exit /b 1
)
echo.

echo [4/4] Creating Windows installers...
echo This may take 5-10 minutes...
call npm run package:win:all
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create installers!
    pause
    exit /b 1
)
echo.

echo ========================================
echo SUCCESS! Installers created in /installers folder:
echo.
dir /B installers\*.exe installers\*.msi 2>nul
echo.
echo ========================================
echo.
echo Next steps:
echo 1. Test the installer on a clean Windows VM
echo 2. Add code signing certificate (optional)
echo 3. Upload to your website or GitHub Releases
echo.
pause
