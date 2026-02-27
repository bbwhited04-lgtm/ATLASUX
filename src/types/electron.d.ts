/**
 * Electron API type declarations for system tray integration
 */

declare global {
  interface Window {
    electronAPI?: {
      onTrayClick: (callback: () => void) => void;
      onTrayDoubleClick: (callback: () => void) => void;
      onTrayRightClick: (callback: () => void) => void;
      minimizeToTray: () => void;
      restoreFromTray: () => void;
      setTrayIcon: (icon: string) => void;
      setTrayTooltip: (tooltip: string) => void;
      showTrayNotification: (title: string, body: string) => void;
      hideTray: () => void;
      showTray: () => void;
    };
  }
}

export {};
