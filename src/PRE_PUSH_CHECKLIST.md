# ✅ Pre-Push Checklist for Atlas UX

## 🚨 CRITICAL: Read This Before Pushing to Git!

---

## ⚠️ Build System Clarification

**YOUR APP IS:**
- ✅ **Electron** (electron + electron-builder)
- ✅ Uses React + Vite
- ✅ Creates MSI/EXE/DMG installers

**YOUR APP IS NOT:**
- ❌ **Tauri** 
- ❌ Does NOT use `npx tauri build`
- ❌ Does NOT use Rust

**CORRECT BUILD COMMAND:**
```bash
npm run package:win:msi
```

**WRONG COMMAND:**
```bash
npx tauri build  # ❌ THIS WILL NOT WORK!
```

---

## 📋 Essential Files Checklist

### ✅ Files You MUST Have (Created)
- [✅] `.gitignore` - Protects secrets
- [✅] `vite.config.js` - Vite configuration
- [✅] `index.html` - HTML entry point
- [✅] `main.tsx` - React entry point
- [✅] `package.json` - Dependencies
- [✅] `electron-builder.json` - Build config
- [✅] `BUILD_PROCESS.md` - Build instructions
- [✅] `REPO_SETUP_GUIDE.md` - Setup guide

### ✅ Files Already Present
- [✅] `App.tsx` - Main app
- [✅] `routes.ts` - Router
- [✅] All components in `/components/`
- [✅] All UI components in `/components/ui/`
- [✅] Electron files in `/electron/`
- [✅] Styles in `/styles/globals.css`

### ⚠️ Files You NEED (but may not have)
- [⚠️] `/build/icon.ico` - Windows icon (REQUIRED for Windows builds)
- [⚠️] `/build/icon.icns` - Mac icon (REQUIRED for Mac builds)

**Without icons, builds may fail!** See `/build/ICON_REQUIREMENTS.md`

---

## 🔒 Security Checklist

### ❌ DO NOT COMMIT THESE FILES:
- [ ] `.env` files
- [ ] `STRIPE_CREDENTIALS.md` (if it contains real keys)
- [ ] Any file with "credentials", "keys", or "secrets" in the name
- [ ] `node_modules/` (automatically ignored)
- [ ] `installers/` (build output)
- [ ] `dist/` (build output)

### ✅ Check Your Code for Secrets:
```bash
# Search for potential API keys in code
grep -r "sk_live_" .
grep -r "pk_live_" .
grep -r "api_key" .
```

If you find any hardcoded keys, move them to `.env` file!

---

## 🔧 Dependencies Check

### Required in package.json:
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router": "^7.1.1",
    "lucide-react": "^0.468.0",
    "recharts": "^2.15.0",
    "motion": "^11.15.0"
  },
  "devDependencies": {
    "vite": "^6.0.11",
    "electron": "^33.3.1",
    "electron-builder": "^25.1.8",
    "tailwindcss": "^4.0.0"
  }
}
```

All present? ✅

---

## 🧪 Pre-Push Tests

### Test 1: Install Dependencies
```bash
npm install
```
**Expected:** No errors, completes successfully

### Test 2: Development Mode
```bash
npm run electron:dev
```
**Expected:** App opens, no console errors

### Test 3: Build Web Assets
```bash
npm run build
```
**Expected:** Creates `dist/` folder with index.html

### Test 4: (Optional) Build Installer
```bash
npm run package:win:msi
```
**Expected:** Creates `installers/Atlas-UX-Setup-1.0.0-x64.msi`

---

## 📦 What Gets Pushed to Git

### ✅ WILL be pushed:
- All source code (`.tsx`, `.ts`, `.css`, `.json`)
- Configuration files
- Documentation (`.md` files)
- Electron files
- `package.json`

### ❌ Will NOT be pushed (via .gitignore):
- `node_modules/` (300+ MB)
- `dist/` (build output)
- `installers/` (installers)
- `.env` files (secrets)
- Log files
- OS files (`.DS_Store`, `Thumbs.db`)

**Repository size:** ~50-100 MB (without node_modules)

---

## 🚀 Git Push Workflow

### First Time:
```bash
# 1. Initialize (if not done)
git init

# 2. Add all files
git add .

# 3. Check what's being committed
git status

# 4. Commit
git commit -m "Initial commit - Atlas UX v1.0"

# 5. Add remote
git remote add origin https://github.com/YOUR-USERNAME/atlas-ux.git

# 6. Push
git push -u origin main
```

### Updates:
```bash
git add .
git commit -m "Update: your changes here"
git push
```

---

## 🎯 After Pushing - New Developer Workflow

When someone clones your repo, they'll do:

```bash
# 1. Clone
git clone https://github.com/YOUR-USERNAME/atlas-ux.git
cd atlas-ux

# 2. Install dependencies (takes 2-5 min)
npm install

# 3. Run in dev mode (to test)
npm run electron:dev

# 4. Build installer
npm run package:win:msi

# 5. Find installer
ls installers/
# Output: Atlas-UX-Setup-1.0.0-x64.msi
```

**Total time:** 5-10 minutes from clone to working installer

---

## 📊 Final Verification

### Run these commands to verify everything is ready:

```bash
# 1. Check git is initialized
git status

# 2. Check .gitignore exists
cat .gitignore

# 3. Check no secrets in staged files
git diff --cached | grep -i "api.*key"
git diff --cached | grep -i "sk_live"
git diff --cached | grep -i "pk_live"

# 4. Check file count
git ls-files | wc -l
# Should be 100-200 files
```

---

## ✅ Green Light Criteria

You're ready to push if:

- [✅] `.gitignore` exists and contains `node_modules/`, `.env`, etc.
- [✅] No API keys hardcoded in source files
- [✅] `package.json` has all dependencies
- [✅] `vite.config.js` exists
- [✅] `index.html` exists
- [✅] `main.tsx` exists
- [✅] `electron-builder.json` configured
- [✅] Documentation files present
- [✅] No `node_modules/` in staging area
- [✅] `npm install` works without errors

---

## 🆘 Common Issues Before Push

### Issue: "git not found"
**Solution:** Install Git from https://git-scm.com/

### Issue: "remote already exists"
**Solution:**
```bash
git remote remove origin
git remote add origin <new-url>
```

### Issue: "Large files warning"
**Solution:** 
- Check `.gitignore` is working
- Run: `git rm -r --cached node_modules`

### Issue: "Permission denied (publickey)"
**Solution:**
- Set up SSH keys: https://docs.github.com/en/authentication
- Or use HTTPS instead of SSH

---

## 📚 Important Documentation to Read

After pushing, share these files with your team:

1. **`REPO_SETUP_GUIDE.md`** - How to clone and build
2. **`BUILD_PROCESS.md`** - Detailed build instructions
3. **`COMPLETE_STATUS.md`** - Full feature list
4. **`README_ATLAS_UX.md`** - Project overview

---

## 🎯 Quick Reference

### What someone needs after cloning:
1. **Node.js 18+** (from nodejs.org)
2. **Run:** `npm install`
3. **Build:** `npm run package:win:msi`
4. **Result:** MSI installer in `installers/` folder

### They do NOT need:
- ❌ Tauri CLI
- ❌ Rust
- ❌ Python
- ❌ Visual Studio (unless they want to modify Electron)

---

## 🔐 Environment Variables Reminder

After pushing, create a separate document for your team with API keys:

**DO NOT COMMIT THIS FILE!**

```
# Share this via secure channel (not Git!)

SUPABASE_URL=...
SUPABASE_ANON_KEY=...
STRIPE_PUBLISHABLE_KEY=...
OPENAI_API_KEY=...
```

---

## ✅ FINAL CHECKLIST

Before you push:

- [ ] Read this entire document
- [ ] Verify `.gitignore` exists
- [ ] Check no secrets in code
- [ ] Run `npm install` successfully
- [ ] Run `npm run build` successfully
- [ ] (Optional) Run `npm run package:win:msi` successfully
- [ ] Review `git status` output
- [ ] Understand this is ELECTRON, not Tauri
- [ ] Ready to share repo URL with team

---

## 🚀 YOU'RE READY!

**Build System:** Electron + electron-builder  
**Build Command:** `npm run package:win:msi`  
**NOT Tauri!**

Push with confidence! 🎉

---

*Last Updated: February 3, 2026*  
*Application: Atlas UX v1.0*  
*Framework: Electron (React + Vite)*
