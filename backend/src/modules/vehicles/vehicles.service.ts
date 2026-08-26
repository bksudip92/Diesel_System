import type { Prisma, PrismaClient, Vehicle } from '../../generated/prisma/client.js';
import { ConflictError, NotFoundError } from '../../utils/appError.js';
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
} from './vehicles.schema.js';

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
   */
  async getByNumber(vehicleNumber: string): Promise<Vehicle> {
    const rows = await this.prisma.$queryRaw<Vehicle[]>`
      SELECT * FROM "vehicle_info" WHERE "vehicle_number" = ${vehicleNumber} LIMIT 1`;
    const vehicle = rows[0];
    if (!vehicle) throw new NotFoundError('Vehicle');
    return vehicle;
  }

  async create(input: CreateVehicleInput): Promise<Vehicle> {
    const existing = await this.prisma.vehicle.findUnique({
      where: { vehicle_number: input.vehicle_number },
      select: { vehicle_id: true },
    });
    if (existing) {
      throw new ConflictError(`Vehicle '${input.vehicle_number}' already exists`);
    }
    return this.prisma.vehicle.create({
      data: stripUndefined(input) as Prisma.VehicleUncheckedCreateInput,
    });
  }

  async updateByNumber(vehicleNumber: string, updates: UpdateVehicleInput): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { vehicle_number: vehicleNumber },
      select: { vehicle_id: true },
    });
    if (!vehicle) throw new NotFoundError('Vehicle');

    if (updates.vehicle_number && updates.vehicle_number !== vehicleNumber) {
      const clash = await this.prisma.vehicle.findUnique({
        where: { vehicle_number: updates.vehicle_number },
        select: { vehicle_id: true },
      });
      if (clash) throw new ConflictError(`Vehicle '${updates.vehicle_number}' already exists`);
    }

    await this.prisma.vehicle.update({
      where: { vehicle_id: vehicle.vehicle_id },
      data: stripUndefined(updates),
    });

    return this.getByNumber(vehicleNumber);
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
