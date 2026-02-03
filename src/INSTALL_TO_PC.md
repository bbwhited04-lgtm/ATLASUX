# 💻 INSTALL ATLAS UX TO F:\atlasux ON WINDOWS

## **Complete Installation Guide for PC** 🚀

---

## **📋 PREREQUISITES:**

Before starting, install these:

### **1. Install Node.js (Required)**
1. Go to: https://nodejs.org/
2. Download **LTS version** (20.x or higher)
3. Run installer
4. Click "Next" through all steps
5. **Restart your PC**

### **2. Install Git (Optional - for GitHub)**
1. Go to: https://git-scm.com/download/win
2. Download Git for Windows
3. Run installer
4. Click "Next" through all steps
5. **Restart Command Prompt**

---

## **🚀 METHOD 1: IF YOU HAVE FILES LOCALLY**

If you already have the Atlas UX files on your computer:

### **Step 1: Create the Folder**
1. Open **File Explorer**
2. Navigate to **F:\ drive**
3. Right-click → **New** → **Folder**
4. Name it: `atlasux`

### **Step 2: Copy Files**
1. Find your current Atlas UX project files
2. **Copy ALL files** from the project
3. **Paste** into `F:\atlasux`

### **Step 3: Verify Files**
Check that `F:\atlasux` contains:
```
F:\atlasux\
  ├── package.json
  ├── vite.config.ts
  ├── tsconfig.json
  ├── index.html
  ├── App.tsx
  ├── components/
  ├── node_modules/
  ├── public/
  └── ... (all other files)
```

### **Step 4: Install Dependencies**
1. Press **Win + R**
2. Type: `cmd` and press Enter
3. In Command Prompt, type:
```cmd
F:
cd F:\atlasux
npm install
```

Wait 2-3 minutes for installation...

### **Step 5: Run the App**
```cmd
npm run dev
```

**🎉 Done!** Open browser: `http://localhost:5173`

---

## **🚀 METHOD 2: DOWNLOAD FROM GITHUB**

If your project is on GitHub:

### **Step 1: Create Folder**
1. Open **File Explorer**
2. Go to **F:\ drive**
3. Create folder: `atlasux`

### **Step 2: Clone Repository**
1. Press **Win + R**
2. Type: `cmd` and press Enter
3. In Command Prompt:
```cmd
F:
cd F:\
git clone https://github.com/YOUR-USERNAME/atlas-ux.git atlasux
```
(Replace `YOUR-USERNAME` with actual GitHub username)

### **Step 3: Install Dependencies**
```cmd
cd F:\atlasux
npm install
```

Wait 2-3 minutes...

### **Step 4: Run the App**
```cmd
npm run dev
```

**🎉 Done!** Open: `http://localhost:5173`

---

## **🚀 METHOD 3: DOWNLOAD AS ZIP**

If you have a ZIP file:

### **Step 1: Extract ZIP**
1. Right-click the ZIP file
2. Click **Extract All...**
3. Browse to: `F:\`
4. Extract
5. Rename folder to: `atlasux`

### **Step 2: Open Command Prompt**
1. Press **Win + R**
2. Type: `cmd`
3. Press Enter

### **Step 3: Navigate & Install**
```cmd
F:
cd F:\atlasux
npm install
```

Wait 2-3 minutes...

### **Step 4: Run the App**
```cmd
npm run dev
```

**🎉 Done!** Open: `http://localhost:5173`

---

## **🚀 METHOD 4: CREATE FROM SCRATCH (ADVANCED)**

If you don't have any files yet:

### **Step 1: Create Folder**
```cmd
F:
mkdir atlasux
cd atlasux
```

### **Step 2: Initialize Project**
```cmd
npm init -y
npm install vite @vitejs/plugin-react react react-dom
npm install -D typescript @types/react @types/react-dom
npm install tailwindcss postcss autoprefixer
npm install lucide-react
```

### **Step 3: Copy All Files**
You'll need to copy all the project files I created for you into `F:\atlasux`

---

## **✅ VERIFY INSTALLATION:**

### **Check if Node.js is Installed:**
```cmd
node --version
```
Should show: `v20.x.x` or higher

### **Check if npm is Installed:**
```cmd
npm --version
```
Should show: `10.x.x` or higher

### **Check Current Directory:**
```cmd
cd
```
Should show: `F:\atlasux`

### **Check Files Exist:**
```cmd
dir
```
Should list: `package.json`, `App.tsx`, `components`, etc.

---

## **📂 FINAL FOLDER STRUCTURE:**

After installation, `F:\atlasux` should contain:

```
F:\atlasux\
├── node_modules/          (created after npm install)
├── components/
│   ├── ui/
│   ├── Integrations.tsx   ← Amazon/AWS integrations here!
│   ├── Dashboard.tsx
│   ├── BusinessAssets.tsx
│   ├── ProcessingSettings.tsx
│   └── ... (all components)
├── public/
├── styles/
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── App.tsx
├── build-all.bat          ← Build Windows installer
├── build-all.sh           ← Build Mac installer
├── electron.config.json
├── README.md
└── ... (all other files)
```

---

## **🎯 QUICK COMMAND REFERENCE:**

### **Navigate to Project:**
```cmd
F:
cd F:\atlasux
```

### **Install Dependencies:**
```cmd
npm install
```

### **Run Development Server:**
```cmd
npm run dev
```

### **Build for Production:**
```cmd
npm run build
```

### **Build Windows Installer:**
```cmd
build-all.bat
```

### **Stop Server:**
Press `Ctrl + C` in Command Prompt

---

## **🔧 TROUBLESHOOTING:**

### **"npm: command not found"**
**Fix:** Install Node.js from https://nodejs.org/
Then restart Command Prompt

### **"Cannot find module..."**
**Fix:**
```cmd
cd F:\atlasux
rmdir /s node_modules
del package-lock.json
npm install
```

### **"Port 5173 already in use"**
**Fix:**
```cmd
netstat -ano | findstr :5173
taskkill /PID [PID_NUMBER] /F
npm run dev
```

### **"Permission denied"**
**Fix:** Run Command Prompt as Administrator:
1. Search "cmd" in Start Menu
2. Right-click → **Run as administrator**
3. Try again

### **Git not recognized**
**Fix:** Install Git from https://git-scm.com/
Restart Command Prompt

### **F:\ drive not accessible**
**Fix:** 
1. Check drive exists in File Explorer
2. Use different drive: `C:\atlasux` or `D:\atlasux`
3. Adjust commands accordingly

---

## **📱 AFTER INSTALLATION - TEST IT:**

### **Step 1: Start the Server**
```cmd
cd F:\atlasux
npm run dev
```

### **Step 2: Open Browser**
Go to: `http://localhost:5173`

### **Step 3: See Amazon/AWS Integrations**
1. Click **Integrations** in sidebar
2. Click **CRM** tab
3. Scroll down
4. See 12 NEW Amazon/AWS integrations! 🎉

---

## **🎬 STEP-BY-STEP VIDEO GUIDE:**

### **Watch Me Do It:**

```
1. Open File Explorer → F:\ → Create "atlasux" folder
2. Copy all project files into F:\atlasux
3. Open Command Prompt (Win + R → cmd)
4. Type: F:
5. Type: cd F:\atlasux
6. Type: npm install
7. Wait 2-3 minutes...
8. Type: npm run dev
9. Open browser: http://localhost:5173
10. DONE! 🎉
```

---

## **🚀 RECOMMENDED APPROACH:**

### **For Most Users:**

1. **Create folder:**
   ```cmd
   mkdir F:\atlasux
   ```

2. **Copy files** from current location to `F:\atlasux`

3. **Install:**
   ```cmd
   cd F:\atlasux
   npm install
   ```

4. **Run:**
   ```cmd
   npm run dev
   ```

5. **Test:**
   Open `http://localhost:5173`

**That's it!** ✨

---

## **💡 PRO TIPS:**

### **Create Desktop Shortcut:**
1. Right-click Desktop → New → Shortcut
2. Location: `cmd.exe /k "cd /d F:\atlasux && npm run dev"`
3. Name: "Start Atlas UX"
4. Double-click to launch!

### **Add to VS Code:**
1. Open VS Code
2. File → Open Folder
3. Browse to `F:\atlasux`
4. Click "Select Folder"
5. Edit files directly!

### **Use PowerShell Instead:**
1. Press Win + X
2. Select "PowerShell"
3. Same commands work!

---

## **📞 COMMON QUESTIONS:**

### **Q: Do I need to install every time?**
A: No! Only run `npm install` once. After that, just use `npm run dev`

### **Q: Can I use a different drive?**
A: Yes! Use `C:\atlasux` or `D:\atlasux` - just change the drive letter

### **Q: What if F:\ doesn't exist?**
A: Use any drive you have: `C:\atlasux` works fine!

### **Q: Do I need Git?**
A: Only if cloning from GitHub. Otherwise, just copy files.

### **Q: How much space needed?**
A: About 500MB for all files + node_modules

### **Q: Can I delete node_modules?**
A: Yes, but you'll need to run `npm install` again

### **Q: Internet required?**
A: Only for initial `npm install`. After that, works offline!

---

## **🎊 YOU'RE READY!**

### **Quick Start:**
```cmd
F:
cd F:\atlasux
npm install
npm run dev
```

**Open:** `http://localhost:5173`

**See:** Amazon/AWS integrations in **Integrations → CRM**!

---

## **📚 NEXT STEPS:**

After installation:
1. ✅ Read: `/START_HERE.md` - Quick test guide
2. ✅ Read: `/TESTING_GUIDE_ALL_DEVICES.md` - Full testing
3. ✅ Read: `/AMAZON_AWS_INTEGRATION_COMPLETE.md` - What's new
4. ✅ Build installer: Run `build-all.bat`
5. ✅ Test on phone: Use your computer's IP

---

**🎯 Installation takes 5 minutes!** ⚡

**Questions? Just ask!** 💙

---

*Built with 💙 Atlas UX v1.0*  
*Installation Guide for Windows*  
*February 3, 2026*
