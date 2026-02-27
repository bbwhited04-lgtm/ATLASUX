/**
 * Electron Main Process for Atlas System Tray Integration
 */

import { app, BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain } from 'electron';
import * as path from 'path';

class AtlasSystemTray {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;
  private trayWindow: BrowserWindow | null = null;
  private isMinimizedToTray = false;
  private isQuitting = false;

  constructor() {
    this.initializeApp();
  }

  private initializeApp() {
    // Handle app ready
    app.whenReady().then(() => {
      this.createMainWindow();
      this.createSystemTray();
      this.setupEventHandlers();
    });

    // Handle window closed
    app.on('window-all-closed', () => {
      // Don't quit on macOS when all windows are closed
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // Handle app activation (macOS)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    // Handle before quit
    app.on('before-quit', () => {
      this.isQuitting = true;
      this.cleanup();
    });
  }

  private createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      icon: path.join(__dirname, '../assets/atlas-icon.png'),
      show: false, // Don't show initially
      titleBarStyle: 'hiddenInset', // macOS style title bar
    });

    // Load the app
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Handle window state
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('minimize', (event: Electron.Event) => {
      if (this.isMinimizedToTray) {
        event.preventDefault();
        this.mainWindow?.hide();
        this.showTrayNotification('Atlas', 'Atlas minimized to system tray');
      }
    });

    this.mainWindow.on('close', (event: Electron.Event) => {
      if (!this.isQuitting && this.isMinimizedToTray) {
        event.preventDefault();
        this.mainWindow?.hide();
        this.showTrayNotification('Atlas', 'Atlas minimized to system tray');
      }
    });

    // Setup IPC handlers
    this.setupIpcHandlers();
  }

  private createSystemTray() {
    // Create tray icon
    const iconPath = path.join(__dirname, '../assets/atlas-tray-icon.png');
    const trayIcon = nativeImage.createFromPath(iconPath);
    
    // Resize icon for high DPI displays
    trayIcon.setTemplateImage(true);

    this.tray = new Tray(trayIcon);
    this.tray.setToolTip('Atlas - Your AI Assistant');

    // Create tray context menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Atlas',
        click: () => {
          this.restoreFromTray();
        },
      },
      {
        label: 'Quick Chat',
        click: () => {
          this.showQuickChat();
        },
      },
      { type: 'separator' },
      {
        label: 'Voice Enabled',
        type: 'checkbox',
        checked: true,
        click: (menuItem) => {
          this.mainWindow?.webContents.send('voice-toggled', menuItem.checked);
        },
      },
      {
        label: 'Notifications',
        type: 'checkbox',
        checked: true,
        click: (menuItem) => {
          this.mainWindow?.webContents.send('notifications-toggled', menuItem.checked);
        },
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => {
          this.restoreFromTray();
          this.mainWindow?.webContents.send('navigate-to', '/settings');
        },
      },
      { type: 'separator' },
      {
        label: 'Minimize to Tray',
        type: 'checkbox',
        checked: true,
        click: (menuItem) => {
          this.isMinimizedToTray = menuItem.checked;
        },
      },
      {
        label: 'Quit Atlas',
        click: () => {
          this.isQuitting = true;
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);

    // Handle tray clicks
    this.tray.on('click', () => {
      this.mainWindow?.webContents.send('tray-click');
    });

    this.tray.on('double-click', () => {
      this.mainWindow?.webContents.send('tray-double-click');
      this.restoreFromTray();
    });

    this.tray.on('right-click', () => {
      this.mainWindow?.webContents.send('tray-right-click');
    });
  }

  private showQuickChat() {
    if (this.trayWindow) {
      this.trayWindow.show();
      this.trayWindow.focus();
      return;
    }

    this.trayWindow = new BrowserWindow({
      width: 320,
      height: 480,
      resizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      frame: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    // Load quick chat interface
    if (process.env.NODE_ENV === 'development') {
      this.trayWindow.loadURL('http://localhost:5173?tray=true');
    } else {
      this.trayWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
        query: { tray: 'true' },
      });
    }

    this.trayWindow.on('blur', () => {
      // Hide window when it loses focus
      setTimeout(() => {
        if (this.trayWindow && !this.trayWindow.isFocused()) {
          this.trayWindow.hide();
        }
      }, 200);
    });

    this.trayWindow.on('closed', () => {
      this.trayWindow = null;
    });
  }

  private restoreFromTray() {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
      if (this.trayWindow) {
        this.trayWindow.hide();
      }
    }
  }

  private minimizeToTray() {
    if (this.mainWindow) {
      this.mainWindow.hide();
      this.showTrayNotification('Atlas', 'Atlas minimized to system tray');
    }
  }

  private showTrayNotification(title: string, body: string) {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title,
        body,
        icon: path.join(__dirname, '../assets/atlas-notification-icon.png'),
        silent: false,
        urgency: 'normal',
      });

      notification.on('click', () => {
        this.restoreFromTray();
      });

      notification.show();
    }
  }

  private setupEventHandlers() {
    // Handle global shortcuts
    app.on('browser-window-focus', () => {
      // Update tray status when window gets focus
      this.updateTrayStatus('online');
    });

    app.on('browser-window-blur', () => {
      // Update tray status when window loses focus
      setTimeout(() => {
        if (!this.mainWindow?.isFocused()) {
          this.updateTrayStatus('away');
        }
      }, 30000); // 30 seconds
    });

    // Setup IPC handlers
    ipcMain.handle('minimize-to-tray', () => {
      this.minimizeToTray();
    });

    ipcMain.handle('restore-from-tray', () => {
      this.restoreFromTray();
    });

    ipcMain.handle('show-tray-notification', (event, title: string, body: string) => {
      this.showTrayNotification(title, body);
    });
  }

  private setupIpcHandlers() {
    // Handle tray API calls from renderer
    if (this.mainWindow) {
      this.mainWindow.webContents.on('did-finish-load', () => {
        // Expose tray API to renderer process
        this.mainWindow?.webContents.executeJavaScript(`
          window.electronAPI = {
            onTrayClick: (callback) => {
              window.addEventListener('tray-click', callback);
            },
            onTrayDoubleClick: (callback) => {
              window.addEventListener('tray-double-click', callback);
            },
            onTrayRightClick: (callback) => {
              window.addEventListener('tray-right-click', callback);
            },
            minimizeToTray: () => {
              window.postMessage({ type: 'minimize-to-tray' }, '*');
            },
            restoreFromTray: () => {
              window.postMessage({ type: 'restore-from-tray' }, '*');
            },
            setTrayIcon: (icon) => {
              window.postMessage({ type: 'set-tray-icon', icon }, '*');
            },
            setTrayTooltip: (tooltip) => {
              window.postMessage({ type: 'set-tray-tooltip', tooltip }, '*');
            },
            showTrayNotification: (title, body) => {
              window.postMessage({ type: 'show-tray-notification', title, body }, '*');
            },
            hideTray: () => {
              window.postMessage({ type: 'hide-tray' }, '*');
            },
            showTray: () => {
              window.postMessage({ type: 'show-tray' }, '*');
            }
          };
        `);
      });
    }
  }

  private updateTrayStatus(status: 'online' | 'busy' | 'away' | 'offline') {
    if (this.tray) {
      const statusIcons = {
        online: 'atlas-tray-online.png',
        busy: 'atlas-tray-busy.png',
        away: 'atlas-tray-away.png',
        offline: 'atlas-tray-offline.png',
      };

      const iconPath = path.join(__dirname, `../assets/${statusIcons[status]}`);
      const trayIcon = nativeImage.createFromPath(iconPath);
      trayIcon.setTemplateImage(true);
      
      this.tray.setImage(trayIcon);
      this.tray.setToolTip(`Atlas - ${status.charAt(0).toUpperCase() + status.slice(1)}`);
    }
  }

  private cleanup() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
    if (this.trayWindow) {
      this.trayWindow.close();
      this.trayWindow = null;
    }
  }
}

// Initialize the system tray application
new AtlasSystemTray();
