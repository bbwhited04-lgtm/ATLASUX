const { app, BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain, shell, screen } = require("electron");
const path = require("path");
const log = require("electron-log");

// Auto-updater — checks GitHub Releases for new versions
const { autoUpdater } = require("electron-updater");
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

let mainWindow;
let avatarWindow;
let tray = null;
let isQuitting = false;
let roamInterval = null;
let roamTarget = null;
let roamCurrent = null;

/* ── Main Window ── */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#020617",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    icon: path.join(__dirname, "../build/icon.png"),
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    autoUpdater.checkForUpdatesAndNotify();
  });

  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
      if (tray) showTrayNotification("Atlas UX", "Minimized to system tray");
    }
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

/* ── Avatar Overlay Window — transparent, always-on-top, roams desktop ── */
function createAvatarWindow() {
  const display = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = display.workAreaSize;

  // Start bottom-right
  const avatarW = 180;
  const avatarH = 220;
  const startX = screenW - avatarW - 40;
  const startY = screenH - avatarH - 40;

  avatarWindow = new BrowserWindow({
    width: avatarW,
    height: avatarH,
    x: startX,
    y: startY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload-avatar.js"),
    },
  });

  // Prevent clicks from passing through to desktop
  avatarWindow.setIgnoreMouseEvents(false);

  // Load the avatar HTML
  if (process.env.ELECTRON_START_URL) {
    avatarWindow.loadURL(`${process.env.ELECTRON_START_URL}#/desktop-avatar`);
  } else {
    avatarWindow.loadFile(path.join(__dirname, "avatar.html"));
  }

  // Right-click context menu on the avatar window
  avatarWindow.webContents.on("context-menu", () => {
    const menu = Menu.buildFromTemplate([
      { label: "Open Atlas UX", click: restoreFromTray },
      { label: "Quick Chat", click: () => { restoreFromTray(); mainWindow?.webContents.send("navigate-to", "/app/chat"); }},
      { type: "separator" },
      { label: roamInterval ? "Stop Roaming" : "Start Roaming", click: toggleRoam },
      { label: "Return to Corner", click: () => returnToCorner() },
      { type: "separator" },
      { label: "Hide Avatar", click: () => avatarWindow?.hide() },
      { label: "Quit Atlas", click: () => { isQuitting = true; app.quit(); }},
    ]);
    menu.popup({ window: avatarWindow });
  });

  avatarWindow.on("closed", () => { avatarWindow = null; });

  // Initialize roam position
  roamCurrent = { x: startX, y: startY };
  roamTarget = { x: startX, y: startY };

  // Start roaming after a short delay
  setTimeout(() => startRoam(), 3000);
}

/* ── Desktop Roaming Logic ── */
function startRoam() {
  if (roamInterval) return;
  pickNewTarget();

  // Move toward target every 30ms (~33fps)
  roamInterval = setInterval(() => {
    if (!avatarWindow || !roamCurrent || !roamTarget) return;

    const dx = roamTarget.x - roamCurrent.x;
    const dy = roamTarget.y - roamCurrent.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 3) {
      // Reached target — pause, then pick new one
      clearInterval(roamInterval);
      roamInterval = null;
      const pause = 4000 + Math.random() * 8000; // 4-12s pause
      setTimeout(() => {
        if (!isQuitting && avatarWindow) {
          pickNewTarget();
          startRoam();
        }
      }, pause);

      // Tell avatar to idle
      avatarWindow?.webContents.send("avatar-state", "idle");
      return;
    }

    // Move 1.5px per tick toward target (smooth glide)
    const speed = 1.5;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;
    roamCurrent.x += vx;
    roamCurrent.y += vy;

    // Tell avatar which direction we're moving (for lean)
    const direction = vx > 0.3 ? "right" : vx < -0.3 ? "left" : "forward";
    avatarWindow?.webContents.send("avatar-state", "walking");
    avatarWindow?.webContents.send("avatar-direction", direction);

    try {
      avatarWindow.setPosition(Math.round(roamCurrent.x), Math.round(roamCurrent.y));
    } catch {
      // Window might be destroyed
    }
  }, 30);
}

function pickNewTarget() {
  const display = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = display.workAreaSize;
  const margin = 60;

  // Pick random position on screen edges and open areas
  roamTarget = {
    x: margin + Math.random() * (screenW - 180 - margin * 2),
    y: margin + Math.random() * (screenH - 220 - margin * 2),
  };
}

function toggleRoam() {
  if (roamInterval) {
    clearInterval(roamInterval);
    roamInterval = null;
    avatarWindow?.webContents.send("avatar-state", "idle");
  } else {
    startRoam();
  }
}

function returnToCorner() {
  const display = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = display.workAreaSize;

  if (roamInterval) {
    clearInterval(roamInterval);
    roamInterval = null;
  }

  roamTarget = { x: screenW - 220, y: screenH - 260 };
  roamCurrent = roamTarget;
  avatarWindow?.setPosition(roamTarget.x, roamTarget.y);
  avatarWindow?.webContents.send("avatar-state", "idle");
}

/* ── System Tray ── */
function createTray() {
  const iconPath = path.join(__dirname, "../build/icon.png");
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 22, height: 22 });
    if (process.platform === "darwin") trayIcon.setTemplateImage(true);
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip("Atlas UX — Your AI Employee");

  const contextMenu = Menu.buildFromTemplate([
    { label: "Show Atlas", click: restoreFromTray },
    { label: "Quick Chat", click: () => { restoreFromTray(); mainWindow?.webContents.send("navigate-to", "/app/chat"); }},
    { type: "separator" },
    { label: "Show Avatar", click: () => avatarWindow?.show() },
    { label: "Hide Avatar", click: () => avatarWindow?.hide() },
    { type: "separator" },
    { label: "Check for Updates", click: () => autoUpdater.checkForUpdatesAndNotify() },
    { type: "separator" },
    { label: "Quit Atlas", click: () => { isQuitting = true; app.quit(); }},
  ]);
  tray.setContextMenu(contextMenu);

  tray.on("click", restoreFromTray);
  tray.on("double-click", restoreFromTray);
}

function restoreFromTray() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow();
  }
}

function showTrayNotification(title, body) {
  if (Notification.isSupported()) {
    const n = new Notification({ title, body, silent: true });
    n.on("click", restoreFromTray);
    n.show();
  }
}

/* ── Auto-Updater Events ── */
autoUpdater.on("checking-for-update", () => {
  log.info("Checking for update...");
  mainWindow?.webContents.send("updater-status", { status: "checking" });
});

autoUpdater.on("update-available", (info) => {
  log.info("Update available:", info.version);
  mainWindow?.webContents.send("updater-status", { status: "available", version: info.version });
});

autoUpdater.on("update-not-available", () => {
  log.info("No update available");
  mainWindow?.webContents.send("updater-status", { status: "up-to-date" });
});

autoUpdater.on("download-progress", (progress) => {
  mainWindow?.webContents.send("updater-status", {
    status: "downloading",
    percent: Math.round(progress.percent),
    transferred: progress.transferred,
    total: progress.total,
  });
});

autoUpdater.on("update-downloaded", (info) => {
  log.info("Update downloaded:", info.version);
  mainWindow?.webContents.send("updater-status", { status: "ready", version: info.version });
  showTrayNotification("Atlas UX Update Ready", `Version ${info.version} is ready. Restart to apply.`);
});

autoUpdater.on("error", (err) => {
  log.error("Auto-update error:", err);
  mainWindow?.webContents.send("updater-status", { status: "error", message: err?.message });
});

/* ── IPC Handlers ── */
ipcMain.handle("get-app-version", () => app.getVersion());
ipcMain.handle("check-for-updates", () => autoUpdater.checkForUpdatesAndNotify());
ipcMain.handle("install-update", () => autoUpdater.quitAndInstall());
ipcMain.handle("minimize-to-tray", () => mainWindow?.hide());
ipcMain.handle("restore-from-tray", () => restoreFromTray());
ipcMain.handle("show-notification", (_e, title, body) => showTrayNotification(title, body));
ipcMain.handle("open-external", (_e, url) => shell.openExternal(url));

// Avatar IPC
ipcMain.handle("avatar-clicked", () => {
  restoreFromTray();
  mainWindow?.webContents.send("navigate-to", "/app/chat");
});

ipcMain.handle("avatar-toggle-roam", () => toggleRoam());

/* ── App Lifecycle ── */
app.whenReady().then(() => {
  createWindow();
  createTray();
  createAvatarWindow();

  setInterval(() => autoUpdater.checkForUpdatesAndNotify(), 4 * 60 * 60 * 1000);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  else mainWindow?.show();
});

app.on("before-quit", () => {
  isQuitting = true;
  if (roamInterval) { clearInterval(roamInterval); roamInterval = null; }
  if (tray) { tray.destroy(); tray = null; }
});
