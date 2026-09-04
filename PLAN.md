> ⚠️ **ARCHIVED (Sept 2026):** This was the *pre-refactor* audit/plan. The
> refactor it proposed is complete on branch `refactor/frontend-architecture`
> — see [ARCHITECTURE.md](./ARCHITECTURE.md) for the implemented architecture.


# Full Codebase Refactoring & Optimization Plan

A senior-level audit of the Diesel System app. This plan covers **dead code removal**, **folder restructuring**, **type safety**, **data layer separation**, **design system**, **performance fixes**, and **UX improvements** — modeled after how production React Native projects are structured.

---

## User Review Required

> [!IMPORTANT]
> This is a large refactoring. I'll execute it in phases so the app stays working at each step. Each phase builds on the previous one.

> [!WARNING]  
> **Phase 1 (Dead Code Cleanup)** will delete several fully-commented-out files. These files have no working code and just add confusion. Please confirm you don't need them.

## Open Questions

> [!IMPORTANT]
> 1. **The `lib/AuthContext.ts` file** is 100% commented out — the working version is in `context/AuthProvider.tsx`. Can I delete it?
> 2. **`components/FuelHistory.tsx`** and **`components/LIstMenu2.tsx`** are entirely commented out. Can I delete both?
> 3. **`components/ListMenu.tsx`** and **`components/DropDown.tsx`** are unused (not imported anywhere). Delete or keep?
> 4. **Empty directories** (`reports/all_vehicles`, `reports/monthly_reports`, `reports/yearly_reports`) — delete?
> 5. The **`hooks/usePlace.tsx`** has `any` types everywhere and doesn't appear to be used. Delete?

---

## Phase 1: Dead Code Cleanup

Remove files/code that add confusion and bloat the project.

### [DELETE] [AuthContext.ts](file:///home/tejashvi/Diesel_System/lib/AuthContext.ts)
Entirely commented out. Superseded by `context/AuthProvider.tsx`.

### [DELETE] [FuelHistory.tsx](file:///home/tejashvi/Diesel_System/components/FuelHistory.tsx)
215 lines, all commented out. The working version was inlined into `month_name.tsx`.

### [DELETE] [LIstMenu2.tsx](file:///home/tejashvi/Diesel_System/components/LIstMenu2.tsx)
121 lines, all commented out. Appears to be an abandoned copy of `ListMenu.tsx`.

### [DELETE] [ListMenu.tsx](file:///home/tejashvi/Diesel_System/components/ListMenu.tsx)
Not imported anywhere in the project. Dead code.

### [DELETE] [DropDown.tsx](file:///home/tejashvi/Diesel_System/components/DropDown.tsx)
Contains hardcoded dummy data (`Item 1` through `Item 8`). Not used anywhere.

### [DELETE] [usePlace.tsx](file:///home/tejashvi/Diesel_System/hooks/usePlace.tsx)
Full of `any` types, not imported anywhere. The `place` data comes from `AuthProvider` already.

### [DELETE] [useAuth.ts](file:///home/tejashvi/Diesel_System/hooks/useAuth.ts)
Just re-exports from `AuthProvider` with a `@deprecated` tag. Unnecessary indirection.

### [DELETE] Empty directories
- `app/(tabs)/reports/all_vehicles/`
- `app/(tabs)/reports/monthly_reports/`
- `app/(tabs)/reports/yearly_reports/`

---

## Phase 2: Centralize Types & Interfaces

**Problem found**: The same interfaces are defined in 3-4 different files with slight variations.

| Interface | Duplicated in |
|-----------|---------------|
| `VehicleData` / `Vehicle_Info` | `fill-fuel.tsx`, `all-vehicles.tsx`, `edit-vehicle.tsx` |
| `FuelLog` / `FuelRecord` | `(tabs)/index.tsx`, `fill-fuel.tsx`, `month_name.tsx` |
| `UserProfile` | `context/AuthProvider.tsx`, `fill-fuel.tsx` |

### [NEW] types/database.ts
Centralize all Supabase table types in one file. Every screen imports from here instead of redefining.

```typescript
// types/database.ts

/** Matches the `vehicles` table */
export interface Vehicle {
  vehicle_id: number;
  vehicle_number: string;
  vehicle_name: string;
  vehicle_type: string;
  vehicle_class: string;
  owner_name: string | null;
  department: string | null;
  organization: string | null;
  place: string | null;
  current_meter_reading: number;
  permitted_liters: number;
}

/** Matches the `fuel_logs` table */
export interface FuelLog {
  id: number;
  vehicle_id_fk: number;
  meter_reading: number;
  previous_meter_reading: number;
  calculated_distance: number;
  filled_liters: number;
  calculated_efficiency: number | null;
  transaction_date: string;
  transaction_time: string;
  transaction_timestamp: string;
  place: string;
}

/** Matches the `fuel_logs_with_vehicle` view */
export interface FuelLogWithVehicle extends FuelLog {
  vehicle_number: string;
}

/** Matches the `monthly_reports` table */
export interface MonthlyReport {
  id: number;
  month_name: string;
  total_diesel: number;
  total_fills: number;
  first_date: string;
  last_date: string;
}

/** Matches the `users` table */
export interface UserProfile {
  id: string;
  email: string;
  place: string;
  name?: string;
}
```

### [DELETE] types/qr-scanner.d.ts
Only contains a single ambient declaration (`declare module 'react-native-qr-scanner'`) for a package that isn't even used.

### [MODIFY] Every screen file
Remove inline interface definitions and import from `@/types/database`.

---

## Phase 3: Create a Data Layer (Services)

**Problem found**: Every screen directly calls `supabase.from('table').select(...)`. This means:
- Business logic is mixed with UI code
- No single place to change a query
- `console.log` statements scattered everywhere (30+ found)
- Error handling is inconsistent (some `throw`, some `Alert.alert`, some silently fail)

### [NEW] services/vehicles.ts
```typescript
// All vehicle-related database operations
export async function getVehicleByNumber(vehicleNumber: string): Promise<Vehicle | null> { ... }
export async function getAllVehicles(): Promise<Vehicle[]> { ... }
export async function createVehicle(data: CreateVehicleInput): Promise<void> { ... }
export async function updateVehicle(vehicleNumber: string, data: UpdateVehicleInput): Promise<void> { ... }
```

### [NEW] services/fuel-logs.ts
```typescript
// All fuel log operations
export async function getRecentLogs(place: string, limit?: number): Promise<FuelLogFlat[]> { ... }
export async function getLastFuelLog(vehicleNumber: string): Promise<FuelLogWithVehicle | null> { ... }
export async function createFuelLog(data: CreateFuelLogInput): Promise<void> { ... }
export async function getLogsByDateRange(start: string, end: string): Promise<FuelLog[]> { ... }
```

### [NEW] services/reports.ts
```typescript
// Monthly & yearly report operations
export async function getMonthlyReports(): Promise<MonthlyReport[]> { ... }
export async function refreshMonthlyReport(): Promise<void> { ... }
```

### [MODIFY] All screen files
Replace inline `supabase.from(...)` calls with service function imports. Remove all `console.log` statements from screens.

---

## Phase 4: Folder Restructuring

**Current structure** (flat, disorganized):
```
app/
├── (auth)/index.tsx
├── (tabs)/
│   ├── index.tsx          ← named "Dashboard" but export is "Dashboard"
│   ├── new-vehicle.tsx
│   └── reports/index.tsx  ← named "AboutScreen" (wrong name!)
├── all-vehicles.tsx
├── edit-vehicle.tsx
├── fill-fuel.tsx
├── month.tsx
├── month_name.tsx         ← unclear name
├── qr-scanner.tsx
├── qr-show.tsx
├── type_vehcileNumber.tsx ← typo: "vehcile"
└── yearly-report.tsx
```

**Proposed structure** (following Expo Router conventions):
```
app/
├── (auth)/index.tsx                  ← Login (unchanged)
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx                     ← Dashboard
│   ├── new-vehicle.tsx               ← Create Vehicle
│   └── reports/index.tsx             ← Reports Hub (fix export name)
├── vehicles/
│   ├── all.tsx                       ← All Vehicles list
│   ├── [vehicleNumber]/edit.tsx      ← Edit Vehicle (dynamic route)
│   └── [vehicleNumber]/qr.tsx        ← Show QR (dynamic route)
├── fuel/
│   └── fill.tsx                      ← Fill Fuel
├── reports/
│   ├── monthly/index.tsx             ← Month list (was month.tsx)
│   └── monthly/[month].tsx           ← Month detail (was month_name.tsx)
├── scanner.tsx                       ← QR Scanner
└── _layout.tsx
```

> [!IMPORTANT]
> Folder restructuring is the riskiest change. I'll batch this into a single commit so navigation doesn't break. Want me to do this, or keep the current flat structure and just fix the naming issues?

---

## Phase 5: Performance Fixes

### 5.1 QR Scanner — Multiple Navigation Bug
**File**: [qr-scanner.tsx](file:///home/tejashvi/Diesel_System/app/qr-scanner.tsx#L32-L42)

`onBarcodeScanned` fires continuously — it can navigate to `fill-fuel` dozens of times. The `scanned` state is set but never checked before navigating.

```diff
- onBarcodeScanned={({ data }: { data: string }) => {
-   if (data) {
-     router.navigate(`/fill-fuel?vehicleId=${encodeURIComponent(data)}`)
+ onBarcodeScanned={scanned ? undefined : ({ data }: { data: string }) => {
+   if (data) {
+     setScanned(true);
+     router.navigate(`/fill-fuel?vehicleId=${encodeURIComponent(data)}`)
```

### 5.2 Reports Screen — Hardcoded `marginTop: 420`
**File**: [reports/index.tsx](file:///home/tejashvi/Diesel_System/app/%28tabs%29/reports/index.tsx#L81)

The logout button uses `marginTop: 420` which will break on different screen sizes. Fix with `flex: 1` and `justifyContent: 'flex-end'`.

### 5.3 Dashboard — Stale `useFocusEffect` Dependency
**File**: [(tabs)/index.tsx](file:///home/tejashvi/Diesel_System/app/%28tabs%29/index.tsx#L81-L94)

`FetchDetails` depends on `profile?.place` but the `useFocusEffect` callback has an empty dependency array `[]`. If the profile loads after the first focus, data won't load.

### 5.4 Month Name — Sequential Fetches Instead of Parallel
**File**: [month_name.tsx](file:///home/tejashvi/Diesel_System/app/month_name.tsx#L31-L80)

`GetMonthDates` fetches month dates, then on success calls `GetMonthlyLogs`. But `GetMonthlyLogs` uses a closure variable (`firstMonth`) that may not be set yet due to React state batching. This is a race condition.

### 5.5 Fill Fuel — `calculateDistance()` Called 3 Times Per Render
**File**: [fill-fuel.tsx](file:///home/tejashvi/Diesel_System/app/fill-fuel.tsx#L321-L334)

`calculateDistance()` is called in the JSX directly, meaning it runs on every render. Should use `useMemo`.

### 5.6 All Vehicles — `useRouter()` Called Outside Component
**File**: [all-vehicles.tsx](file:///home/tejashvi/Diesel_System/app/all-vehicles.tsx#L21)

`const router = useRouter()` is called at module level (line 21), outside the component. This is a React hooks violation that will crash in strict mode.

### 5.7 Edit Vehicle — Fake `setTimeout` Success
**File**: [edit-vehicle.tsx](file:///home/tejashvi/Diesel_System/app/edit-vehicle.tsx#L80-L86)

After the real Supabase update, there's a `setTimeout` that shows a success alert regardless of whether the update succeeded. The error path also shows "No new Data to Fetch" which is incorrect.

### 5.8 Remove All `console.log` Statements
Found **30+** `console.log` calls across the codebase. These slow down production builds and leak data.

---

## Phase 6: Design System & Consistent Styling

**Problem found**: Colors, spacing, and font sizes are hardcoded in every file with no consistency.

| Value | Used as |
|-------|---------|
| `#2563eb` | Button blue in 4 files |
| `#f9fafb`, `#f5f5f5`, `#F3F4F6` | Background grey (3 different values for same purpose) |
| `#1f2937`, `#333`, `#1e293b` | Dark text (3 different values) |
| `#6b7280`, `#666`, `#555`, `#64748b` | Subtle text (4 different values) |

### [NEW] constants/colors.ts
```typescript
export const colors = {
  primary: '#2563eb',
  primaryPressed: '#1d4ed8',
  primaryDisabled: '#93c5fd',
  
  background: '#f5f5f5',
  surface: '#ffffff',
  
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  
  border: '#e5e7eb',
  divider: '#f0f0f0',
  
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#007AFF',
};
```

### [NEW] constants/spacing.ts
```typescript
export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
};
export const radius = {
  sm: 4, md: 8, lg: 12, xl: 16,
};
```

### [MODIFY] All screen StyleSheet definitions
Replace hardcoded colors/values with constants.

---

## Phase 7: UX Improvements

### 7.1 Pull-to-Refresh on Dashboard & All Vehicles
Neither FlatList has `onRefresh` or `refreshing` props — users have to leave and return to refresh.

### 7.2 Loading States
Some screens show loading spinners, others show nothing while data loads (e.g., `all-vehicles.tsx`, `month.tsx`).

### 7.3 Empty States
When a list is empty, most screens show nothing. Add friendly empty state messages.

### 7.4 Confirmation Before Submit
The fuel log submit has no confirmation dialog — one tap and it's done. Add a confirmation Alert before inserting.

### 7.5 Keyboard Dismiss on Tap
Forms don't dismiss the keyboard when tapping outside inputs.

---

## Verification Plan

### After Each Phase
- Run `npx expo start` to confirm the app builds
- Manually test each screen: Login → Dashboard → Scan QR → Fill Fuel → Reports → Monthly → Vehicles → Edit → Logout

### Automated
- Run `npx tsc --noEmit` after type changes to ensure no TypeScript errors

---

## Execution Order

| Phase | Scope | Risk | Est. Files Changed |
|-------|-------|------|--------------------|
| 1 | Dead code cleanup | 🟢 Low | ~8 deletions |
| 2 | Centralize types | 🟢 Low | ~8 files |
| 3 | Data layer (services) | 🟡 Medium | ~10 files |
| 4 | Folder restructure | 🔴 High (navigation) | ~12 files |
| 5 | Performance fixes | 🟡 Medium | ~6 files |
| 6 | Design system | 🟢 Low | ~10 files |
| 7 | UX improvements | 🟢 Low | ~4 files |

> [!IMPORTANT]
> **Phase 4 (folder restructure) is optional** — all other phases work regardless. If you want to skip it for now, let me know and I'll do everything else.
