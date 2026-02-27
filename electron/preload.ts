/**
 * Electron Preload Script for Atlas System Tray Integration
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Tray event listeners
  onTrayClick: (callback: () => void) => {
    ipcRenderer.on('tray-click', callback);
  },
  
  onTrayDoubleClick: (callback: () => void) => {
    ipcRenderer.on('tray-double-click', callback);
  },
  
  onTrayRightClick: (callback: () => void) => {
    ipcRenderer.on('tray-right-click', callback);
  },
  
  // Tray controls
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  restoreFromTray: () => ipcRenderer.invoke('restore-from-tray'),
  showTrayNotification: (title: string, body: string) => 
    ipcRenderer.invoke('show-tray-notification', title, body),
  
  // Voice and notification toggles
  onVoiceToggled: (callback: (enabled: boolean) => void) => {
    ipcRenderer.on('voice-toggled', (_, enabled) => callback(enabled));
  },
  
  onNotificationsToggled: (callback: (enabled: boolean) => void) => {
    ipcRenderer.on('notifications-toggled', (_, enabled) => callback(enabled));
  },
  
  // Navigation
  onNavigateTo: (callback: (path: string) => void) => {
    ipcRenderer.on('navigate-to', (_, path) => callback(path));
  },
  
  // Remove all listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// Handle window messages from renderer
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  
  const { type, ...data } = event.data;
  
  switch (type) {
    case 'minimize-to-tray':
      ipcRenderer.invoke('minimize-to-tray');
      break;
    case 'restore-from-tray':
      ipcRenderer.invoke('restore-from-tray');
      break;
    case 'show-tray-notification':
      ipcRenderer.invoke('show-tray-notification', data.title, data.body);
      break;
  }
});

// Check if we're in tray mode
const urlParams = new URLSearchParams(window.location.search);
const isTrayMode = urlParams.get('tray') === 'true';

if (isTrayMode) {
  // Add tray-specific styles and behaviors
  document.body.classList.add('tray-mode');
  
  // Auto-hide when clicking outside
  document.addEventListener('click', (event) => {
    if (event.target === document.documentElement) {
      setTimeout(() => {
        (window as any).electronAPI?.minimizeToTray();
      }, 200);
    }
  });
  
  // Handle escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      (window as any).electronAPI?.minimizeToTray();
    }
  });
}
