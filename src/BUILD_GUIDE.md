# 🏗️ Atlas UX - Production Build Guide

## 🎯 Quick Build (2 Commands)

```bash
# 1. Install dependencies
npm install

# 2. Build MSI installer
npm run package:win:msi
```

**Output:** `dist/Atlas UX Setup 1.0.0.msi`

---

## 📋 Pre-Build Checklist

### ✅ Before You Build:

- [ ] All code changes committed to repo
- [ ] Stripe credentials added to Supabase (if using subscriptions)
- [ ] Environment variables configured
- [ ] No TypeScript errors (`npm run build` succeeds)
- [ ] All features tested locally (`npm run dev`)

---

## 🚀 Build Commands

### Windows Builds

```bash
# MSI Installer (Recommended)
npm run package:win:msi

# NSIS Installer
npm run package:win:nsis

# Portable (No Install)
npm run package:win:portable

# All Windows Formats
npm run package:win:all
```

### macOS Builds

```bash
# DMG Installer
npm run package:mac:dmg

# PKG Installer
npm run package:mac:pkg

# Universal Binary (Intel + M1/M2)
npm run package:mac:universal
```

### Linux Builds

```bash
# AppImage, Snap, Deb
npm run electron:build:linux
```

### Multi-Platform

```bash
# Build for all platforms
npm run electron:build:all
```

---

## 📦 Build Output

### Windows MSI:
```
dist/
├── Atlas UX Setup 1.0.0.msi        ← Installer
├── win-unpacked/                    ← Unpacked files
│   ├── Atlas UX.exe
│   ├── resources/
│   └── ...
└── builder-effective-config.yaml   ← Build config
```

### Installer Size:
- **MSI:** ~150-300 MB (includes Electron runtime)
- **Portable:** ~200-350 MB (self-contained)
- **NSIS:** ~150-300 MB (classic installer)

---

## 🔧 Build Configuration

### package.json
Already configured with:
- ✅ `electron-builder` scripts
- ✅ Build targets (Windows/Mac/Linux)
- ✅ MSI, NSIS, Portable options
- ✅ Universal binary support (Mac)

### electron-builder.json (Optional)
Create this file to customize builds:

```json
{
  "appId": "com.atlasux.app",
  "productName": "Atlas UX",
  "directories": {
    "output": "dist",
    "buildResources": "build"
  },
  "files": [
    "dist-electron/**/*",
    "dist/**/*",
    "electron/**/*",
    "package.json"
  ],
  "win": {
    "target": ["msi", "nsis", "portable"],
    "icon": "build/icon.ico",
    "artifactName": "${productName} Setup ${version}.${ext}"
  },
  "msi": {
    "oneClick": false,
    "perMachine": true,
    "allowElevation": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "Atlas UX"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "Atlas UX"
  },
  "mac": {
    "target": ["dmg", "pkg"],
    "category": "public.app-category.productivity",
    "icon": "build/icon.icns"
  },
  "linux": {
    "target": ["AppImage", "snap", "deb"],
    "category": "Utility",
    "icon": "build/icon.png"
  }
}
```

---

## 🎨 Build Assets

### Required Icons:

Place these in `/build/` directory:

```
build/
├── icon.ico         ← Windows (256x256, .ico format)
├── icon.icns        ← macOS (512x512, .icns format)
├── icon.png         ← Linux (512x512, .png format)
└── background.png   ← Optional installer background
```

### Icon Sizes:
- **Windows (.ico):** 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- **macOS (.icns):** 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
- **Linux (.png):** 512x512 (PNG with transparency)

### Generate Icons:
Use online tools or:
```bash
npm install --save-dev electron-icon-maker
npx electron-icon-maker --input=./icon-source.png --output=./build
```

---

## 🧪 Testing the Build

### 1. Test Locally First
```bash
# Run dev mode
npm run dev

# Test all features:
- ✅ Navigation works
- ✅ Integrations load
- ✅ Subscription page opens
- ✅ Settings save correctly
- ✅ No console errors
```

### 2. Build and Test Installer
```bash
# Build MSI
npm run package:win:msi

# Locate installer
cd dist

# Install on test machine
# Run: "Atlas UX Setup 1.0.0.msi"
```

### 3. Verify Installed App
- [ ] App launches without errors
- [ ] All features work
- [ ] Settings persist after restart
- [ ] Subscription page loads (if Stripe configured)
- [ ] Uninstall works cleanly

---

## ⚡ Build Optimization

### Reduce Build Time:

```bash
# Skip code signing (dev builds)
export CSC_IDENTITY_AUTO_DISCOVERY=false

# Build for current platform only
npm run electron:build:win  # Windows only
npm run electron:build:mac  # macOS only
```

### Reduce Bundle Size:

1. **Remove dev dependencies from build:**
   - Already configured in `package.json`
   
2. **Use production mode:**
   ```bash
   NODE_ENV=production npm run build
   ```

3. **Exclude unnecessary files:**
   - Add to `electron-builder.json`:
   ```json
   "files": [
     "!**/*.map",
     "!**/*.md",
     "!**/node_modules/**/{README,LICENSE,*.md}",
     "!**/.git/**/*"
   ]
   ```

---

## 🔐 Code Signing (Optional)

### Windows:
```bash
# Get code signing certificate
# Set environment variables:
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=your-password

# Build with signing
npm run package:win:msi
```

### macOS:
```bash
# Apple Developer Certificate required
export APPLE_ID=your@email.com
export APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Build with signing & notarization
npm run package:mac:dmg
```

---

## 🐛 Troubleshooting

### Build Fails: "electron-builder not found"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build Fails: "Cannot find module"
```bash
# Rebuild native modules
npm run electron:rebuild
```

### MSI Install Fails: "Wrong architecture"
```bash
# Specify architecture explicitly
npm run package:win:msi -- --x64
# or
npm run package:win:msi -- --ia32
```

### Build is Too Large
```bash
# Check what's included
npm run electron:build -- --dir

# Review dist-electron and dist folders
# Remove unnecessary files via electron-builder.json
```

### "EACCES: permission denied"
```bash
# Run with elevated permissions (Windows)
# Or fix file permissions (Mac/Linux)
chmod -R 755 node_modules
```

---

## 📊 Build Checklist

### Before Build:
- [ ] Run `npm install`
- [ ] Run `npm run build` (verify no errors)
- [ ] Test in dev mode (`npm run dev`)
- [ ] Update version in `package.json`
- [ ] Add release notes

### During Build:
- [ ] Build completes without errors
- [ ] Installer file created in `dist/`
- [ ] File size is reasonable (~150-300 MB)

### After Build:
- [ ] Install on clean test machine
- [ ] Launch app successfully
- [ ] All features work
- [ ] Settings persist
- [ ] Uninstall cleanly

---

## 🚀 Distribution

### Upload Installer:
```bash
# To GitHub Releases
gh release create v1.0.0 "dist/Atlas UX Setup 1.0.0.msi"

# To your website
scp "dist/Atlas UX Setup 1.0.0.msi" user@server:/var/www/downloads/

# To S3 (AWS)
aws s3 cp "dist/Atlas UX Setup 1.0.0.msi" s3://your-bucket/downloads/
```

### Auto-Updates (Optional):
Configure in `electron-builder.json`:
```json
{
  "publish": {
    "provider": "github",
    "owner": "your-username",
    "repo": "atlas-ux"
  }
}
```

---

## 📦 CI/CD Build (GitHub Actions)

Create `.github/workflows/build.yml`:

```yaml
name: Build Atlas UX

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run package:win:msi
      - uses: actions/upload-artifact@v3
        with:
          name: windows-installer
          path: dist/*.msi

  build-mac:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run package:mac:dmg
      - uses: actions/upload-artifact@v3
        with:
          name: mac-installer
          path: dist/*.dmg
```

---

## ✅ Final Verification

### Your Build is Ready When:
- ✅ `npm install` completes without errors
- ✅ `npm run build` succeeds
- ✅ `npm run package:win:msi` creates installer
- ✅ Installer file exists in `dist/`
- ✅ Installer runs on test machine
- ✅ App launches and works correctly
- ✅ All 140+ features functional
- ✅ Stripe integration works (if configured)

---

## 🎉 Success!

You now have a production-ready MSI installer for Atlas UX!

**Next Steps:**
1. ✅ Test installer on multiple Windows versions
2. ✅ Upload to your distribution platform
3. ✅ Share download link with users
4. ✅ Collect feedback and iterate

---

## 📞 Build Support

**Common Issues:**
- See `QUALITY_REPORT.md` for code health
- See `package.json` for build scripts
- See `electron-builder` docs for advanced config

**Need Help?**
1. Check build logs for specific errors
2. Verify all dependencies installed
3. Try clean build (`rm -rf node_modules && npm install`)
4. Review electron-builder documentation

---

**Last Updated:** February 3, 2026  
**Build Status:** 🟢 **READY**  
**Version:** 1.0.0

**Happy Building!** 🚀
