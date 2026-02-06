const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  
  // Neptune Control System
  requestFileAccess: (filePath) => ipcRenderer.invoke('request-file-access', filePath),
  requestAPIAccess: (apiName) => ipcRenderer.invoke('request-api-access', apiName),
  
  // File system
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  
  // System info for GPU/CPU monitoring
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // Platform detection
  platform: process.platform,
  isElectron: true
});
