# Desktop App

Atlas UX is available as a native desktop application built with Tauri. It runs on Windows, macOS, and Linux, providing the full Atlas UX experience without requiring a browser.

## Download

Available formats by platform:

| Platform | Formats                      |
|----------|------------------------------|
| Windows  | `.exe` (installer), `.msi`   |
| macOS    | `.dmg`                       |
| Linux    | `.deb`, `.rpm`, `.AppImage`  |

Downloads are available from the Atlas UX website or the `/store` page.

## Features

The desktop app provides the same functionality as the web app:

- Full dashboard with agent activity overview
- Chat interface with all AI agents
- Business Manager with asset management
- Blog Manager for content creation
- Messaging Hub (Telegram, Email, Teams)
- Agent Watcher for live monitoring
- Decision memo approval workflow
- File management and uploads
- Settings and integration management

## Advantages Over the Browser

- **System tray**: Atlas UX sits in your system tray for quick access.
- **Native notifications**: Desktop push notifications for agent alerts and approval requests.
- **Dedicated window**: No tab clutter -- Atlas UX gets its own window.
- **Auto-updates**: The app checks for updates and installs them automatically.
- **Offline indicator**: Clear visual when the connection to the backend is lost.

## Architecture

The desktop app is built with:

- **Tauri** (Rust-based framework) for the native shell
- **React 18 + Vite** for the frontend (same codebase as the web app)
- **TypeScript** throughout

The Tauri shell wraps the same SPA that runs in the browser. The `electron/` directory in the repository contains the main process and preload scripts (legacy Electron support). The current production build uses Tauri.

## Building from Source

```bash
# Install dependencies
npm install

# Development mode (opens a native window with hot reload)
npm run electron:dev

# Production build
npm run electron:build
```

The production build outputs platform-specific binaries to the `release/` directory.

## Configuration

The desktop app connects to the same backend as the web app. The API URL defaults to the production backend but can be overridden:

```env
VITE_API_BASE_URL=https://api.atlasux.cloud
```

For local development, point it to your local backend:

```env
VITE_API_BASE_URL=http://localhost:8787
```

## System Requirements

| Platform | Minimum Version           |
|----------|---------------------------|
| Windows  | Windows 10 (64-bit)       |
| macOS    | macOS 10.15 (Catalina)    |
| Linux    | Ubuntu 20.04 / Fedora 34  |

## Known Issues

- macOS builds may require granting permission in System Preferences > Security on first launch.
- Linux AppImage requires `libfuse2` on some distributions.
- Auto-update is currently Windows and macOS only.

## Uninstalling

- **Windows**: Use Add/Remove Programs or run the uninstaller.
- **macOS**: Drag Atlas UX from Applications to Trash.
- **Linux (.deb)**: `sudo apt remove atlasux`
- **Linux (.rpm)**: `sudo dnf remove atlasux`
- **Linux (AppImage)**: Delete the AppImage file.
