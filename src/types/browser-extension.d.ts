/**
 * Browser Extension API Type Declarations
 */

declare global {
  interface Window {
    chrome?: {
      runtime: {
        onMessage: {
          addListener(callback: (message: any, sender: any, sendResponse: any) => void | boolean): void;
          removeListener(callback: (message: any, sender: any, sendResponse: any) => void): void;
        };
        sendMessage: (extensionId: string, message: any, callback?: (response: any) => void) => void;
        getURL: (path: string) => string;
        id: string;
      };
      tabs: {
        query: (queryInfo: any, callback?: (tabs: any[]) => void) => void;
        onUpdated: {
          addListener(callback: (tabId: any, changeInfo: any, tab: any) => void): void;
          removeListener(callback: (tabId: any, changeInfo: any, tab: any) => void): void;
        };
      };
      storage: {
        local: {
          get: (keys?: string | string[] | null, callback?: (items: { [key: string]: any }) => void) => void;
          set: (items: { [key: string]: any }, callback?: () => void) => void;
          remove: (keys: string | string[], callback?: () => void) => void;
        };
      };
      notifications: {
        create: (options: any, callback?: (notificationId: string) => void) => void;
        clear: (notificationId: string, callback?: (wasCleared: boolean) => void) => void;
      };
    };
    browser?: {
      runtime: {
        onMessage: {
          addListener(callback: (message: any, sender: any, sendResponse: any) => void | boolean): void;
          removeListener(callback: (message: any, sender: any, sendResponse: any) => void): void;
        };
        sendMessage: (extensionId: string, message: any, callback?: (response: any) => void) => void;
        getURL: (path: string) => string;
        id: string;
      };
      tabs: {
        query: (queryInfo: any, callback?: (tabs: any[]) => void) => void;
        onUpdated: {
          addListener(callback: (tabId: any, changeInfo: any, tab: any) => void): void;
          removeListener(callback: (tabId: any, changeInfo: any, tab: any) => void): void;
        };
      };
      storage: {
        local: {
          get: (keys?: string | string[] | null, callback?: (items: { [key: string]: any }) => void) => void;
          set: (items: { [key: string]: any }, callback?: () => void) => void;
          remove: (keys: string | string[], callback?: () => void) => void;
        };
      };
      notifications: {
        create: (options: any, callback?: (notificationId: string) => void) => void;
        clear: (notificationId: string, callback?: (wasCleared: boolean) => void) => void;
      };
    };
  }
}

export {};
