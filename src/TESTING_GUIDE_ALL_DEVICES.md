# 🧪 ATLAS UX - COMPLETE TESTING GUIDE

## **Test on MacBook, PC, and Phone** 📱💻

---

## **🚀 OPTION 1: WEB APP (EASIEST - TEST RIGHT NOW!)**

This works on ALL devices without installing anything!

### **Step 1: Start the Development Server**

Open Terminal (Mac) or Command Prompt (PC) in the project folder:

```bash
npm install
npm run dev
```

**Wait for:** `Local: http://localhost:5173`

### **Step 2: Test on Each Device**

#### **💻 On MacBook/PC:**
1. Open browser: `http://localhost:5173`
2. You'll see Atlas UX running!

#### **📱 On Phone (same WiFi network):**
1. Find your computer's IP address:
   - **Mac:** System Preferences → Network → Look for "IP Address"
   - **PC:** Run `ipconfig` in Command Prompt → Look for "IPv4 Address"
   - Example: `192.168.1.100`

2. On your phone's browser, go to:
   ```
   http://192.168.1.100:5173
   ```
   (Replace with YOUR IP address)

3. Atlas UX opens on your phone!

---

## **🖥️ OPTION 2: DESKTOP APP (MAC & PC)**

Build native desktop apps with installers!

### **🍎 FOR MACBOOK:**

#### **Build the Mac App:**
```bash
# In Terminal:
npm install
chmod +x build-all.sh
./build-all.sh
```

**Wait 10 minutes...** ☕

#### **Install & Test:**
1. Open `installers/` folder
2. Find `Atlas-UX-1.0.0-universal.dmg`
3. Double-click to mount
4. Drag Atlas UX to Applications
5. **Right-click** → **Open** (first time only - bypasses Gatekeeper)
6. Atlas UX launches as native Mac app!

**Shortcut:** After install, find in Launchpad or Spotlight

---

### **🖥️ FOR PC (WINDOWS):**

#### **Build the Windows App:**
```bash
# In Command Prompt or PowerShell:
npm install
build-all.bat
```

**Wait 10 minutes...** ☕

#### **Install & Test:**

##### **Option A: NSIS Installer (Recommended)**
1. Open `installers/` folder
2. Find `Atlas-UX-Setup-1.0.0-x64.exe`
3. Double-click to run installer
4. Click "More info" if Windows SmartScreen appears
5. Click "Run anyway"
6. Follow installation wizard
7. Atlas UX launches automatically!

**Shortcut:** Find in Start Menu or Desktop

##### **Option B: MSI Installer (Enterprise)**
1. Open `installers/` folder
2. Find `Atlas-UX-Setup-1.0.0-x64.msi`
3. Double-click to install
4. Follow wizard
5. Done!

##### **Option C: Portable (No Install)**
1. Open `installers/` folder
2. Find `Atlas-UX-Portable-1.0.0.exe`
3. Copy to USB drive or any folder
4. Double-click to run
5. No installation needed!

---

## **📱 OPTION 3: MOBILE TESTING**

Atlas UX doesn't have a native mobile app yet, but you can test the responsive web version!

### **Method 1: Development Server (Best)**
1. Start dev server on your computer: `npm run dev`
2. Find your computer's IP (see Option 1 above)
3. On phone browser: `http://YOUR_IP:5173`
4. Works perfectly on mobile!

### **Method 2: Build & Deploy**
1. Build for production: `npm run build`
2. Deploy `dist/` folder to:
   - **Netlify** (free): https://netlify.com
   - **Vercel** (free): https://vercel.com
   - **GitHub Pages** (free)
3. Access from phone via deployed URL
4. Test on real production environment!

---

## **🧪 WHAT TO TEST:**

### **1. Dashboard**
- ✅ View overview cards
- ✅ Check Business Assets quick action
- ✅ Check Processing Settings quick action
- ✅ View recent activity
- ✅ Check animations

### **2. Integrations (MOST IMPORTANT!)**
- ✅ Navigate to Integrations page
- ✅ Click "CRM" tab
- ✅ **Scroll down - see NEW Amazon/AWS integrations:**
  - Amazon Seller Central (orange icon)
  - Amazon Advertising
  - Amazon MWS/SP-API
  - Amazon Business
  - AWS S3
  - AWS EC2
  - AWS Lambda
  - AWS RDS
  - AWS CloudFront
  - AWS SES
  - AWS DynamoDB
  - Amazon Prime
- ✅ Click "Connect" on Amazon Seller Central
- ✅ Test connection flow
- ✅ See OAuth authorization screen
- ✅ Test account selection
- ✅ Verify success message

### **3. Business Assets**
- ✅ Navigate to Business Assets
- ✅ View assets (Products, Services, Packages)
- ✅ Create new asset
- ✅ Edit existing asset
- ✅ Test search/filter

### **4. Processing Settings**
- ✅ Navigate to Processing Settings
- ✅ View GPU/CPU settings
- ✅ Toggle GPU acceleration
- ✅ Adjust processing priority
- ✅ Test performance mode

### **5. Social Listening**
- ✅ Navigate to Social Listening
- ✅ View connected platforms
- ✅ See real-time mentions
- ✅ Check sentiment analysis
- ✅ Test filters

### **6. Automation Manager**
- ✅ Navigate to Automation
- ✅ View active workflows
- ✅ Create new automation
- ✅ Test trigger selection
- ✅ Test action configuration

### **7. Voice AI Interface**
- ✅ Navigate to Voice AI
- ✅ Test voice input
- ✅ View conversation history
- ✅ Test commands
- ✅ Check AI responses

### **8. Neptune Control**
- ✅ Navigate to Neptune
- ✅ View access requests
- ✅ Approve/deny requests
- ✅ Check security logs
- ✅ Test file access controls

### **9. Pluto Job Runner**
- ✅ Navigate to Pluto
- ✅ View active jobs
- ✅ Create new job
- ✅ Monitor progress
- ✅ Check completed jobs

### **10. Responsive Design**
- ✅ Test on desktop (1920x1080)
- ✅ Test on laptop (1366x768)
- ✅ Test on tablet (768px)
- ✅ Test on phone (375px)
- ✅ Check all breakpoints

---

## **🔍 TESTING CHECKLIST:**

### **Desktop App (Mac & PC):**
- [ ] App installs successfully
- [ ] App launches without errors
- [ ] Desktop shortcut works
- [ ] Start menu entry works (PC)
- [ ] Application menu works (Mac)
- [ ] All pages load correctly
- [ ] Animations are smooth
- [ ] No console errors
- [ ] File dialogs work
- [ ] Window controls work
- [ ] App closes properly
- [ ] Uninstaller works

### **Web App (All Devices):**
- [ ] Loads on http://localhost:5173
- [ ] Loads on mobile via IP
- [ ] All pages accessible
- [ ] Navigation works
- [ ] Buttons clickable
- [ ] Forms functional
- [ ] Images load
- [ ] Icons display
- [ ] Colors correct (dark theme)
- [ ] Animations play
- [ ] No 404 errors
- [ ] No JavaScript errors

### **Mobile Responsive:**
- [ ] Header adapts to mobile
- [ ] Sidebar becomes hamburger menu
- [ ] Cards stack vertically
- [ ] Text is readable
- [ ] Buttons are tappable
- [ ] Forms are usable
- [ ] Scrolling is smooth
- [ ] Touch gestures work
- [ ] No horizontal scroll
- [ ] Content fits screen

### **Amazon/AWS Integrations:**
- [ ] All 12 integrations visible
- [ ] Orange Amazon icons display
- [ ] Connect buttons work
- [ ] Connection modal opens
- [ ] OAuth flow displays
- [ ] API key inputs work
- [ ] Account selection works
- [ ] Success message shows
- [ ] Integration marked as connected
- [ ] Disconnect works
- [ ] Features list displays
- [ ] Help text visible

---

## **🐛 COMMON ISSUES & FIXES:**

### **"npm: command not found"**
**Fix:** Install Node.js from https://nodejs.org/

### **"Port 5173 already in use"**
**Fix:** Kill the process:
```bash
# Mac/Linux:
lsof -ti:5173 | xargs kill -9

# Windows:
netstat -ano | findstr :5173
taskkill /PID [PID_NUMBER] /F
```

### **Can't connect from phone**
**Fix:** 
1. Make sure phone and computer are on SAME WiFi
2. Check firewall isn't blocking port 5173
3. Use correct IP address (not 127.0.0.1)

### **Mac: "App can't be opened"**
**Fix:** 
1. Right-click → Open (not double-click)
2. Or: System Preferences → Security → "Open Anyway"

### **Windows: "Windows protected your PC"**
**Fix:**
1. Click "More info"
2. Click "Run anyway"
3. (This happens because app isn't code-signed)

### **Build fails on Mac**
**Fix:**
```bash
# Install Xcode Command Line Tools:
xcode-select --install

# Then try again:
./build-all.sh
```

### **Build fails on Windows**
**Fix:**
```bash
# Reinstall dependencies:
rmdir /s node_modules
del package-lock.json
npm install
build-all.bat
```

---

## **📸 SCREENSHOT TESTING:**

Test these specific screens:

1. **Dashboard** - Home screen with stats
2. **Integrations** - CRM tab with Amazon/AWS
3. **Business Assets** - Asset management
4. **Social Listening** - Real-time monitoring
5. **Automation** - Workflow builder
6. **Neptune Control** - Access requests
7. **Pluto Jobs** - Job queue
8. **Voice AI** - Chat interface
9. **Processing Settings** - GPU/CPU controls
10. **Mobile View** - All pages on phone

---

## **⚡ QUICK TEST SEQUENCE:**

### **5-Minute Test:**
1. Open app
2. Navigate to Integrations
3. Click CRM tab
4. Verify 12 Amazon/AWS integrations
5. Click Connect on Amazon Seller Central
6. Test connection flow
7. Done!

### **15-Minute Test:**
1. Test all 10 main pages
2. Test responsive design
3. Test 5 integrations
4. Test 2 automations
5. Test voice input
6. Test Neptune approval
7. Check for errors
8. Done!

### **30-Minute Test:**
1. Full feature walkthrough
2. Test all integrations
3. Create business asset
4. Set up automation
5. Test voice commands
6. Approve Neptune requests
7. Run Pluto job
8. Test on all 3 devices
9. Take screenshots
10. Document bugs
11. Done!

---

## **📊 PERFORMANCE TESTING:**

### **Desktop App:**
- Startup time: < 3 seconds
- Page load: < 500ms
- Animation FPS: 60fps
- Memory usage: < 500MB
- CPU idle: < 5%

### **Web App:**
- First load: < 2 seconds
- Page transition: < 200ms
- Lighthouse score: > 90
- Mobile score: > 85

---

## **🎥 RECORDING YOUR TESTS:**

### **Mac:**
- Use QuickTime: File → New Screen Recording
- Or: Cmd+Shift+5 → Record screen

### **Windows:**
- Use Windows Game Bar: Win+G
- Click Record button
- Or: Use OBS Studio (free)

### **Phone:**
- **iPhone:** Settings → Control Center → Add Screen Recording
  - Swipe down, tap record button
- **Android:** Quick Settings → Screen Record
  - Or use AZ Screen Recorder (free)

---

## **✅ ACCEPTANCE CRITERIA:**

Atlas UX passes testing if:

### **Functionality:**
- ✅ All 65 integrations display
- ✅ Amazon/AWS integrations work
- ✅ Connection flows complete
- ✅ All pages load without errors
- ✅ Navigation works perfectly
- ✅ Forms submit correctly
- ✅ Data persists correctly

### **Performance:**
- ✅ Loads in < 3 seconds
- ✅ Animations are smooth (60fps)
- ✅ No memory leaks
- ✅ CPU usage reasonable

### **Design:**
- ✅ Dark theme consistent
- ✅ Cyan/blue accents visible
- ✅ Typography readable
- ✅ Icons display correctly
- ✅ Responsive on all screens

### **Stability:**
- ✅ No crashes
- ✅ No console errors
- ✅ No broken links
- ✅ No missing images
- ✅ No layout issues

---

## **🚀 RECOMMENDED TEST FLOW:**

### **Day 1: Setup & Basic Testing**
1. Install on PC
2. Install on Mac
3. Test web version on phone
4. Verify all 3 platforms launch
5. Do 15-minute test on each

### **Day 2: Feature Testing**
1. Test all integrations
2. Test Amazon/AWS connections
3. Test automation workflows
4. Test business assets
5. Test voice AI

### **Day 3: Edge Cases**
1. Test offline mode
2. Test with slow network
3. Test with large datasets
4. Test concurrent users
5. Stress test

### **Day 4: Polish**
1. Fix any bugs found
2. Improve performance
3. Add missing features
4. Update documentation
5. Final QA pass

---

## **📱 MOBILE TESTING TIPS:**

### **Test on Multiple Browsers:**
- Safari (iOS)
- Chrome (iOS/Android)
- Firefox (Android)
- Edge (Android)

### **Test Different Screen Sizes:**
- iPhone SE (375px)
- iPhone 14 (390px)
- iPhone 14 Pro Max (430px)
- iPad (768px)
- iPad Pro (1024px)
- Android phone (360-412px)
- Android tablet (600-800px)

### **Test Interactions:**
- Tap targets (minimum 44x44px)
- Swipe gestures
- Pinch to zoom
- Orientation changes
- Keyboard display
- Form autofill

---

## **🎯 PRIORITY TEST AREAS:**

### **🔥 CRITICAL (Must Work):**
1. ✅ App launches
2. ✅ Navigation works
3. ✅ Amazon/AWS integrations display
4. ✅ Connection flows complete
5. ✅ No errors in console

### **⚠️ HIGH (Should Work):**
1. ✅ All pages load
2. ✅ Forms submit
3. ✅ Data persists
4. ✅ Animations smooth
5. ✅ Mobile responsive

### **💡 MEDIUM (Nice to Have):**
1. ✅ Performance optimized
2. ✅ Offline mode works
3. ✅ Advanced features
4. ✅ Edge cases handled
5. ✅ Help documentation

---

## **📞 NEED HELP?**

### **During Testing:**
1. Check browser console (F12)
2. Look for error messages
3. Check network tab
4. Verify API responses
5. Review logs

### **Common Commands:**
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Build Mac app
./build-all.sh

# Build Windows app
build-all.bat

# Clear cache
rm -rf node_modules
npm install

# Check for errors
npm run build
```

---

## **🎊 YOU'RE READY TO TEST!**

### **Quick Start:**
1. **MacBook:** Run `./build-all.sh` → Install DMG
2. **PC:** Run `build-all.bat` → Install EXE
3. **Phone:** Visit `http://YOUR_IP:5173`

### **Or Just Run Web Version:**
```bash
npm install
npm run dev
```

Then open `http://localhost:5173` on ANY device!

---

**🎯 Focus on testing the new Amazon/AWS integrations in the Integrations → CRM tab!**

**📸 Take screenshots of any bugs you find!**

**🎥 Record videos of the app in action!**

---

*Happy Testing!* 🧪✨

*Built with 💙 by your AI development team*  
*Atlas UX v1.0 - Ready for Testing*  
*February 3, 2026*
