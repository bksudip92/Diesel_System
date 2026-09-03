/**
 * Centralized navigation targets. Screens must use these instead of
 * scattering magic strings like `/month_name?month=...` through the code.
 *
 * Routes become fully typed once expo-router's typedRoutes generator runs
 * against the new `src/app` tree (done in the screen-migration phase).
 */

export const Routes = {
  login: '/(auth)/login',
  dashboard: '/(tabs)',
  addVehicle: '/(tabs)/add-vehicle',
  reportsMenu: '/(tabs)/reports',

  scanner: '/scanner',
  fillFuel: (vehicleNumber: string) => `/fuel/${encodeURIComponent(vehicleNumber)}`,
  qrShow: (vehicleNumber: string) => `/qr/${encodeURIComponent(vehicleNumber)}`,

  vehicleList: '/vehicles',
  editVehicle: (vehicleNumber: string) => `/vehicles/edit?vehicle=${encodeURIComponent(vehicleNumber)}`,

  monthlyReports: '/reports/months',
  monthlyReportDetail: (month: string) => `/reports/months/${encodeURIComponent(month)}`,
} as const;
