> ⚠️ **ARCHIVED (Sept 2026):** Task list for the original build, kept for
> history. Current architecture documentation lives in
> [ARCHITECTURE.md](./ARCHITECTURE.md).


# Refactoring Tasks

## Phase 1: Dead Code Cleanup
- [x] Delete `lib/AuthContext.ts`
- [x] Delete `components/FuelHistory.tsx`
- [x] Delete `components/LIstMenu2.tsx`
- [x] Delete `components/ListMenu.tsx`
- [x] Delete `components/DropDown.tsx`
- [x] Delete `hooks/usePlace.tsx`
- [x] Delete `hooks/useAuth.ts`
- [x] Delete `types/qr-scanner.d.ts`
- [x] Remove empty directories
- [x] Git commit

## Phase 2: Centralize Types
- [x] Create `types/database.ts` with all shared interfaces
- [x] Remove inline interfaces from all screen files
- [x] Git commit

## Phase 3: Data Layer (Services)
- [x] Create `services/vehicles.ts` (getAllVehicles, getVehicleByNumber, createVehicle, updateVehicleByNumber)
- [x] Create `services/fuel-logs.ts` (getRecentLogs, getLastFuelLog, createFuelLog, getLogsByDateRange)
- [x] Create `services/reports.ts` (getMonthlyReports, getMonthlyReportByName, refreshMonthlyReport)
- [x] Refactor `(tabs)/index.tsx` — use getRecentLogs
- [x] Refactor `all-vehicles.tsx` — use getAllVehicles
- [x] Refactor `fill-fuel.tsx` — use getLastFuelLog, getVehicleByNumber, createFuelLog
- [x] Refactor `edit-vehicle.tsx` — use updateVehicleByNumber
- [x] Refactor `month.tsx` — use getMonthlyReports, refreshMonthlyReport
- [x] Refactor `month_name.tsx` — use getMonthlyReportByName, getLogsByDateRange
- [x] Refactor `(tabs)/new-vehicle.tsx` — use createVehicle
- [x] Remove `console.log` statements from all screens
- [x] Git commit

## Phase 4: Folder Restructure (Skipping — high risk, separate PR)

## Phase 5: Performance Fixes
- [x] Fix QR scanner double-navigation (onBarcodeScanned only fires when !scanned)
- [x] Fix `useRouter()` outside component in `all-vehicles.tsx`
- [x] Fix hardcoded `marginTop: 420` in reports
- [x] Fix stale `useFocusEffect` dependency in dashboard (now depends on profile?.place)
- [x] Fix race condition in `month_name.tsx` (sequential async chain, not closure vars)
- [x] Memoize calculations in `fill-fuel.tsx` (useMemo for distance + efficiency)
- [x] Fix fake setTimeout in `edit-vehicle.tsx`
- [x] Git commit

## Phase 6: Design System
- [x] Create `constants/colors.ts`
- [x] Create `constants/spacing.ts`
- [x] Apply design tokens to all screens
- [x] Git commit

## Phase 7: UX Improvements
- [x] Confirmation before fuel log submit (fill-fuel.tsx)
- [x] Empty states for lists (dashboard, all-vehicles, month, month_name)
- [x] Pull-to-refresh on Dashboard & All Vehicles
- [x] Loading states for all screens
- [x] Keyboard dismiss on tap outside
- [x] Git commit

---

## Completed in the 2026 architecture refactor (`refactor/frontend-architecture`)

The items above were finished — and the whole structure replaced — by the
full architecture upgrade. Key commits:

| Commit | Scope |
| --- | --- |
| `4d0de1a` | Foundation: env validation, API client, secure storage, tokens, types |
| `9b4d786` | UI kit (Screen, AppButton, TextField, Card, states) |
| `ab6602b` | All screens migrated to `src/` feature architecture (TanStack Query) |
| `4e6e38d` | Legacy deletion, providers, ARCHITECTURE.md, tooling |
| (deps) | Full dependency alignment via `expo install --fix` |

Current status: typecheck ✅ · lint ✅ · export bundle ✅ — see ARCHITECTURE.md.

