# Diesel System — Mobile App

React Native (Expo SDK 54) frontend for the Diesel System: vehicle
registration, QR-scanned fuel logging, and monthly reporting.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full architecture and
conventions.

## Setup

```bash
npm install
cp .env.example .env   # then set EXPO_PUBLIC_API_URL
npm start
```

- Android emulator API URL: `http://10.0.2.2:3000/api/v1`
- Physical device: use your machine's LAN IP

## Scripts

| Script | Purpose |
| --- | --- |
| `npm start` | Expo dev server |
| `npm run android` / `ios` | Run on a platform |
| `npm run lint` | ESLint (expo config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier over `src/` |
| `npm run ci:check` | typecheck + format:check (CI gate) |

## Building an APK

The `preview` profile in `eas.json` produces an installable APK:

```bash
npm install -g eas-cli
eas build -p android --profile preview
```

For a fully local build (requires JDK 17 + Android SDK):

```bash
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
# output: android/app/build/outputs/apk/release/app-release.apk
```

## Project structure

```
src/
├── app/          # expo-router route shells (UI only)
├── features/     # domain logic: auth, vehicles, fuel-logs, reports
├── components/ui # design-system primitives
├── providers/    # AppProviders, AuthProvider, ErrorBoundary
├── lib/          # api client, env, storage, formatting, errors
├── theme/        # design tokens
└── types/        # domain + API types
```
