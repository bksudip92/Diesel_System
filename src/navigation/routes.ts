/**
 * Centralized navigation targets. Screens must use these instead of
 * scattering magic strings like `/month_name?month=...` through the code.
 *
 * The dynamic helpers declare template-literal return types so the values
 * satisfy expo-router's generated `Href` union — without the annotation they
 * widen to `string` and every call site fails to typecheck.
 */

export const Routes = {
  login: '/(auth)/login',
  dashboard: '/(tabs)',
  addVehicle: '/(tabs)/add-vehicle',
  reportsMenu: '/(tabs)/reports',

  scanner: '/scanner',
  fillFuel: (vehicleNumber: string): `/fuel/${string}` =>
    `/fuel/${encodeURIComponent(vehicleNumber)}`,
  qrShow: (vehicleNumber: string): `/qr/${string}` => `/qr/${encodeURIComponent(vehicleNumber)}`,

  vehicleList: '/vehicles',
  editVehicle: (vehicleNumber: string): `/vehicles/edit?vehicle=${string}` =>
    `/vehicles/edit?vehicle=${encodeURIComponent(vehicleNumber)}`,

  monthlyReports: '/reports/months',
  monthlyReportDetail: (month: string): `/reports/months/${string}` =>
    `/reports/months/${encodeURIComponent(month)}`,
} as const;
