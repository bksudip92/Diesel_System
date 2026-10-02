import type { Prisma, PrismaClient, Vehicle } from '../../generated/prisma/client.js';
import { findVehicleByNumber, type VehicleLookupRow } from '../../db/vehicleLookup.js';
import { ConflictError, NotFoundError } from '../../utils/appError.js';
import type { CreateVehicleInput, UpdateVehicleInput } from './vehicles.schema.js';

export class VehiclesService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(place?: string): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany({
      ...(place ? { where: { place } } : {}),
      orderBy: { vehicle_number: 'asc' },
    });
  }

  /**
   * Looks up a vehicle through the `vehicle_info` view to preserve parity
   * with the legacy Supabase query path.
   *
   * A QR payload is not guaranteed to match the stored dash layout or casing
   * (a code can read back as "ka01test" even when the row is "KA-01-TEST"), so
   * matching is delegated to the shared resolver, which tries exact-then-
   * normalised. Every other vehicle-number lookup uses the same resolver, so a
   * scan can no longer resolve here and be rejected elsewhere.
   */
  async getByNumber(vehicleNumber: string): Promise<Vehicle> {
    const vehicle = await findVehicleByNumber<Vehicle>(this.prisma, vehicleNumber, {
      source: 'vehicle_info',
    });

    if (!vehicle) throw new NotFoundError('Vehicle');
    return vehicle;
  }

  async create(input: CreateVehicleInput): Promise<Vehicle> {
    // Resolved rather than `findUnique` so duplicates are detected by
    // normalised key: without that, creating "ka-05-mj-6100" alongside an
    // existing "KA-05-MJ-6100" would slip past the check and leave two rows that
    // no single lookup can resolve unambiguously.
    const existing = await findVehicleByNumber<VehicleLookupRow>(this.prisma, input.vehicle_number);
    if (existing) {
      throw new ConflictError(`Vehicle '${input.vehicle_number}' already exists`);
    }
    return this.prisma.vehicle.create({
      data: stripUndefined(input) as Prisma.VehicleUncheckedCreateInput,
    });
  }

  async updateByNumber(vehicleNumber: string, updates: UpdateVehicleInput): Promise<Vehicle> {
    // Resolve first, then write by `vehicle_id`, so a scan with the wrong
    // casing or layout updates the right row instead of 404-ing on the
    // unique index.
    const vehicle = await findVehicleByNumber<VehicleLookupRow>(this.prisma, vehicleNumber);
    if (!vehicle) throw new NotFoundError('Vehicle');

    if (updates.vehicle_number && updates.vehicle_number !== vehicle.vehicle_number) {
      const clash = await findVehicleByNumber<VehicleLookupRow>(this.prisma, updates.vehicle_number);
      if (clash) throw new ConflictError(`Vehicle '${updates.vehicle_number}' already exists`);
    }

    await this.prisma.vehicle.update({
      where: { vehicle_id: vehicle.vehicle_id },
      data: stripUndefined(updates),
    });

    // Re-read under the new number when the row was renamed; re-reading under
    // the old one would 404.
    return this.getByNumber(updates.vehicle_number ?? vehicle.vehicle_number);
  }
}

function stripUndefined<T extends object>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}
