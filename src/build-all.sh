#!/bin/bash

echo "========================================"
echo "Atlas UX - macOS/Linux Installer Builder"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[1/4] Checking Node.js version..."
node --version
npm --version
echo ""

echo "[2/4] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies!"
    exit 1
fi
echo ""

echo "[3/4] Building React app..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build React app!"
    exit 1
fi
echo ""

# Detect platform
if [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macOS"
    BUILD_CMD="npm run package:mac:universal"
else
    PLATFORM="Linux"
    BUILD_CMD="npm run electron:build:linux"
fi

echo "[4/4] Creating $PLATFORM installers..."
echo "This may take 5-10 minutes..."
eval $BUILD_CMD
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to create installers!"
    exit 1
fi
echo ""

echo "========================================"
echo "SUCCESS! Installers created in /installers folder:"
echo ""
ls -lh installers/ 2>/dev/null | tail -n +2
echo ""
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Test the installer on a clean system"
echo "2. Add code signing certificate (optional)"
echo "3. Upload to your website or GitHub Releases"
echo ""
