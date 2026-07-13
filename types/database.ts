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
