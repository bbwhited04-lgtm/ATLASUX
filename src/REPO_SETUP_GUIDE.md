# 📦 Atlas UX - Repository Setup & Deployment Guide

## 🎯 Quick Start (For New Developers)

After you push this to GitHub/GitLab, here's what someone else needs to do:

### **1. Clone the Repository**
```bash
git clone https://github.com/your-username/atlas-ux.git
cd atlas-ux
```

### **2. Install Dependencies**
```bash
npm install
```
**Wait 2-5 minutes** - This downloads all packages

### **3. Build the MSI Installer**
```bash
npm run package:win:msi
```

### **4. Get Your Installer**
Look in `installers/Atlas-UX-Setup-1.0.0-x64.msi`

---

## ⚠️ CRITICAL: This is NOT Tauri!

**Build System:** Electron + electron-builder  
**DO NOT USE:** `npx tauri build` ❌  
**CORRECT COMMAND:** `npm run package:win:msi` ✅

---

## 📋 What's Included in This Repo

### Core Application Files
```
atlas-ux/
├── App.tsx                    # Main app component
├── main.tsx                   # React entry point
├── index.html                 # HTML template
├── routes.ts                  # Router configuration
├── package.json               # Dependencies & scripts
├── vite.config.js            # Build configuration
├── electron-builder.json      # Installer configuration
└── .gitignore                 # Files to ignore
```

### Electron Files
```
├── electron/
│   ├── main.js               # Electron main process
│   └── preload.js            # Preload script
```

### Components (140+ Features)
```
├── components/
│   ├── Dashboard.tsx
│   ├── JobRunner.tsx
│   ├── ChatInterface.tsx
│   ├── SubscriptionManager.tsx
│   ├── premium/              # 20+ premium feature components
│   └── ui/                   # 30+ UI components
```

### Styles
```
├── styles/
│   └── globals.css           # Tailwind CSS + custom styles
```

### Documentation (30+ files)
```
├── README_ATLAS_UX.md
├── BUILD_GUIDE.md
├── COMPLETE_STATUS.md
├── STRIPE_SETUP_GUIDE.md
└── ... (many more)
```

---

## 🔑 Environment Variables Setup

### Required API Keys (Not Included in Repo!)

Create a `.env` file in the root directory:

```bash
# Supabase (Backend)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (Payments) - OPTIONAL for testing
STRIPE_PUBLISHABLE_KEY=your-publishable-key
STRIPE_SECRET_KEY=your-secret-key

# AI Platforms - OPTIONAL
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
DEEPSEEK_API_KEY=your-deepseek-key
```

**Note:** The app will work without these for development, but some features require API keys.

---

## 🛠️ Development Workflow

### **Option 1: Development Mode (Recommended First)**
```bash
npm run electron:dev
```
- Opens app in Electron window
- Hot-reload enabled
- DevTools available
- No build required

### **Option 2: Web Preview**
```bash
npm run dev
```
- Opens in browser at http://localhost:5173
- Fast iteration
- Missing Electron features

### **Option 3: Build & Test Installer**
```bash
npm run package:win:msi
```
- Creates production installer
- Test on real Windows install
- Slower iteration

---

## 📦 All Available Build Commands

### Windows Builds
```bash
npm run package:win:msi          # MSI installer
npm run package:win:nsis         # EXE installer (recommended)
npm run package:win:portable     # Portable EXE (no install)
npm run package:win:all          # All 3 above
```

### Mac Builds (macOS only)
```bash
npm run package:mac:dmg          # DMG installer
npm run package:mac:pkg          # PKG installer
npm run package:mac:universal    # Universal binary (Intel + M1/M2)
```

### Linux Builds (Linux only)
```bash
npm run electron:build:linux     # AppImage, DEB, RPM
```

---

## 🚀 Push to GitHub/GitLab

### First-Time Setup
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit - Atlas UX v1.0"

# Add remote repository
git remote add origin https://github.com/your-username/atlas-ux.git

# Push to GitHub
git push -u origin main
```

### Subsequent Updates
```bash
git add .
git commit -m "Update: describe your changes"
git push
```

---

## 🔒 Security Checklist

Before pushing to a public repo:

- [✅] `.gitignore` is present
- [✅] No API keys in code files
- [✅] No Stripe secret keys committed
- [✅] No database credentials in files
- [✅] Environment variables in `.env` (ignored by git)
- [✅] `STRIPE_CREDENTIALS.md` in `.gitignore`

**Files that should NOT be in repo:**
- `.env`
- `node_modules/`
- `installers/`
- `dist/`
- Any files with "credentials" or "keys" in the name

---

## 📥 For New Developers Downloading This Repo

### Step-by-Step Setup

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd atlas-ux
   ```

2. **Install Node.js** (if not installed)
   - Download from https://nodejs.org/
   - Version 18+ required

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run in development mode**
   ```bash
   npm run electron:dev
   ```

5. **Build installer (when ready)**
   ```bash
   npm run package:win:msi
   ```

6. **Find installer**
   - Located in `installers/` folder
   - File: `Atlas-UX-Setup-1.0.0-x64.msi`

---

## 🐛 Common Issues & Solutions

### Issue: "npm not found"
**Solution:** Install Node.js from https://nodejs.org/

### Issue: Build fails with "Cannot find module"
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "electron-builder not found"
**Solution:**
```bash
npm install electron-builder --save-dev
```

### Issue: MSI build fails
**Solution:**
- Ensure you're on Windows
- Run Command Prompt as Administrator
- Check Windows Installer service is running

### Issue: Icons missing in build
**Solution:**
- Create `/build/icon.ico` (Windows)
- Or remove icon references from `electron-builder.json`

### Issue: App opens but routes don't work
**Solution:**
- Check `vite.config.js` has `base: './'`
- Check `index.html` is in root directory
- Rebuild: `npm run build && npm run package:win:msi`

---

## 📊 Build Requirements

### Disk Space
- **Repository:** ~50 MB (without node_modules)
- **node_modules:** ~500 MB
- **Build output:** ~300 MB per platform
- **Total recommended:** 2 GB free space

### System Requirements
- **OS:** Windows 10/11, macOS 10.15+, or Linux
- **RAM:** 4 GB minimum, 8 GB recommended
- **CPU:** Any modern CPU (builds faster with more cores)

---

## 🎯 Testing Your Build

After creating an installer, test it:

1. **Clean Install Test**
   - Run installer on a different PC (or VM)
   - Verify app launches
   - Check all routes work
   - Test integrations panel
   - Verify settings persist

2. **Features to Test**
   - Dashboard loads
   - Navigation works
   - Job Runner displays
   - Chat interface opens
   - Settings save correctly
   - Mobile QR code generates
   - Subscription page opens Stripe links

3. **Uninstall Test**
   - Uninstall via Windows Settings
   - Verify files are removed
   - Check shortcuts are deleted

---

## 📚 Additional Documentation

After cloning, read these files:

- `BUILD_PROCESS.md` - Detailed build instructions
- `COMPLETE_STATUS.md` - Full feature list
- `README_ATLAS_UX.md` - Project overview
- `STRIPE_SETUP_GUIDE.md` - Stripe integration
- `BUILD_GUIDE.md` - Electron build details

---

## ✅ Final Verification

Before sharing your installer:

```bash
# 1. Clean install
npm install

# 2. Build
npm run package:win:msi

# 3. Check output
ls installers/

# You should see:
# Atlas-UX-Setup-1.0.0-x64.msi
```

---

## 🚀 You're All Set!

**Summary for new developers:**
1. Clone repo
2. `npm install`
3. `npm run package:win:msi`
4. Installer in `installers/` folder

**Build System:** Electron (NOT Tauri!)  
**Build Time:** 3-8 minutes  
**Output:** Professional MSI/EXE installers

---

*Last Updated: February 3, 2026*  
*Application: Atlas UX v1.0*  
*Platform: Windows 11 Desktop (Electron)*
