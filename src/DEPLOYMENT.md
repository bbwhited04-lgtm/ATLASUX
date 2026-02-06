# Atlas UX - Deployment & Installation Guide

## 📦 Supported Platforms

### ✅ **Supported**
- **Windows 11** (Primary Target) - MSI & EXE installers
- **Windows 10** (Compatible) - MSI & EXE installers  
- **macOS** (Monterey 12.0+) - DMG & PKG installers

### ❌ **Not Supported**
- **Chromebook** - Insufficient system access and permissions
- **Linux** - Future consideration (Phase 4)
- **Web Browser** - This is a native desktop application, not a web app

---

## 🖥️ System Requirements

### **Windows 11/10**
- **OS**: Windows 10 (Build 19041+) or Windows 11
- **Processor**: Intel Core i5 / AMD Ryzen 5 or better
- **RAM**: 8 GB minimum, 16 GB recommended
- **Storage**: 2 GB for installation, 10+ GB for operation
- **Graphics**: DirectX 12 compatible
- **Internet**: Required for AI integrations and cloud sync
- **.NET Runtime**: 6.0 or higher (included in installer)
- **Administrator Access**: Required for first-run permissions

### **macOS**
- **OS**: macOS Monterey (12.0) or later
- **Processor**: Apple M1/M2 or Intel Core i5 or better
- **RAM**: 8 GB minimum, 16 GB recommended
- **Storage**: 2 GB for installation, 10+ GB for operation
- **Internet**: Required for AI integrations and cloud sync
- **Admin Privileges**: Required for first-run permissions

---

## 📥 Installation Methods

### **Windows - MSI Installer (Recommended)**

#### **Features:**
- Enterprise deployment ready
- Group Policy (GPO) support
- Silent installation capability
- Centralized configuration
- Automatic updates
- System-wide installation

#### **Installation Command:**
```powershell
# Standard installation
msiexec /i AtlasUX-Setup-1.0.0.msi

# Silent installation (enterprise)
msiexec /i AtlasUX-Setup-1.0.0.msi /quiet /norestart

# Silent with custom install directory
msiexec /i AtlasUX-Setup-1.0.0.msi /quiet INSTALLDIR="C:\AtlasUX"

# With logging
msiexec /i AtlasUX-Setup-1.0.0.msi /l*v install.log
```

#### **MSI Properties:**
- `INSTALLDIR` - Custom installation directory
- `AUTOSTART` - Run on Windows startup (1 or 0)
- `ALLUSERS` - Install for all users (1) or current user (0)
- `DEFAULTDRIVES` - Default drive access (e.g., "C;D")

---

### **Windows - EXE Installer (User-Friendly)**

#### **Features:**
- Interactive setup wizard
- User-friendly interface
- Per-user or all-users installation
- Desktop shortcut creation
- Start Menu integration
- Automatic .NET runtime installation

#### **Installation:**
1. Download `AtlasUX-Setup-1.0.0.exe`
2. Right-click → "Run as Administrator"
3. Follow the setup wizard
4. Complete first-run permission setup

#### **Command Line Options:**
```powershell
# Silent installation
AtlasUX-Setup-1.0.0.exe /S

# Silent with custom directory
AtlasUX-Setup-1.0.0.exe /S /D=C:\AtlasUX

# Create desktop shortcut
AtlasUX-Setup-1.0.0.exe /S /SHORTCUT

# No auto-start
AtlasUX-Setup-1.0.0.exe /S /NOAUTOSTART
```

---

### **macOS - DMG Package (User Installation)**

#### **Features:**
- Drag-and-drop installation
- Code-signed and notarized
- Gatekeeper compatible
- User-friendly

#### **Installation:**
1. Download `AtlasUX-1.0.0.dmg`
2. Double-click to mount
3. Drag "Atlas UX" to Applications folder
4. Eject DMG
5. Launch from Applications
6. Grant permissions when prompted

---

### **macOS - PKG Installer (Enterprise)**

#### **Features:**
- Enterprise deployment
- Command-line installation
- Scriptable deployment
- Automatic permissions

#### **Installation:**
```bash
# Standard installation
sudo installer -pkg AtlasUX-1.0.0.pkg -target /

# Install for current user only
installer -pkg AtlasUX-1.0.0.pkg -target CurrentUserHomeDirectory
```

---

## 🔐 First-Run Permission Setup

### **What Happens on First Launch:**

Atlas UX will display a **First-Run Setup Wizard** that requests:

#### **1. System Permissions** (Step 1)
Required permissions (must grant):
- ✅ **File System Access** - Read/write files across PC
- ✅ **Network Access** - Connect to internet services
- ✅ **System Information** - Read hardware and OS info
- ✅ **Background Tasks** - Run when minimized

Optional permissions (recommended):
- ⚙️ **Clipboard Access** - Copy/paste functionality
- ⚙️ **System Notifications** - Desktop alerts
- ⚙️ **Run on Startup** - Launch with Windows/macOS

#### **2. Drive Access Configuration** (Step 2)
User selects which drives Atlas can access:
- **C:\ (System Drive)** - Recommended with restrictions
- **D:\ (Data Drive)** - Full access recommended
- **E:\ (External Drives)** - Optional

Each drive can be configured as:
- **Full Access** - Atlas can read/write anywhere
- **Restricted Access** - Exclude system folders

#### **3. Folder Restrictions** (Automatic)
System folders are automatically protected:
- `C:\Windows\` - Windows system files
- `C:\Program Files\` - Installed programs
- `C:\Program Files (x86)\` - 32-bit programs
- `C:\ProgramData\` - System app data

User can add additional restricted folders.

#### **4. Review & Confirm** (Step 3)
Review all settings before finalizing.

---

## 🛠️ Build Configuration

### **Windows Build - Electron Forge**

#### **Package Configuration:**
```json
{
  "name": "atlas-ux",
  "productName": "Atlas UX",
  "version": "1.0.0",
  "description": "Standalone AI Employee for Windows",
  "main": "src/main.js",
  "build": {
    "appId": "com.atlasux.app",
    "productName": "Atlas UX",
    "win": {
      "target": ["msi", "nsis"],
      "icon": "assets/icon.ico",
      "requestedExecutionLevel": "requireAdministrator"
    },
    "msi": {
      "perMachine": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "Atlas UX"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "Atlas UX",
      "runAfterFinish": true
    }
  }
}
```

#### **Build Commands:**
```powershell
# Install dependencies
npm install

# Build for Windows (MSI + EXE)
npm run build:win

# Build MSI only
npm run build:msi

# Build EXE only
npm run build:exe

# Sign the installers (requires code signing certificate)
npm run sign
```

---

### **macOS Build - Electron Forge**

#### **Package Configuration:**
```json
{
  "build": {
    "mac": {
      "target": ["dmg", "pkg"],
      "icon": "assets/icon.icns",
      "category": "public.app-category.productivity",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "entitlements.plist",
      "entitlementsInherit": "entitlements.plist"
    },
    "dmg": {
      "background": "assets/dmg-background.png",
      "icon": "assets/volume-icon.icns",
      "iconSize": 128,
      "contents": [
        { "x": 380, "y": 240, "type": "link", "path": "/Applications" },
        { "x": 122, "y": 240, "type": "file" }
      ]
    }
  }
}
```

#### **Build Commands:**
```bash
# Build for macOS (DMG + PKG)
npm run build:mac

# Build DMG only
npm run build:dmg

# Build PKG only
npm run build:pkg

# Sign and notarize (requires Apple Developer account)
npm run sign:mac
npm run notarize:mac
```

---

## 🔑 Code Signing

### **Windows Code Signing**

#### **Requirements:**
- Code signing certificate (.pfx file)
- Password for certificate

#### **Sign MSI/EXE:**
```powershell
# Using SignTool (Windows SDK)
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com /fd SHA256 AtlasUX-Setup-1.0.0.msi

# Sign EXE
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com /fd SHA256 AtlasUX-Setup-1.0.0.exe
```

---

### **macOS Code Signing & Notarization**

#### **Requirements:**
- Apple Developer account
- Developer ID Application certificate
- Developer ID Installer certificate (for PKG)

#### **Sign & Notarize:**
```bash
# Sign the app
codesign --deep --force --verify --verbose --sign "Developer ID Application: Your Name" "Atlas UX.app"

# Build DMG
npm run build:dmg

# Sign DMG
codesign --sign "Developer ID Application: Your Name" AtlasUX-1.0.0.dmg

# Notarize (requires Xcode and credentials)
xcrun notarytool submit AtlasUX-1.0.0.dmg --apple-id your@email.com --team-id TEAMID --password app-specific-password

# Staple notarization ticket
xcrun stapler staple AtlasUX-1.0.0.dmg
```

---

## 📋 Permission Details

### **Windows Permissions**

Atlas UX requests the following Windows permissions:

#### **File System Access**
- **Registry Key**: `HKEY_LOCAL_MACHINE\SOFTWARE\AtlasUX\Permissions\FileSystem`
- **Scope**: Read, Write, Execute, Delete
- **User Control**: Via first-run setup and Settings

#### **Network Access**
- **Firewall**: Automatic exception for outbound connections
- **Ports**: HTTPS (443), Custom API endpoints
- **Monitoring**: Neptune validates all network requests

#### **System Information**
- **WMI Access**: Hardware specs, OS version, disk usage
- **Privacy**: No telemetry sent without consent

#### **Background Tasks**
- **Task Scheduler**: Creates scheduled task for Pluto job runner
- **Service**: Optional Windows Service for 24/7 operation

---

### **macOS Permissions**

Atlas UX requests the following macOS permissions:

#### **Full Disk Access**
- **Required**: Yes (for file operations)
- **Location**: System Preferences → Security & Privacy → Privacy → Full Disk Access
- **Grant**: User must manually enable on first run

#### **Accessibility**
- **Required**: No (optional for advanced features)
- **Location**: System Preferences → Security & Privacy → Privacy → Accessibility

#### **Network**
- **Automatic**: macOS handles via Gatekeeper

---

## 🚀 Enterprise Deployment

### **Windows Group Policy (MSI)**

#### **Create GPO:**
1. Open Group Policy Management Console
2. Create new GPO: "Deploy Atlas UX"
3. Edit GPO → Computer Configuration → Software Settings → Software Installation
4. Right-click → New → Package
5. Browse to `AtlasUX-Setup-1.0.0.msi`
6. Select "Assigned"

#### **Configure Default Settings:**
Create `config.json` in installation directory:
```json
{
  "permissions": {
    "fileSystem": true,
    "network": true,
    "systemInfo": true,
    "backgroundTasks": true,
    "clipboard": false,
    "notifications": true,
    "runOnStartup": false
  },
  "driveAccess": {
    "C:\\": {
      "enabled": true,
      "restricted": true,
      "excludedFolders": ["Windows", "Program Files", "Program Files (x86)"]
    },
    "D:\\": {
      "enabled": true,
      "restricted": false,
      "excludedFolders": []
    }
  },
  "skipFirstRun": true
}
```

---

### **macOS MDM Deployment**

#### **Use Jamf Pro / Intune / Kandji:**

1. Upload `AtlasUX-1.0.0.pkg` to MDM
2. Create deployment policy
3. Target computers/groups
4. Deploy with pre-configured permissions

#### **Configuration Profile (PPPC):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>PayloadType</key>
            <string>com.apple.TCC.configuration-profile-policy</string>
            <key>Services</key>
            <dict>
                <key>SystemPolicyAllFiles</key>
                <array>
                    <dict>
                        <key>Identifier</key>
                        <string>com.atlasux.app</string>
                        <key>IdentifierType</key>
                        <string>bundleID</string>
                        <key>Allowed</key>
                        <true/>
                    </dict>
                </array>
            </dict>
        </dict>
    </array>
</dict>
</plist>
```

---

## 🔄 Auto-Update System

### **Built-in Update Mechanism**

Atlas UX includes automatic update checking:

- **Check Interval**: Daily (configurable)
- **Update Server**: `https://updates.atlasux.ai`
- **Download**: Background download when available
- **Installation**: User prompt or silent (configurable)
- **Rollback**: Previous version backup maintained

#### **Update Manifest:**
```json
{
  "version": "1.1.0",
  "releaseDate": "2026-03-15",
  "windows": {
    "msi": "https://cdn.atlasux.ai/v1.1.0/AtlasUX-Setup-1.1.0.msi",
    "exe": "https://cdn.atlasux.ai/v1.1.0/AtlasUX-Setup-1.1.0.exe",
    "sha256": "abc123..."
  },
  "mac": {
    "dmg": "https://cdn.atlasux.ai/v1.1.0/AtlasUX-1.1.0.dmg",
    "pkg": "https://cdn.atlasux.ai/v1.1.0/AtlasUX-1.1.0.pkg",
    "sha256": "def456..."
  },
  "releaseNotes": "https://atlasux.ai/releases/v1.1.0"
}
```

---

## 🗑️ Uninstallation

### **Windows**

#### **Via Control Panel:**
1. Settings → Apps → Installed Apps
2. Find "Atlas UX"
3. Click "Uninstall"
4. Follow prompts

#### **Via MSI:**
```powershell
# Find product code
wmic product where "Name='Atlas UX'" get IdentifyingNumber

# Uninstall silently
msiexec /x {PRODUCT-CODE} /quiet

# Complete removal with config
msiexec /x {PRODUCT-CODE} /quiet REMOVEALL=1
```

#### **Data Removal:**
- Configuration: `C:\Users\{User}\AppData\Roaming\AtlasUX`
- Logs: `C:\Users\{User}\AppData\Local\AtlasUX\logs`
- Cache: `C:\Users\{User}\AppData\Local\AtlasUX\cache`

---

### **macOS**

#### **Manual:**
1. Quit Atlas UX
2. Move "Atlas UX.app" to Trash
3. Empty Trash
4. Remove preferences: `~/Library/Application Support/AtlasUX`

#### **Complete Removal:**
```bash
# Remove app
rm -rf /Applications/Atlas\ UX.app

# Remove preferences
rm -rf ~/Library/Application\ Support/AtlasUX
rm -rf ~/Library/Caches/com.atlasux.app
rm -rf ~/Library/Preferences/com.atlasux.app.plist

# Remove logs
rm -rf ~/Library/Logs/AtlasUX
```

---

## 📊 Deployment Checklist

### **Pre-Deployment**
- [ ] Test installation on clean VM
- [ ] Verify code signing certificates
- [ ] Test first-run setup wizard
- [ ] Validate permission grants
- [ ] Test drive access restrictions
- [ ] Verify network connectivity
- [ ] Test update mechanism
- [ ] Create deployment documentation

### **Deployment**
- [ ] Upload installers to distribution server
- [ ] Configure update manifest
- [ ] Create GPO/MDM policies (enterprise)
- [ ] Notify users of installation
- [ ] Monitor installation telemetry
- [ ] Track activation rates
- [ ] Collect feedback

### **Post-Deployment**
- [ ] Monitor error logs
- [ ] Address permission issues
- [ ] Track system performance
- [ ] User training materials
- [ ] Support documentation
- [ ] Plan first update

---

## 🆘 Troubleshooting

### **Installation Fails**

**Windows:**
- Ensure you're running as Administrator
- Check .NET Runtime is installed
- Disable antivirus temporarily
- Check Windows Event Viewer logs

**macOS:**
- Check Gatekeeper settings
- Verify code signature: `codesign -dv --verbose=4 /Applications/Atlas\ UX.app`
- Review Console.app for errors

---

### **Permission Denied Errors**

**Windows:**
- Run as Administrator
- Check UAC settings
- Verify drive permissions in File Explorer
- Re-run first-time setup

**macOS:**
- Grant Full Disk Access in System Preferences
- Check Security & Privacy settings
- Reset permissions: `tccutil reset All com.atlasux.app`

---

### **Network Issues**

- Verify firewall exceptions
- Check proxy settings
- Test API connectivity: `curl https://api.openai.com`
- Review Neptune network logs

---

## 📞 Support

- 📧 Enterprise Support: enterprise@atlasux.ai
- 💬 Community Forum: community.atlasux.ai
- 📖 Documentation: docs.atlasux.ai
- 🐛 Bug Reports: github.com/atlasux/issues

---

**Atlas UX - Deploy Once, Work Forever** 🚀
