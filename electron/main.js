const { app, BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain, shell } = require("electron");
const path = require("path");
const log = require("electron-log");

// Auto-updater — checks GitHub Releases for new versions
const { autoUpdater } = require("electron-updater");
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

let mainWindow;
let tray = null;
let isQuitting = false;

/* ── Window ── */
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

  // Load from dev server or built files
  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    // Check for updates after window is ready (silent first check)
    autoUpdater.checkForUpdatesAndNotify();
  });

  // Minimize-to-tray behavior (macOS keeps app alive, others close)
  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
      if (tray) showTrayNotification("Atlas UX", "Minimized to system tray");
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/* ── System Tray ── */
function createTray() {
  const iconPath = path.join(__dirname, "../build/icon.png");
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 22, height: 22 });
    if (process.platform === "darwin") trayIcon.setTemplateImage(true);
  } catch {
    // Fallback — tray without icon
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip("Atlas UX — Your AI Employee");

  const contextMenu = Menu.buildFromTemplate([
    { label: "Show Atlas", click: restoreFromTray },
    { label: "Quick Chat", click: () => { restoreFromTray(); mainWindow?.webContents.send("navigate-to", "/app/chat"); }},
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

/* ── App Lifecycle ── */
app.whenReady().then(() => {
  createWindow();
  createTray();

  // Periodic update check (every 4 hours)
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
  if (tray) { tray.destroy(); tray = null; }
});
