# 🚀 Atlas UX - Build Instructions

## 📦 **BUILD INSTALLERS FOR WINDOWS & MACOS**

---

## **Prerequisites**

### **Install Node.js**
1. Download from: https://nodejs.org/
2. Install version 18 or higher
3. Verify: `node --version` and `npm --version`

### **Windows Additional Requirements (for MSI/EXE)**
- **Windows 10/11** (required for building)
- **Visual Studio Build Tools** (optional, but recommended)
  - Download: https://visualstudio.microsoft.com/downloads/
  - Install "Desktop development with C++"

### **macOS Additional Requirements (for DMG/PKG)**
- **macOS 10.15+** (required for building)
- **Xcode Command Line Tools**
  ```bash
  xcode-select --install
  ```

---

## **🔧 SETUP**

### **Step 1: Install Dependencies**

```bash
npm install
```

This installs:
- ✅ React + Vite (web app)
- ✅ Electron (desktop wrapper)
- ✅ electron-builder (installer creator)
- ✅ All UI libraries (Tailwind, Lucide, etc.)

---

## **🎯 BUILD COMMANDS**

### **🖥️ WINDOWS BUILDS**

#### **Build MSI Installer (Windows)**
```bash
npm run package:win:msi
```
**Output:** `installers/Atlas-UX-Setup-1.0.0-x64.msi`

#### **Build NSIS Installer (EXE)**
```bash
npm run package:win:nsis
```
**Output:** `installers/Atlas-UX-Setup-1.0.0-x64.exe`

#### **Build Portable EXE**
```bash
npm run package:win:portable
```
**Output:** `installers/Atlas-UX-Portable-1.0.0.exe`

#### **Build ALL Windows Installers**
```bash
npm run package:win:all
```
**Outputs:**
- ✅ `Atlas-UX-Setup-1.0.0-x64.msi` (MSI installer)
- ✅ `Atlas-UX-Setup-1.0.0-x64.exe` (NSIS installer)
- ✅ `Atlas-UX-Setup-1.0.0-arm64.exe` (ARM64 installer)
- ✅ `Atlas-UX-Portable-1.0.0.exe` (Portable)

---

### **🍎 MACOS BUILDS**

#### **Build DMG (macOS disk image)**
```bash
npm run package:mac:dmg
```
**Output:** `installers/Atlas-UX-1.0.0-arm64.dmg` (Apple Silicon)
**Output:** `installers/Atlas-UX-1.0.0-x64.dmg` (Intel Mac)

#### **Build PKG (macOS installer)**
```bash
npm run package:mac:pkg
```
**Output:** `installers/Atlas-UX-1.0.0-arm64.pkg`

#### **Build Universal Binary (Intel + Apple Silicon)**
```bash
npm run package:mac:universal
```
**Output:** `installers/Atlas-UX-1.0.0-universal.dmg`

---

### **🐧 LINUX BUILDS (BONUS)**

#### **Build AppImage**
```bash
npm run electron:build:linux
```
**Output:** `installers/atlas-ux-1.0.0-x86_64.AppImage`

---

## **📋 FULL BUILD MATRIX**

### **Build for ALL Platforms**
```bash
npm run electron:build:all
```

**Outputs:**
- 🖥️ Windows: MSI, NSIS, Portable
- 🍎 macOS: DMG (Intel + ARM), PKG
- 🐧 Linux: AppImage, DEB, RPM

---

## **🎨 CUSTOMIZING ICONS**

### **Windows Icon (ICO)**
1. Create a 256x256 PNG of your app icon
2. Convert to ICO: https://www.icoconverter.com/
3. Save as: `/build/icon.ico`

### **macOS Icon (ICNS)**
1. Create a 1024x1024 PNG of your app icon
2. Convert to ICNS:
   ```bash
   # macOS only
   mkdir icon.iconset
   sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png
   sips -z 32 32 icon.png --out icon.iconset/icon_16x16@2x.png
   sips -z 32 32 icon.png --out icon.iconset/icon_32x32.png
   sips -z 64 64 icon.png --out icon.iconset/icon_32x32@2x.png
   sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png
   sips -z 256 256 icon.png --out icon.iconset/icon_128x128@2x.png
   sips -z 256 256 icon.png --out icon.iconset/icon_256x256.png
   sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png
   sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
   sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
   iconutil -c icns icon.iconset
   mv icon.icns build/icon.icns
   ```

### **DMG Background (macOS)**
1. Create a 660x480 PNG background image
2. Save as: `/build/dmg-background.png`

---

## **⚙️ ADVANCED CONFIGURATION**

### **Change App Version**
Edit `/package.json`:
```json
{
  "version": "2.0.0"
}
```

### **Change App Name**
Edit `/electron-builder.json`:
```json
{
  "productName": "Your App Name"
}
```

### **Code Signing (Optional)**

#### **Windows Code Signing:**
Edit `/electron-builder.json`:
```json
{
  "win": {
    "certificateFile": "path/to/cert.pfx",
    "certificatePassword": "your-password"
  }
}
```

#### **macOS Code Signing:**
Edit `/electron-builder.json`:
```json
{
  "mac": {
    "identity": "Developer ID Application: Your Name (TEAM_ID)"
  }
}
```

---

## **🧪 TESTING**

### **Run in Development Mode**
```bash
npm run electron:dev
```
- Opens Electron window
- Hot-reload enabled
- DevTools open by default

### **Build and Test Locally**
```bash
npm run build
electron .
```

---

## **📤 DISTRIBUTION**

### **File Sizes (Approximate):**
- **Windows MSI:** ~180 MB
- **Windows EXE (NSIS):** ~130 MB
- **Windows Portable:** ~200 MB
- **macOS DMG:** ~150 MB
- **macOS PKG:** ~150 MB
- **Linux AppImage:** ~160 MB

### **Distribution Checklist:**
- ✅ Test installer on clean VM/machine
- ✅ Verify all features work in production build
- ✅ Check antivirus doesn't flag it (code sign to prevent)
- ✅ Test on multiple OS versions
- ✅ Create release notes
- ✅ Upload to website/GitHub releases

---

## **🐛 TROUBLESHOOTING**

### **"electron-builder not found"**
```bash
npm install --save-dev electron-builder
```

### **"Cannot find module 'electron'"**
```bash
npm install --save-dev electron
```

### **Windows build fails (missing tools)**
Install Windows Build Tools:
```bash
npm install --global windows-build-tools
```

### **macOS notarization required**
For distribution outside App Store, you need to notarize:
```bash
xcrun notarytool submit app.dmg --apple-id "your@email.com" --team-id "TEAM_ID" --password "app-specific-password"
```

### **Linux dependencies missing**
```bash
sudo apt-get install -y rpm
```

---

## **📊 BUILD OUTPUTS**

All installers are created in the `/installers` folder:

```
installers/
├── Atlas-UX-Setup-1.0.0-x64.msi          # Windows MSI (x64)
├── Atlas-UX-Setup-1.0.0-x64.exe          # Windows NSIS (x64)
├── Atlas-UX-Setup-1.0.0-arm64.exe        # Windows NSIS (ARM64)
├── Atlas-UX-Portable-1.0.0.exe           # Windows Portable
├── Atlas-UX-1.0.0-x64.dmg                # macOS DMG (Intel)
├── Atlas-UX-1.0.0-arm64.dmg              # macOS DMG (Apple Silicon)
├── Atlas-UX-1.0.0-universal.dmg          # macOS DMG (Universal)
├── Atlas-UX-1.0.0-x64.pkg                # macOS PKG (Intel)
├── Atlas-UX-1.0.0-arm64.pkg              # macOS PKG (Apple Silicon)
├── atlas-ux-1.0.0-x86_64.AppImage        # Linux AppImage
├── atlas-ux_1.0.0_amd64.deb              # Linux DEB
└── atlas-ux-1.0.0.x86_64.rpm             # Linux RPM
```

---

## **🎉 QUICK START**

### **To build everything:**
```bash
# Install dependencies
npm install

# Build all installers (Windows + macOS + Linux)
npm run electron:build:all
```

### **To build just Windows:**
```bash
npm run package:win:all
```

### **To build just macOS:**
```bash
npm run package:mac:universal
```

---

## **💡 TIPS**

1. **Build on native platform:** 
   - Build Windows installers on Windows
   - Build macOS installers on macOS
   - Linux can cross-compile some formats

2. **Use CI/CD for multi-platform:**
   - GitHub Actions can build all platforms
   - See `.github/workflows/build.yml` example

3. **Optimize file size:**
   - Use `asar` archiving (enabled by default)
   - Exclude dev dependencies
   - Compress with UPX (optional)

4. **Auto-updates:**
   - Configure `publish` in electron-builder.json
   - Use electron-updater for seamless updates

---

## **📞 SUPPORT**

If you encounter issues:
1. Check electron-builder docs: https://www.electron.build/
2. Check Electron docs: https://www.electronjs.org/
3. Verify Node.js version: `node --version` (need 18+)
4. Clear cache: `npm cache clean --force`
5. Reinstall: `rm -rf node_modules package-lock.json && npm install`

---

**🚀 YOU'RE READY TO BUILD!**

Run: `npm run package:win:all` (Windows) or `npm run package:mac:universal` (macOS)

Your installers will be in the `/installers` folder! 🎉
