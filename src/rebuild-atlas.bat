@echo off
echo ========================================
echo  ATLAS UX - CLEAN REBUILD SCRIPT
echo ========================================
echo.

echo [1/4] Cleaning release folder...
if exist installers rmdir /s /q installers
echo Done!
echo.

echo [2/4] Cleaning dist folder...
if exist dist rmdir /s /q dist
echo Done!
echo.

echo [3/4] Building React app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b %errorlevel%
)
echo Done!
echo.

echo [4/4] Creating installer...
call npm run package:win:nsis
if %errorlevel% neq 0 (
    echo ERROR: Installer creation failed!
    pause
    exit /b %errorlevel%
)
echo Done!
echo.

echo ========================================
echo  BUILD COMPLETE!
echo ========================================
echo.
echo Installer location:
echo installers\Atlas-UX-Setup-1.0.0-x64.exe
echo.
pause
