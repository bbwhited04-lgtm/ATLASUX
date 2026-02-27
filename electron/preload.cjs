const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Platform info
  platform: process.platform,

  // App version
  getVersion: () => ipcRenderer.invoke("get-app-version"),

  // Auto-updater
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  installUpdate: () => ipcRenderer.invoke("install-update"),
  onUpdaterStatus: (callback) => {
    ipcRenderer.on("updater-status", (_e, data) => callback(data));
  },

  // System tray
  minimizeToTray: () => ipcRenderer.invoke("minimize-to-tray"),
  restoreFromTray: () => ipcRenderer.invoke("restore-from-tray"),
  showNotification: (title, body) => ipcRenderer.invoke("show-notification", title, body),

  // Navigation (from tray menu → renderer)
  onNavigateTo: (callback) => {
    ipcRenderer.on("navigate-to", (_e, path) => callback(path));
  },

  // External links
  openExternal: (url) => ipcRenderer.invoke("open-external", url),

  // Cleanup
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
