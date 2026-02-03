# 🚀 Atlas UX - Complete Build Process

## ⚠️ IMPORTANT: This is an ELECTRON App (NOT Tauri!)

**Correct Build System:** Electron + electron-builder  
**WRONG Command:** ❌ `npx tauri build`  
**CORRECT Commands:** ✅ See below

---

## 📋 Prerequisites

### Required Software
1. **Node.js** v18+ (LTS recommended)
2. **npm** v9+ (comes with Node.js)
3. **Git** (for cloning the repo)

### Windows-Specific (for MSI builds)
- Windows 10/11 (64-bit)
- PowerShell or Command Prompt
- Administrator privileges (for some builds)

---

## 🔧 Step 1: Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd atlas-ux

# Install dependencies
npm install
```

**This will install:**
- React, React Router
- Electron & electron-builder
- Lucide icons, Motion animations
- Recharts, Sonner, QRCode
- Vite build tools
- All other dependencies from package.json

---

## 🏗️ Step 2: Build Commands

### **Option A: Build MSI Installer Only**
```bash
npm run package:win:msi
```
**Output:** `installers/Atlas-UX-Setup-1.0.0-x64.msi`

### **Option B: Build NSIS Installer (Recommended)**
```bash
npm run package:win:nsis
```
**Output:** `installers/Atlas-UX-Setup-1.0.0-x64.exe`

### **Option C: Build Portable EXE**
```bash
npm run package:win:portable
```
**Output:** `installers/Atlas-UX-Portable-1.0.0.exe`

### **Option D: Build ALL Windows Installers**
```bash
npm run package:win:all
```
**Output:** MSI + NSIS + Portable (all 3!)

### **Option E: Build for Mac (if on macOS)**
```bash
npm run package:mac:dmg
npm run package:mac:pkg
npm run package:mac:universal  # Universal binary (Intel + Apple Silicon)
```

---

## 📦 Build Process Breakdown

When you run any build command, this happens:

### 1. **Vite Build (Web Assets)**
```bash
npm run build
```
- Compiles React app to static files
- Outputs to `dist/` folder
- Optimizes code, minifies, splits chunks
- Generates production-ready HTML/CSS/JS

### 2. **electron-builder (Native Packaging)**
```bash
electron-builder --win msi
```
- Takes `dist/` folder contents
- Packages with Electron runtime
- Creates Windows installer (MSI/NSIS/Portable)
- Adds app icons, metadata, shortcuts
- Output goes to `installers/` folder

---

## 🎯 Quick Reference: Build Commands

| What You Want | Command | Output File |
|---------------|---------|-------------|
| **MSI Installer** | `npm run package:win:msi` | `Atlas-UX-Setup-1.0.0-x64.msi` |
| **EXE Installer** | `npm run package:win:nsis` | `Atlas-UX-Setup-1.0.0-x64.exe` |
| **Portable EXE** | `npm run package:win:portable` | `Atlas-UX-Portable-1.0.0.exe` |
| **All Windows** | `npm run package:win:all` | All 3 above |
| **Mac DMG** | `npm run package:mac:dmg` | `Atlas-UX-1.0.0-x64.dmg` |
| **Mac PKG** | `npm run package:mac:pkg` | `Atlas-UX-1.0.0-x64.pkg` |

---

## ⚡ Development Mode

To run the app in development (no build needed):

```bash
npm run electron:dev
```

This will:
1. Start Vite dev server on http://localhost:5173
2. Launch Electron window with hot-reload
3. Enable React DevTools
4. Show console logs

---

## 🔍 Troubleshooting

### Issue: "electron-builder not found"
```bash
npm install electron-builder --save-dev
```

### Issue: "vite not found"
```bash
npm install vite --save-dev
```

### Issue: Build fails with icon error
The app needs these icon files in `/build/`:
- `icon.ico` (Windows)
- `icon.icns` (Mac)
- `icons/` folder (Linux)

**Quick fix:** Create a simple icon or remove icon references from `electron-builder.json`

### Issue: "Cannot find module 'electron'"
```bash
npm install
```

### Issue: MSI build fails
- Ensure you're on Windows
- Run as Administrator
- Check Windows Installer service is running

---

## 📂 Build Output Structure

After building, you'll see:

```
atlas-ux/
├── installers/
│   ├── Atlas-UX-Setup-1.0.0-x64.msi        # MSI installer
│   ├── Atlas-UX-Setup-1.0.0-x64.exe        # NSIS installer
│   ├── Atlas-UX-Portable-1.0.0.exe         # Portable version
│   └── win-unpacked/                        # Unpacked app files
├── dist/                                    # Vite build output
│   ├── index.html
│   ├── assets/
│   └── ...
└── ...
```

---

## 🎯 Common Workflows

### **Workflow 1: First-Time Setup**
```bash
git clone <repo>
cd atlas-ux
npm install
npm run electron:dev  # Test in dev mode first
```

### **Workflow 2: Create Installer for Distribution**
```bash
npm run package:win:nsis  # Most user-friendly installer
```

### **Workflow 3: Test Build Locally**
```bash
npm run build                    # Build web assets
npm run electron:dev             # Test without packaging
```

### **Workflow 4: Full Production Build**
```bash
npm install                      # Ensure deps are fresh
npm run package:win:all         # Build all Windows formats
# Installers ready in /installers/
```

---

## 🔐 Security Notes

### Before Building for Distribution:

1. **Check .gitignore** - Don't commit:
   - `node_modules/`
   - `.env` files
   - API keys
   - Stripe credentials

2. **Environment Variables:**
   - API keys should be in `.env` (not committed)
   - Or use environment variable manager
   - Or prompt user on first run

3. **Code Signing (Optional but Recommended):**
   - Get a code signing certificate
   - Add to `electron-builder.json`:
     ```json
     "win": {
       "certificateFile": "path/to/cert.pfx",
       "certificatePassword": "your-password"
     }
     ```

---

## 📊 Build Time Estimates

| Task | Time | Notes |
|------|------|-------|
| `npm install` | 2-5 min | First time only |
| `npm run build` | 30-60 sec | Vite compilation |
| `electron-builder` | 1-3 min | Packaging + compression |
| **Total (full build)** | **3-8 min** | Varies by system |

---

## ✅ Final Checklist

Before distributing your builds:

- [ ] Test installer on clean Windows machine
- [ ] Verify app launches correctly
- [ ] Check all routes work
- [ ] Test integrations connect
- [ ] Verify settings persist
- [ ] Test onboarding wizard
- [ ] Check mobile pairing QR code
- [ ] Verify Stripe payment links work
- [ ] Test file permissions
- [ ] Check GPU settings display correctly

---

## 🚀 You're Ready!

**This is an ELECTRON app using electron-builder.**

**NOT Tauri, NOT npx tauri build!**

**Correct build command for MSI:**
```bash
npm run package:win:msi
```

---

*Last Updated: February 3, 2026*  
*Build System: Electron + electron-builder*  
*Framework: React + Vite*
