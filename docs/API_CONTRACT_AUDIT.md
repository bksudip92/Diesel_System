# Frontend ↔ Backend API Contract Audit

Date: 2026-09-13. Verified read-only from `src/**` (frontend) and `backend/src/**` (backend).

## 0. Transport contract (shared by all routes)

- Base URL: `EXPO_PUBLIC_API_URL` **must include** `/api/v1`
  (e.g. `http://10.0.2.2:3000/api/v1`, `.env.example:5`).
  `apiFetch(path)` (`src/lib/api-client.ts:71-78`) builds `` `${getApiUrl()}${path}` ``,
  so `'/auth/login'` → `/api/v1/auth/login`, matching the backend mounts
  (`backend/src/app.ts:46-50`). ✅
- Auth: `Authorization: Bearer <JWT>` on every route except login/refresh
  (`api-client.ts:75-86`). On `401`, one transparent `POST /auth/refresh` retry
  (`api-client.ts:89-96`). ✅
- Errors: backend envelope `{error:{code,message}}` (`backend/src/middleware/errorHandler.ts`);
  frontend parses `json?.error?.code/message` into `ApiRequestError`
  (`api-client.ts:102-110`). ✅
- `204 No Content` → `undefined as T` (`api-client.ts:98-100`). ✅
- Status codes used: `200/201/204`, `400/401/403/404/409/422 (VALIDATION_ERROR + UNPROCESSABLE)/429 (auth only)/500`.

## 1. Auth

### `POST /api/v1/auth/login` ✅
- Frontend: `src/features/auth/api.ts:13` — `apiFetch<AuthResponse>('/auth/login',
  {method:'POST', body:{email,password}, anonymous:true})`.
- Backend: `backend/src/modules/auth/auth.routes.ts:27`, public + 20/15min rate limit.
  Body (`auth.schema.ts:3-6`): `{email: string(email), password: string(min1)}`.
- Response `200`:
  ```json
  {"accessToken":"<jwt>","refreshToken":"<base64url>","refreshTokenExpiresAt":"2026-…",
   "user":{"id":"…","email":"…","place":"…","name":"…|null"}}
  ```
  Frontend type `AuthResponse` (`src/types/api.ts:21-30`) omits `refreshTokenExpiresAt` — safe to ignore. Controller trims+lowercases email (`auth.controller.ts:10`).

### `POST /api/v1/auth/refresh` ✅
- Frontend: `src/lib/api-client.ts:29` — `POST /auth/refresh`, body `{refreshToken}`, no auth header. Expects `{accessToken, refreshToken}` (subset — safe).
- Backend: `auth.routes.ts:28`, `refreshSchema:{refreshToken:min1}`. Rotates pair, revokes old, reuse revokes family (`auth.service.ts:52-87`).
- Response `200`: same `LoginResult` shape as login.

### `POST /api/v1/auth/logout` ✅
- Frontend: `auth/api.ts:32` — bearer + body `{refreshToken}`, expects void.
- Backend: `auth.routes.ts:29-34` — `authenticate()` required + `logoutSchema:{refreshToken}` → `204` empty (idempotent, `auth.controller.ts:20-24`).

## 2. Users

### `GET /api/v1/users/me` ⚠️ minor (fixed)
- Frontend: `auth/api.ts:46` — `apiFetch<UserProfile>('/users/me')`, bearer.
- Backend: `users.routes.ts:13` — auth, no validation → `200 {id,email,place,name:string|null}`.
- Was: frontend `UserProfile.name?: string` (`models.ts`) vs backend `null`. Fixed: `name: string | null`, `login()` keeps `null`, `fetchProfile()` normalizes `undefined→null`.

## 3. Vehicles

### `GET /api/v1/vehicles/` ✅
- Frontend `vehicles/api.ts:10` — `GET /vehicles`, bearer, no query.
- Backend `vehicles.routes.ts:22` — query `place?: string` (optional). `200 Vehicle[]` ordered by number.

### `GET /api/v1/vehicles/:number` ✅
- Frontend `vehicles/api.ts:14` — `GET /vehicles/${encodeURIComponent(n)}`.
- Backend `vehicles.routes.ts:32` — param `number: trim/min1`, reads `vehicle_info` view. `200 Vehicle` / `404`.

### `POST /api/v1/vehicles/` ✅ (type widened)
- Frontend `vehicles/api.ts:31` — body `CreateVehicleInput` with `""→null` coercion for optional fields.
- Backend `vehicles.routes.ts:42` — `createVehicleSchema`: required `vehicle_number/name/type/class`, `owner_name/department/organization/place: optional().nullable()`, `current_meter_reading: coerce.nonnegative`, `permitted_liters: coerce.positive`.
- Response `201 Vehicle` (frontend ignores body — fine). `409` duplicate / `422`.
- Fixed: frontend `CreateVehicleInput` optional fields typed `string` (forced `""`); now `string | null`.

### `PATCH /api/v1/vehicles/:number` ✅
- Frontend `vehicles/api.ts:54` — body subset `{current_meter_reading?,owner_name?,department?,permitted_liters?}`.
- Backend `vehicles.routes.ts:51` — same param + `updateVehicleSchema = create.partial()` (any subset allowed). `200 Vehicle` / `404/409/422`.

`Vehicle` shape (both sides, `models.ts:15-27` ↔ Prisma `Vehicle`): `{vehicle_id:number, vehicle_number/name/type/class:string, owner_name/department/organization/place:string|null, current_meter_reading/permitted_liters:number}`.

## 4. Fuel logs

### `GET /api/v1/fuel-logs/recent` ✅ (type fixed)
- Frontend `fuel-logs/api.ts:19` — `GET /fuel-logs/recent?place=&limit=` (limit default 10).
- Backend `fuel-logs.routes.ts:24` — query `place: required`, `limit: coerce.int 1-100 default 10`.
- Response `200`:
  ```json
  [{"id":1,"filled_liters":20,"calculated_efficiency":12.5,"calculated_distance":250,
    "transaction_timestamp":"2026-…","place":"…","vehicles":"KA05MJ6100"}]
  ```
  Note the flattened key is plural `vehicles` on both sides (`fuel-logs.service.ts:45`, `DashboardLogCard.tsx:13`). Fixed: frontend `calculated_distance` was optional — backend always sends it, now required.

### `GET /api/v1/fuel-logs/last` ✅
- Frontend `fuel-logs/api.ts:26` — `GET /fuel-logs/last?vehicleNumber=` (camelCase).
- Backend `fuel-logs.routes.ts:35` — query `vehicleNumber: required`. `200 {...FuelLog, vehicle_number} | null` (literal `null` when no prior log — frontend union type handles it).

### `GET /api/v1/fuel-logs/` ✅
- Frontend `fuel-logs/api.ts:38` — `GET /fuel-logs?from=&to=` (`YYYY-MM-DD`).
- Backend `fuel-logs.routes.ts:49` — `from/to: YYYY-MM-DD`, half-open `[from, to)`, ordered desc. Callers must pass an **exclusive** end (detail screen does — `reports/months/[name].tsx:27`).

### `POST /api/v1/fuel-logs/` ✅
- Frontend `fuel-logs/api.ts:33` — body `{vehicle_number, meter_reading>0, filled_liters>0, place, transaction_date:YYYY-MM-DD, transaction_time:HH:MM[:SS]}`.
- Backend `fuel-logs.routes.ts:58` — identical `createFuelLogSchema` (numbers coerced). Server derives `previous_meter_reading/distance/efficiency`, normalizes `HH:MM→HH:MM:00`, advances vehicle meter transactionally (`fuel-logs.service.ts:77-123`).
- Response `201 {...FuelLog, vehicle_number}` (frontend `void` — fine). `422 UNPROCESSABLE` for unknown vehicle or `meter_reading <= last recorded`.

## 5. Reports

### `GET /api/v1/reports/monthly` ✅
- Frontend `reports/api.ts:9` ↔ backend `reports.routes.ts:19`. `200 MonthlyReport[]`.

### `GET /api/v1/reports/monthly/:monthName` 🔴 fixed (was broken)
- Wire: frontend `reports/api.ts:13` ↔ backend `reports.routes.ts:26` (`monthName` exact match on `month_name`). ✅
- Bug was in the caller: `months.tsx:87` navigates with the full key `"September 2025"`, but `[name].tsx` validated with `isMonthName()` (bare `"September"` only) → every real row rendered `Unknown month`, and even a passing value would have queried the backend with the bare name → `404`. Fixed: `[name].tsx` now parses `"Month YYYY"` (with bare-month legacy fallback), queries `useMonthlyReport(period)` with the full key, and builds the date range for the explicit year.

### `POST /api/v1/reports/monthly/refresh` 🔴 fixed (was undercounting)
- Wire: frontend `reports/api.ts:24` body `{firstDatePrev,lastDatePrev,period}` ↔ backend `reports.routes.ts:35` same fields; `period` is the upsert key for `month_name`. ✅
- Bug: `months.tsx` sent `lastDatePrev` = last day **inclusive** (`2026-09-30`), but the backend aggregates `date >= first AND < last` (`reports.service.ts:27-31`) — last-day fills were silently excluded and `last_date` stored the wrong day. Fixed: refresh now sends `endDateExclusive` (Oct 1) as `lastDatePrev`, matching the detail screen's listing range. `MonthRange` docs in `utils.ts` now spell out inclusive vs exclusive fields.

### `GET /api/v1/reports/yearly` ℹ️
- Exists on backend (`reports.routes.ts:44`, `200 YearlyReport[]`) with **no frontend caller**. Dead route or missing UI — confirm intent before shipping.

## 6. Fixes applied (2026-09-13)

1. `src/app/reports/months/[name].tsx` — period-aware parsing (`"September 2025"`), full-key report query, explicit-year range.
2. `src/features/reports/utils.ts` — added `getMonthDateRangeForYear()` + `parsePeriodParam()`; documented inclusive/exclusive fields.
3. `src/app/reports/months.tsx` — refresh sends `endDateExclusive` as `lastDatePrev`.
4. `src/types/models.ts` — `UserProfile.name: string | null`; `FuelLogFlat.calculated_distance: number` (required).
5. `src/features/auth/api.ts` — `login()` keeps `null`; `fetchProfile()` normalizes to `{id,email,place,name: string|null}`.
6. `src/features/vehicles/api.ts` — `CreateVehicleInput` optional fields: `string | null`.

## 7. How to re-verify

- `cd backend && npm test` (auth/vehicles/fuel-logs/reports suites).
- `npm run typecheck` (repo root, frontend).
- Live smoke (backend running, replace `$JWT`):
  `curl -H "Authorization: Bearer $JWT" localhost:3000/api/v1/vehicles | head -c 300`
  `curl -H "Authorization: Bearer $JWT" "localhost:3000/api/v1/fuel-logs/recent?place=X&limit=5"`
  `curl -H "Authorization: Bearer $JWT" localhost:3000/api/v1/reports/monthly`
