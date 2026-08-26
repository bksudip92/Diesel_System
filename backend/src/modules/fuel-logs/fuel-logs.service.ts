import type { FuelLog, PrismaClient } from '../../generated/prisma/client.js';
import { UnprocessableEntityError } from '../../utils/appError.js';
import type { CreateFuelLogInput, DateRangeQuery, RecentLogsQuery } from './fuel-logs.schema.js';

export interface FuelLogWithVehicleNumber extends FuelLog {
  vehicle_number: string;
}

export interface FuelLogFlat {
  id: number;
  filled_liters: number;
  calculated_efficiency: number | null;
  calculated_distance: number;
  transaction_timestamp: string;
  place: string;
  vehicles: string;
}

export class FuelLogsService {
  constructor(private readonly prisma: PrismaClient) {}

  async recent(query: RecentLogsQuery): Promise<FuelLogFlat[]> {
    const logs = await this.prisma.fuelLog.findMany({
      where: { place: query.place },
      orderBy: { transaction_timestamp: 'desc' },
      take: query.limit,
      select: {
        id: true,
        filled_liters: true,
        calculated_efficiency: true,
        calculated_distance: true,
        transaction_timestamp: true,
        place: true,
        vehicle: { select: { vehicle_number: true } },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      filled_liters: log.filled_liters,
      calculated_efficiency: log.calculated_efficiency,
      calculated_distance: log.calculated_distance,
      transaction_timestamp: log.transaction_timestamp,
      place: log.place,
      vehicles: log.vehicle.vehicle_number,
    }));
  }

  /** Reads through the `fuel_logs_with_vehicle` view for legacy parity. */
  async lastForVehicle(vehicleNumber: string): Promise<FuelLogWithVehicleNumber | null> {
    const rows = await this.prisma.$queryRaw<FuelLogWithVehicleNumber[]>`
      SELECT * FROM "fuel_logs_with_vehicle"
      WHERE "vehicle_number" = ${vehicleNumber}
      ORDER BY "meter_reading" DESC
      LIMIT 1`;
    return rows[0] ?? null;
  }

  async listByDateRange(query: DateRangeQuery): Promise<FuelLog[]> {
    return this.prisma.fuelLog.findMany({
      where: {
        transaction_date: { gte: query.from, lt: query.to },
      },
      orderBy: { transaction_timestamp: 'desc' },
    });
  }

  /**
   * Creates a fuel log atomically:
   *   1. locks the vehicle row and reads its current meter
   *   2. derives previous reading / distance / efficiency server-side
   *   3. inserts the log and advances the vehicle meter
   *
   * The client no longer sends computed values — they are derived here so
   * records cannot be tampered with.
   */
  async create(input: CreateFuelLogInput): Promise<FuelLogWithVehicleNumber> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ vehicle_id: number; vehicle_number: string; current_meter_reading: number }[]>`
        SELECT "vehicle_id", "vehicle_number", "current_meter_reading"
        FROM "vehicles"
        WHERE "vehicle_number" = ${input.vehicle_number}
        FOR UPDATE`;
      const vehicle = rows[0];
      if (!vehicle) throw new UnprocessableEntityError(`Unknown vehicle '${input.vehicle_number}'`);

      const previousMeterReading = vehicle.current_meter_reading;
      if (input.meter_reading <= previousMeterReading) {
        throw new UnprocessableEntityError(
          `Meter reading must be greater than last recorded value (${previousMeterReading})`,
        );
      }

      const calculatedDistance = input.meter_reading - previousMeterReading;
      const calculatedEfficiency = input.filled_liters > 0
        ? calculatedDistance / input.filled_liters
        : null;

      const transactionTimestamp = `${input.transaction_date}T${normalizeTime(input.transaction_time)}`;

      const created = await tx.fuelLog.create({
        data: {
          vehicle_id_fk: vehicle.vehicle_id,
          meter_reading: input.meter_reading,
          previous_meter_reading: previousMeterReading,
          calculated_distance: calculatedDistance,
          filled_liters: input.filled_liters,
          calculated_efficiency: calculatedEfficiency,
          transaction_date: input.transaction_date,
          transaction_time: normalizeTime(input.transaction_time),
          transaction_timestamp: transactionTimestamp,
          place: input.place,
        },
      });

      await tx.vehicle.update({
        where: { vehicle_id: vehicle.vehicle_id },
        data: { current_meter_reading: input.meter_reading },
      });

      return { ...created, vehicle_number: vehicle.vehicle_number };
    });
  }
}

function normalizeTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

// Re-export for controller typing convenience
export type { RecentLogsQuery };
