# 🚀 Atlas UX - Quick Start Guide

## ❌ Error: "missing script package:win:msi"

This means you're either:
1. In the wrong directory
2. Haven't run `npm install` yet
3. package.json is missing

---

## ✅ SOLUTION: Navigate to the ROOT Directory

### **You need to be in the directory that contains `package.json`**

---

## 📂 Step-by-Step Directory Navigation

### **1. Find Your Project Root**

The ROOT directory should contain these files:
```
atlas-ux/                    ← YOU NEED TO BE HERE!
├── package.json             ← This file must exist
├── App.tsx
├── main.tsx
├── index.html
├── vite.config.js
├── electron-builder.json
├── .gitignore
├── components/
├── electron/
└── ... (other files)
```

---

## 🔍 How to Check Where You Are

### **Windows Command Prompt / PowerShell:**
```bash
# Show current directory
cd

# List files in current directory
dir

# You should see package.json in the list!
```

### **macOS / Linux Terminal:**
```bash
# Show current directory
pwd

# List files in current directory
ls -la

# You should see package.json in the list!
```

---

## 🎯 How to Navigate to the Correct Directory

### **If you just cloned the repo:**
```bash
# Navigate into the project folder
cd atlas-ux
```

### **If you're in a subdirectory (like /components or /electron):**
```bash
# Go back to root
cd ..

# Or go directly to root (replace with your path)
cd C:\Users\YourName\atlas-ux
```

### **If you don't know where you are:**
```bash
# Windows
cd /d C:\
dir /s package.json

# macOS/Linux
find ~ -name "package.json" -path "*/atlas-ux/*"
```

---

## ✅ Verify You're in the Right Place

### **Run this command:**
```bash
# Windows
type package.json

# macOS/Linux
cat package.json
```

**You should see:**
```json
{
  "name": "atlas-ux",
  "version": "1.0.0",
  "scripts": {
    "package:win:msi": "npm run build && electron-builder --win msi",
    ...
  }
}
```

---

## 🔧 Complete Setup Commands (In Order!)

### **1. Navigate to Project Root**
```bash
cd atlas-ux
```

### **2. Verify package.json exists**
```bash
# Windows
dir package.json

# macOS/Linux  
ls package.json
```

### **3. Install Dependencies (IMPORTANT!)**
```bash
npm install
```
⏱️ Wait 2-5 minutes - this is REQUIRED!

### **4. NOW Build the MSI**
```bash
npm run package:win:msi
```

---

## 🎯 Full Example Workflow

### **Scenario: You just downloaded/cloned the project**

```bash
# 1. Open Command Prompt or Terminal

# 2. Navigate to where you cloned/downloaded
cd C:\Users\YourName\Downloads\atlas-ux

# 3. Verify you're in the right place
dir package.json
# Should show: package.json

# 4. Install dependencies (MUST DO THIS FIRST!)
npm install
# Wait 2-5 minutes...

# 5. Build the MSI
npm run package:win:msi
# Wait 3-8 minutes...

# 6. Find your installer
cd installers
dir
# You should see: Atlas-UX-Setup-1.0.0-x64.msi
```

---

## 🐛 Common Directory Issues

### **Issue 1: "Can't find package.json"**
**Solution:** You're in the wrong directory!
```bash
# Go up one level
cd ..

# List files to see where you are
dir    # Windows
ls     # macOS/Linux
```

### **Issue 2: "npm not found"**
**Solution:** Node.js is not installed
- Download from: https://nodejs.org/
- Install version 18 or higher
- Restart your terminal

### **Issue 3: "package:win:msi not found"**
**Solution:** You haven't run `npm install` yet!
```bash
npm install
```

### **Issue 4: In a subdirectory like /components**
**Solution:**
```bash
# Go back to root
cd ..
```

### **Issue 5: Multiple atlas-ux folders**
**Solution:** Make sure you're in the RIGHT one
```bash
# Check if package.json exists HERE
dir package.json    # Windows
ls package.json     # macOS/Linux
```

---

## 📂 Directory Structure Reference

```
C:\Users\YourName\atlas-ux\     ← YOU MUST BE HERE!
│
├── package.json                 ← Check this exists!
├── App.tsx
├── main.tsx
├── index.html
├── vite.config.js
├── electron-builder.json
│
├── components/                  ← DON'T run commands from here
│   ├── Dashboard.tsx
│   └── ...
│
├── electron/                    ← DON'T run commands from here
│   ├── main.js
│   └── preload.js
│
├── node_modules/                ← Created by npm install
│
├── dist/                        ← Created by npm run build
│
└── installers/                  ← Created by electron-builder
    └── Atlas-UX-Setup-1.0.0-x64.msi  ← YOUR FINAL INSTALLER!
```

---

## ✅ Quick Checklist

Before running `npm run package:win:msi`:

- [ ] I'm in the ROOT directory (where package.json is)
- [ ] I can see package.json when I run `dir` or `ls`
- [ ] I have run `npm install` (takes 2-5 min)
- [ ] Node.js is installed (check: `node --version`)
- [ ] npm is installed (check: `npm --version`)

---

## 🎯 The Correct Commands (Copy-Paste)

### **Windows (Command Prompt or PowerShell):**
```batch
REM Navigate to your project (change path as needed)
cd C:\Users\YourName\atlas-ux

REM Verify you're in the right place
dir package.json

REM Install dependencies (FIRST TIME ONLY)
npm install

REM Build the MSI installer
npm run package:win:msi

REM Navigate to see the installer
cd installers
dir
```

### **macOS / Linux (Terminal):**
```bash
# Navigate to your project (change path as needed)
cd ~/atlas-ux

# Verify you're in the right place
ls package.json

# Install dependencies (FIRST TIME ONLY)
npm install

# Build the MSI installer
npm run package:win:msi

# Navigate to see the installer
cd installers
ls -la
```

---

## 🎯 What Should Happen (Expected Output)

### **When you run `npm install`:**
```
added 450 packages, and audited 451 packages in 2m

50 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

### **When you run `npm run package:win:msi`:**
```
> atlas-ux@1.0.0 package:win:msi
> npm run build && electron-builder --win msi

vite v6.0.11 building for production...
✓ 2547 modules transformed.
dist/index.html                   0.45 kB
dist/assets/index-DxfR7t8P.css   12.34 kB
dist/assets/index-BqJ2k9Xy.js   456.78 kB

  • electron-builder  version=25.1.8
  • loaded configuration  file=electron-builder.json
  • building        target=MSI arch=x64 file=installers\Atlas-UX-Setup-1.0.0-x64.msi
```

### **Final output location:**
```
installers/Atlas-UX-Setup-1.0.0-x64.msi
```

---

## 🚀 After Successfully Building

Your installer is here:
```
atlas-ux/installers/Atlas-UX-Setup-1.0.0-x64.msi
```

To install:
1. Navigate to `installers/` folder
2. Double-click `Atlas-UX-Setup-1.0.0-x64.msi`
3. Follow installation wizard
4. Launch Atlas UX!

---

## 📞 Still Having Issues?

### **Run this diagnostic:**
```bash
# Check Node.js version
node --version
# Should be: v18.x.x or higher

# Check npm version
npm --version
# Should be: 9.x.x or higher

# Check current directory
cd
# or
pwd

# List files in current directory
dir    # Windows
ls     # macOS/Linux
```

### **Then verify:**
1. ✅ I see `package.json` in the file list
2. ✅ Node.js version is 18+
3. ✅ I ran `npm install` first
4. ✅ I'm in the ROOT directory

---

## ✅ TL;DR (Too Long; Didn't Read)

**Problem:** Missing script error  
**Solution:** You're in the wrong directory!

**Fix:**
```bash
# 1. Go to project root
cd atlas-ux

# 2. Verify package.json exists
dir package.json

# 3. Install (first time only)
npm install

# 4. Build
npm run package:win:msi
```

**Root directory = where package.json lives!**

---

*Last Updated: February 3, 2026*
