# Atlas UX -- Browser Extensions

Browser extensions for the Atlas UX AI employee productivity platform. Access your agents, jobs, chat, and notifications from Chrome, Edge, Firefox, Safari, or Opera without leaving the page you are working on.

---

## Quick Links

| Browser | Directory | README |
|---|---|---|
| Chrome | [`extensions/chrome/`](chrome/) | [Chrome README](chrome/README.md) |
| Edge | [`extensions/chrome/`](chrome/) (shared) | [Chrome README](chrome/README.md) |
| Firefox | [`extensions/firefox/`](firefox/) | [Firefox README](firefox/README.md) |
| Safari | [`extensions/safari/`](safari/) | [Safari README](safari/README.md) |
| Opera | [`extensions/opera/`](opera/) | [Opera README](opera/README.md) |

Detailed guides are available in the docs directory:
- [User Guide](../docs/guides/browser-extensions.md)
- [Developer Guide](../docs/developer/browser-extensions.md)

---

## Features

All extensions share the same feature set:

| Feature | Chrome | Edge | Firefox | Safari | Opera |
|---|---|---|---|---|---|
| Dark-themed popup | Yes | Yes | Yes | Yes | Yes |
| Agent chat (Atlas, Binky, Cheryl, Sunday) | Yes | Yes | Yes | Yes | Yes |
| Stats bar (jobs, decisions, agents) | Yes | Yes | Yes | Yes | Yes |
| Activity feed (audit log) | Yes | Yes | Yes | Yes | Yes |
| Quick actions (new job, open dashboard) | Yes | Yes | Yes | Yes | Yes |
| Context menus (Ask Atlas, Cheryl, Archy) | Yes | Yes | Yes | Yes | Yes |
| Badge (active job count) | Yes | Yes | Yes | Yes | Yes |
| Desktop notifications | Yes | Yes | Yes | Yes | Yes |
| Options/settings page | Yes | Yes | Yes | Yes | Yes |
| Content script (text selection) | Yes | Yes | Yes | Yes | Yes |

---

## Architecture

```
+------------------+  +------------------+  +------------------+  +------------------+
|  chrome/         |  |  firefox/        |  |  safari/         |  |  opera/          |
|  (Chrome & Edge) |  |  (Firefox)       |  |  (Safari/macOS)  |  |  (Opera)         |
+--------+---------+  +--------+---------+  +--------+---------+  +--------+---------+
         |                     |                      |                      |
         +---------------------+----------------------+----------------------+
                                  |
                     Shared Manifest V3 pattern
                     Same popup UI & features
                     Same API integration
                                  |
                     +------------+------------+
                     |   Atlas UX Backend API  |
                     |   /v1/* endpoints       |
                     |   Authorization + tenant|
                     +-------------------------+
```

Each browser directory contains its own manifest adapted to that browser's requirements, but the popup markup, styles, and logic are functionally equivalent. The primary differences are in the manifest (background script declaration, browser-specific settings, and icon sizes).

---

## Quick Start

### Chrome / Edge

```
# Load unpacked extension
chrome://extensions  ->  Developer mode  ->  Load unpacked  ->  extensions/chrome/
```

### Firefox

```
# Load temporary add-on
about:debugging  ->  This Firefox  ->  Load Temporary Add-on  ->  extensions/firefox/manifest.json
```

### Safari

```
# Convert and build with Xcode
xcrun safari-web-extension-converter ./extensions/safari \
  --project-location ./build/safari-ext \
  --app-name "Atlas UX" \
  --bundle-identifier cloud.atlasux.safari

# Then open the Xcode project, build (Cmd+R), and enable in Safari Settings > Extensions
```

### Opera

```
# Load unpacked extension
opera://extensions  ->  Developer mode  ->  Load unpacked  ->  extensions/opera/
```

---

## API

All extensions connect to the same backend:

- **Production**: `https://atlas-ux.onrender.com/v1`
- **Local dev**: `http://localhost:8787/v1`

Authentication requires a JWT bearer token in the `Authorization` header and a tenant UUID in the `x-tenant-id` header. Both values are configured in the extension's login form on first use.
