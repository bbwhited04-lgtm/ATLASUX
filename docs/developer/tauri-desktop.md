# Tauri Desktop App

Atlas UX ships a Tauri 2 desktop app alongside the web version. Tauri bundles the Vite frontend into a native window using platform-specific webview runtimes (WebKit on macOS/Linux, WebView2 on Windows).

## Prerequisites

- **Rust toolchain** — Install via [rustup.rs](https://rustup.rs)
- **Node.js 20+** — For the frontend build
- **Platform dependencies:**
  - **Linux:** `libwebkit2gtk-4.1-0`, `libgtk-3-0`
  - **macOS:** Xcode Command Line Tools, minimum macOS 10.15
  - **Windows:** WebView2 runtime (usually pre-installed on Windows 10+)

## Project Structure

```
src-tauri/
  tauri.conf.json    # App configuration (identifier, window, bundle settings)
  Cargo.toml         # Rust dependencies
  Cargo.lock         # Rust dependency lock
  build.rs           # Build script
  src/               # Rust source (main process)
  capabilities/      # Tauri capability declarations
  icons/             # App icons (PNG, ICO, ICNS)
  gen/               # Generated Rust bindings
  target/            # Rust build output (git-ignored)
```

## Configuration — `tauri.conf.json`

```json
{
  "productName": "Atlas UX",
  "version": "1.0.0",
  "identifier": "cloud.atlasux.desktop",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [{
      "title": "Atlas UX — AI Employee Platform",
      "width": 1280,
      "height": 860,
      "minWidth": 900,
      "minHeight": 600,
      "center": true
    }]
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "category": "Productivity",
    "shortDescription": "AI Employee Platform"
  }
}
```

## Development

Run the Tauri dev server (auto-starts Vite and opens a native window):

```bash
npm run tauri:dev
```

This runs `beforeDevCommand` (`npm run dev`) to start Vite, then opens the Tauri window pointing at `http://localhost:5173`.

## Building

Build the production desktop app:

```bash
npm run tauri:build
```

This runs `beforeBuildCommand` (`npm run build`) to produce the Vite `dist/`, then compiles the Rust binary and bundles it with the webview.

## Platform-Specific Builds

The bundle config in `tauri.conf.json` targets all platforms:

### Linux
- **DEB:** Debian package (`libwebkit2gtk-4.1-0`, `libgtk-3-0` as dependencies)
- **AppImage:** Portable format with bundled media framework

### macOS
- **DMG:** Standard macOS disk image
- Minimum system version: macOS 10.15 (Catalina)
- Icons: `icon.icns`

### Windows
- **NSIS:** Installer with optional per-user or per-machine install mode
- **WiX:** Alternative MSI installer
- Icons: `icon.ico`
- Language: English

## Frontend Integration

The Tauri app uses the `@tauri-apps/api` package (listed in root `package.json`) for Rust-to-JS communication. The frontend code can detect the Tauri runtime and use native features when available.

## Icons

Icon files are stored in `src-tauri/icons/`:
- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)

## Tauri CLI

The Tauri CLI is available as a dev dependency:

```bash
npx tauri info      # System info and dependency check
npx tauri icon      # Generate icons from a source image
npx tauri dev       # Start dev mode
npx tauri build     # Production build
```
