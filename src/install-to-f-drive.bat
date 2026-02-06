@echo off
echo ========================================
echo  ATLAS UX - Install to F:\atlasux
echo ========================================
echo.

REM Check if running from correct location
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please run this script from the Atlas UX project folder
    echo.
    pause
    exit /b 1
)

echo [1/4] Creating F:\atlasux folder...
if not exist "F:\atlasux" (
    mkdir "F:\atlasux"
    echo     Created F:\atlasux
) else (
    echo     F:\atlasux already exists
)
echo.

echo [2/4] Copying files to F:\atlasux...
echo     This may take a minute...
xcopy /E /I /Y /Q * F:\atlasux > nul
if errorlevel 1 (
    echo     ERROR: Failed to copy files!
    echo     Make sure F:\ drive is accessible
    pause
    exit /b 1
)
echo     Files copied successfully!
echo.

echo [3/4] Installing dependencies...
echo     This will take 2-3 minutes...
cd /d F:\atlasux
call npm install
if errorlevel 1 (
    echo     ERROR: npm install failed!
    echo     Make sure Node.js is installed from https://nodejs.org/
    pause
    exit /b 1
)
echo.

echo [4/4] Creating launch shortcut on Desktop...
set DESKTOP=%USERPROFILE%\Desktop
echo cmd.exe /k "cd /d F:\atlasux && npm run dev" > "%DESKTOP%\Start Atlas UX.bat"
echo     Shortcut created!
echo.

echo ========================================
echo  INSTALLATION COMPLETE! 
echo ========================================
echo.
echo Atlas UX is installed at: F:\atlasux
echo.
echo To start Atlas UX:
echo   1. Double-click "Start Atlas UX" on your Desktop
echo   2. Or run: cd F:\atlasux && npm run dev
echo.
echo Then open browser: http://localhost:5173
echo.
echo See F:\atlasux\START_HERE.md for testing guide
echo.
echo Press any key to start Atlas UX now...
pause > nul

cd /d F:\atlasux
npm run dev
