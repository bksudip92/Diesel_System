# Architecture

This document describes the mobile app's architecture after the frontend
rework (branch `refactor/frontend-architecture`). The backend is unchanged.

## Folder layout

```
src/
├── app/                  # Route shells ONLY (expo-router file tree)
│   ├── _layout.tsx       #   Root: AppProviders + AuthGate + Stack config
│   ├── (auth)/login.tsx  #   Sign-in (group renders when unauthenticated)
│   ├── (tabs)/           #   Tab group: Dashboard, Create, Reports
│   ├── scanner/          #   QR scanner modal
│   ├── fuel/[vehicle]/   #   Fill-fuel form (dynamic route)
│   ├── qr/[vehicle]/     #   QR display / save / share
│   ├── vehicles/         #   index (list) + edit
│   └── reports/months/   #   Monthly report list + [name] detail
│
├── features/             # Business logic, grouped by domain
│   ├── auth/             #   api.ts (login/logout/profile)
│   ├── vehicles/         #   api.ts, queries.ts, qr.ts, components/
│   ├── fuel-logs/        #   api.ts, queries.ts, utils.ts, components/
│   └── reports/          #   api.ts, queries.ts, utils.ts
│
├── components/ui/        # Reusable design-system primitives
├── providers/            # AppProviders (composition root), AuthProvider, ErrorBoundary
├── lib/                  # Framework-agnostic infrastructure
├── theme/                # Design tokens (colors, spacing, typography, radius, shadow)
├── types/                # Domain models + API DTOs
└── navigation/           # Routes map (all navigation targets in one place)
```

## Layering rules

1. **`app/` screens** render UI and call hooks. No `fetch`, no business math,
   no `AsyncStorage`.
2. **`features/*/queries.ts`** own all TanStack Query usage. Screens never
   call `queryClient` directly.
3. **`features/*/api.ts`** own endpoint knowledge and go through
   `lib/api-client.ts`. They never import from `app/` or React Native.
4. **`lib/`** never imports from `features/` or `app/`.
5. **Styling** comes from `theme/tokens.ts`. Hardcoded hex values in screens
   are not allowed.

## Data flow

```
Screen ──useXxxQuery/useXxxMutation──▶ features/*/queries.ts
         ──queryFn/mutationFn──▶ features/*/api.ts
         ──apiFetch──▶ lib/api-client.ts ──▶ REST API
```

- `api-client.ts` attaches the bearer token from **encrypted storage**
  (`expo-secure-store`), and transparently refreshes + retries once on 401.
- Query keys are declared per feature (`vehicleKeys`, `fuelLogKeys`,
  `reportKeys`); mutations invalidate their related keys so every open list
  refreshes without manual `useFocusEffect` refetches.
- `refetchOnWindowFocus` is wired to RN `AppState` in `AppProviders.tsx`.

## Authentication

`providers/AuthProvider.tsx` exposes:

```ts
{ status: 'loading' | 'authenticated' | 'guest', profile, signIn, signOut }
```

- Session bootstrap: cached profile → immediate render → silent refresh-token
  validation in the background → profile revalidation.
- The root layout gates the entire navigator on `status !== 'loading'`.
- **Do not** read the profile from AsyncStorage directly; that path caused a
  key-mismatch bug (`'@user_profile'` vs `'user_profile'`) that silently
  submitted fuel logs with an empty place.

## Environment

`EXPO_PUBLIC_API_URL` is validated with zod in `lib/env.ts` at startup —
a missing/invalid value crashes with an actionable message instead of
silently pointing at the Android emulator host. See `.env.example`.

## Conventions

- Absolute imports via `@/*`.
- Route names are centralized in `navigation/routes.ts` (`Routes.fillFuel(n)`).
- New screens are thin shells: params parsing + feature composition only.
- Typed routes: `npx expo start` regenerates `.expo/types/router.d.ts`
  (gitignored); `npx expo customize tsconfig.json` keeps the include up to date.
- Formatting: Prettier (`.prettierrc`), scripts `npm run format` / `npm run ci:check`.

## Build

- Development: `npm run android` (uses `.env` API URL).
- Production APK: `eas build -p android --profile preview` (buildType `apk`).

## Known deferred items

- `app/yearly-report.tsx` is a stub — the yearly report screen had no
  working implementation previously; needs a spec.
- `src/app/type_vehcileNumber` flow was superseded by direct number entry;
  delete the stub once confirmed unused.
- QR download still uses `expo-file-system/legacy` (supported on SDK 54);
  migrate to the new `File` API when its download surface is stable.
