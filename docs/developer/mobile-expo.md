# Mobile App (Expo)

Atlas UX includes a React Native mobile app built with Expo. The app lives in the `mobile/` directory and uses Expo Router for file-based navigation.

## Prerequisites

- **Node.js 20+**
- **Expo CLI** (`npx expo`)
- **iOS:** Xcode (macOS only) or Expo Go on a physical device
- **Android:** Android Studio or Expo Go on a physical device

## Project Structure

```
mobile/
  app.json           # Expo config (name, slug, icons, splash)
  App.tsx             # Root component
  index.ts            # Entry point
  tsconfig.json       # TypeScript config
  package.json        # Dependencies
  app/                # Expo Router file-based routes
    _layout.tsx       # Root layout (providers, navigation structure)
    index.tsx         # Home screen
    (tabs)/           # Tab navigator group
  components/         # Shared React Native components
  lib/
    api.ts            # API client (connects to backend)
    theme.ts          # Dark theme color constants
  assets/
    icon.png          # App icon
    splash-icon.png   # Splash screen image
    favicon.png       # Web favicon
    android-icon-foreground.png
    android-icon-background.png
    android-icon-monochrome.png
```

## Expo Configuration — `app.json`

```json
{
  "expo": {
    "name": "Atlas UX",
    "slug": "atlasux-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "scheme": "atlasux",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "cloud.atlasux.mobile"
    },
    "android": {
      "package": "cloud.atlasux.mobile"
    },
    "plugins": ["expo-router", "expo-secure-store"]
  }
}
```

Key settings:
- **Dark mode by default** (`userInterfaceStyle: "dark"`)
- **Deep linking** via the `atlasux` URL scheme
- **Bundle IDs:** `cloud.atlasux.mobile` for both iOS and Android
- **Plugins:** `expo-router` for file-based routing, `expo-secure-store` for secure token storage

## Running Locally

### Install Dependencies

```bash
cd mobile
npm install
```

### Start the Dev Server

```bash
npx expo start
```

This opens the Expo dev tools. From there:
- **iOS Simulator:** Press `i` (macOS with Xcode only)
- **Android Emulator:** Press `a` (requires Android Studio)
- **Physical device:** Scan the QR code with Expo Go app

### Run on Specific Platform

```bash
npx expo start --ios       # iOS only
npx expo start --android   # Android only
npx expo start --web       # Web browser (Metro bundler)
```

## API Connection

The mobile app connects to the same backend API as the web app. The API client is in `mobile/lib/api.ts`. Set the backend URL to your development machine's local network IP (not `localhost`) when testing on a physical device.

## Theme

The app uses a consistent dark theme defined in `mobile/lib/theme.ts`, matching the web app's color palette (`bg-slate-900`, cyan accents).

## Mobile Pairing (Backend)

The backend has a mobile pairing system at `/v1/mobile` (defined in `backend/src/routes/mobileRoutes.ts`):
- In-memory pairing store with 10-minute TTL
- 4 endpoints for QR-based device pairing
- The web app's `MobileIntegration.tsx` generates QR codes using `qrcode.react`

The native mobile app is not yet published to app stores (pending Apple developer approval).

## Building for Distribution

### iOS

```bash
npx expo build:ios         # Classic build (Expo servers)
eas build --platform ios   # EAS Build (recommended)
```

Requires an Apple Developer account and valid provisioning profile.

### Android

```bash
npx expo build:android       # Classic build (APK/AAB)
eas build --platform android # EAS Build (recommended)
```

### Over-the-Air Updates

Expo supports OTA updates for JavaScript changes without resubmitting to app stores:

```bash
eas update --branch production
```

## Splash Screen

- Background color: `#0f172a` (matches slate-900)
- Resize mode: `contain`
- Image: `assets/splash-icon.png`
