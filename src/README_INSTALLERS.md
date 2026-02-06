# 🚀 Atlas UX - Desktop Application & Installers

![Atlas UX](https://img.shields.io/badge/version-1.0.0-cyan)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## **🎯 QUICK START**

### **Windows (Easiest Method):**
1. **Double-click:** `build-all.bat`
2. **Wait 10 minutes**
3. **Find installers** in `/installers` folder

### **macOS/Linux (Easiest Method):**
1. **Make executable:** `chmod +x build-all.sh`
2. **Run:** `./build-all.sh`
3. **Wait 10 minutes**
4. **Find installers** in `/installers` folder

---

## **📦 WHAT YOU GET**

### **Windows Installers:**
- ✅ `Atlas-UX-Setup-1.0.0-x64.exe` - **NSIS installer** (recommended)
- ✅ `Atlas-UX-Setup-1.0.0-x64.msi` - **MSI installer** (enterprise)
- ✅ `Atlas-UX-Portable-1.0.0.exe` - **Portable** (no install needed)

### **macOS Installers:**
- ✅ `Atlas-UX-1.0.0-universal.dmg` - **DMG** (Intel + Apple Silicon)
- ✅ `Atlas-UX-1.0.0-universal.pkg` - **PKG** (enterprise)

### **Linux Installers:**
- ✅ `atlas-ux-1.0.0-x86_64.AppImage` - **AppImage** (universal)
- ✅ `atlas-ux_1.0.0_amd64.deb` - **DEB** (Ubuntu/Debian)
- ✅ `atlas-ux-1.0.0.x86_64.rpm` - **RPM** (Fedora/RHEL)

---

## **💻 MANUAL BUILD COMMANDS**

### **Prerequisites:**
```bash
npm install
```

### **Windows:**
```bash
npm run package:win:all       # All Windows formats
npm run package:win:nsis      # Just EXE installer
npm run package:win:msi       # Just MSI installer
npm run package:win:portable  # Just portable EXE
```

### **macOS:**
```bash
npm run package:mac:universal  # Universal DMG (Intel + M1/M2/M3)
npm run package:mac:dmg        # Just DMG
npm run package:mac:pkg        # Just PKG
```

### **Linux:**
```bash
npm run electron:build:linux   # AppImage + DEB + RPM
```

### **All Platforms:**
```bash
npm run electron:build:all     # Windows + macOS + Linux
```

---

## **🎨 BEFORE BUILDING: ADD YOUR ICONS!**

Atlas UX needs icons to look professional!

### **Required Files:**
- `/build/icon.ico` - Windows icon (256x256 ICO)
- `/build/icon.icns` - macOS icon (1024x1024 ICNS)
- `/build/icons/*.png` - Linux icons (16-512px PNGs)

### **Quick Icon Creation:**

#### **Online Tools:**
1. **Windows ICO:** https://www.icoconverter.com/
2. **macOS ICNS:** https://cloudconvert.com/png-to-icns
3. **All Sizes:** https://www.websiteplanet.com/webtools/favicon-generator/

#### **Design Your Icon:**
Use this AI prompt with ChatGPT/DALL-E:
```
"Design a modern, minimalist app icon for 'Atlas UX', 
an AI productivity platform. Use cyan (#00D9FF) and 
blue (#3B82F6) gradients. The icon should represent AI, 
automation, and control. Simple enough to work at 16x16 
but striking at 512x512. Make it a rounded square."
```

**📖 Full guide:** See `/build/ICON_REQUIREMENTS.md`

---

## **📁 PROJECT STRUCTURE**

```
atlas-ux/
├── electron/                   # Electron desktop wrapper
│   ├── main.js                # Main process (window, IPC)
│   └── preload.js             # Secure bridge to renderer
├── build/                     # Installer assets
│   ├── icon.ico               # Windows icon (ADD THIS!)
│   ├── icon.icns              # macOS icon (ADD THIS!)
│   ├── icons/                 # Linux icons (ADD THESE!)
│   ├── dmg-background.png     # macOS DMG background (optional)
│   ├── entitlements.mac.plist # macOS permissions
│   └── ICON_REQUIREMENTS.md   # Icon guide
├── installers/                # Built installers go here
├── src/                       # React app source
├── components/                # React components
├── electron-builder.json      # Installer configuration
├── package.json               # Dependencies & scripts
├── build-all.bat              # Windows build script
├── build-all.sh               # macOS/Linux build script
├── BUILD_INSTRUCTIONS.md      # Detailed build guide
└── INSTALLER_BUILD_COMPLETE.md # Setup summary
```

---

## **🔧 DEVELOPMENT MODE**

### **Run as Desktop App (Dev):**
```bash
npm run electron:dev
```
- Opens Electron window
- Hot reload enabled
- DevTools open automatically
- Great for testing desktop features

### **Run as Web App (Dev):**
```bash
npm run dev
```
- Opens in browser
- Hot reload enabled
- Standard Vite dev server

---

## **🌐 CI/CD - AUTOMATED BUILDS**

Push to GitHub and get installers automatically!

### **Setup:**
1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial release"
   git push
   ```

2. **Create Release Tag:**
   ```bash
   git tag v1.0.0
   git push --tags
   ```

3. **GitHub Actions Auto-Builds:**
   - ✅ Windows (MSI + EXE + Portable)
   - ✅ macOS (DMG + PKG + ZIP)
   - ✅ Linux (AppImage + DEB + RPM)

4. **Download from:**
   ```
   https://github.com/your-username/atlas-ux/releases/latest
   ```

**Config file:** `.github/workflows/build.yml` (already included!)

---

## **🔒 CODE SIGNING (OPTIONAL)**

### **Why Sign?**
- ✅ No "Unknown Publisher" warnings
- ✅ Bypasses Windows SmartScreen
- ✅ Required for macOS Gatekeeper
- ✅ Professional appearance

### **Windows:**
1. Buy certificate (~$100-300/year)
2. Configure in `electron-builder.json`

### **macOS:**
1. Apple Developer Program ($99/year)
2. Create Developer ID certificate
3. Configure in `electron-builder.json`

**Without signing:**
- Windows: Users see warning but can install
- macOS: Users must right-click → Open

**📖 Full guide:** See `/BUILD_INSTRUCTIONS.md`

---

## **📊 INSTALLER DETAILS**

### **File Sizes:**
| Platform | Format | Size |
|----------|--------|------|
| Windows | NSIS EXE | ~130 MB |
| Windows | MSI | ~180 MB |
| Windows | Portable | ~200 MB |
| macOS | DMG | ~150 MB |
| macOS | PKG | ~150 MB |
| Linux | AppImage | ~160 MB |

### **Why Large?**
- Includes Chromium engine (~120 MB)
- All assets bundled
- No external dependencies
- Runs completely offline

---

## **✨ DESKTOP FEATURES**

Atlas UX as a desktop app includes:

### **Native Integration:**
- ✅ **File Access** - Read/write local files
- ✅ **Native Dialogs** - File pickers, confirmations
- ✅ **System Tray** - Minimize to tray (optional)
- ✅ **Auto-Start** - Launch on system boot (optional)
- ✅ **Deep Links** - `atlasux://` protocol support
- ✅ **Notifications** - Desktop notifications

### **Neptune Control System:**
- ✅ **File Permission Dialogs** - Approve/deny file access
- ✅ **API Permission Dialogs** - Control external API calls
- ✅ **Screen Capture** - Request screenshot permissions
- ✅ **System Monitoring** - Real CPU/GPU stats

### **Performance:**
- ✅ **GPU Acceleration** - Hardware-accelerated rendering
- ✅ **Multi-Process** - Isolated renderer for security
- ✅ **Offline Mode** - Works without internet

---

## **🎯 DISTRIBUTION OPTIONS**

### **Free Distribution:**
- **Your Website** - Direct download
- **GitHub Releases** - Free hosting
- **SourceForge** - Mirror for large files

### **Paid Distribution:**
- **Microsoft Store** - Windows ($19 one-time)
- **Mac App Store** - macOS ($99/year)
- **Gumroad** - Sell directly (5% fee)
- **Paddle** - Merchant of record

### **Freemium:**
- Free download with paid upgrades
- Implement license key system
- Offer monthly/yearly plans

---

## **🧪 TESTING CHECKLIST**

Before distributing:

### **Windows:**
- [ ] MSI installs without errors
- [ ] Desktop shortcut works
- [ ] Start menu entry works
- [ ] App launches correctly
- [ ] All features functional
- [ ] Uninstaller works
- [ ] Works on Windows 10 & 11

### **macOS:**
- [ ] DMG mounts correctly
- [ ] Drag to Applications works
- [ ] App launches (Gatekeeper check)
- [ ] All features functional
- [ ] Icon appears in Dock
- [ ] Works on Intel & Apple Silicon

### **Linux:**
- [ ] AppImage is executable
- [ ] App launches
- [ ] All features functional
- [ ] Desktop integration works

---

## **📞 TROUBLESHOOTING**

### **Build Errors:**

**"electron not found"**
```bash
npm install
```

**"Cannot build macOS on Windows"**
- Use GitHub Actions (included)
- Or build on a Mac

**"Code signing failed"**
- Remove signing config temporarily
- Or obtain a certificate

### **Runtime Errors:**

**"App won't open on macOS"**
- Right-click → Open (first time)
- Or code sign the app

**"Windows SmartScreen blocked"**
- Click "More info" → "Run anyway"
- Or code sign the app

**App crashes on launch**
- Check console for errors
- Test in dev mode first: `npm run electron:dev`

---

## **🚀 DEPLOYMENT WORKFLOW**

### **1. Development:**
```bash
npm run electron:dev
```

### **2. Test Production:**
```bash
npm run build
electron .
```

### **3. Build Installers:**
```bash
# Windows
npm run package:win:all

# macOS
npm run package:mac:universal

# Linux
npm run electron:build:linux
```

### **4. Test Installers:**
- Install on clean VM
- Test all features
- Verify uninstaller

### **5. Distribute:**
- Upload to website
- Create GitHub Release
- Announce on social media

---

## **📋 PRE-RELEASE CHECKLIST**

Before building v1.0:
- [ ] Icons created (`/build/icon.ico`, `/build/icon.icns`)
- [ ] `package.json` version set to `1.0.0`
- [ ] `LICENSE.txt` exists
- [ ] All features tested
- [ ] README.md created for users
- [ ] Release notes written
- [ ] Download page ready

Before distributing:
- [ ] Installers tested on clean systems
- [ ] Antivirus scan passed
- [ ] Code signed (if possible)
- [ ] GitHub Release created
- [ ] Social media posts scheduled

---

## **📚 DOCUMENTATION**

- **📖 Build Instructions:** `/BUILD_INSTRUCTIONS.md`
- **🎨 Icon Guide:** `/build/ICON_REQUIREMENTS.md`
- **✅ Setup Summary:** `/INSTALLER_BUILD_COMPLETE.md`
- **🚀 Feature List:** `/COMPLETE_FEATURE_LIST.md`
- **🔧 This File:** `/README_INSTALLERS.md`

---

## **🎉 YOU'RE READY!**

### **To build Windows installers right now:**
```bash
# Double-click this file:
build-all.bat

# Or run manually:
npm install
npm run package:win:all
```

### **To build macOS installers right now:**
```bash
# Make executable and run:
chmod +x build-all.sh
./build-all.sh

# Or run manually:
npm install
npm run package:mac:universal
```

### **Installers will be in:** `/installers` folder

---

## **💎 WHAT MAKES ATLAS UX SPECIAL**

**The ONLY AI platform with:**
- ✅ 140+ features all-in-one
- ✅ Standalone desktop app
- ✅ Business asset management
- ✅ GPU acceleration
- ✅ No subscriptions
- ✅ No cloud lock-in
- ✅ Professional installers
- ✅ Multi-platform support

**Replaces $1,785/month in SaaS tools!**

---

## **📞 SUPPORT**

- **Documentation:** See `/BUILD_INSTRUCTIONS.md`
- **Electron Docs:** https://www.electronjs.org/
- **electron-builder:** https://www.electron.build/
- **GitHub Actions:** Check workflow logs

---

## **📄 LICENSE**

MIT License - See `/LICENSE.txt`

---

**🚀 ATLAS UX v1.0 - YOUR STANDALONE AI EMPLOYEE**

**Now distributable as native Windows, macOS, and Linux applications!** 🎉

---

*Built with 💙 Electron + React + Tailwind CSS*  
*Version 1.0.0 - Production Ready*  
*February 2026*
