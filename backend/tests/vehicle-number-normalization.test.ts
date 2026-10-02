import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  authed,
  createTestContext,
  resetData,
  teardownTestContext,
  type TestContext,
} from './helpers.js';

/**
 * Cross-cutting suite for vehicle-number normalisation.
 *
 * Every vehicle-number lookup is meant to go through one resolver, so a scan
 * resolves identically no matter which endpoint receives it. These tests pin
 * that contract for each spelling a QR scan can produce, and pin the two cases
 * that must NOT be accepted: a payload that is not a plate at all, and a key
 * that is genuinely ambiguous.
 */

const STORED = 'UP-92-AB-1234';

/** Every spelling of the same plate a scan can plausibly produce. */
const EQUIVALENT_SPELLINGS = [
  'UP-92-AB-1234', // exact
  'up-92-ab-1234', // lowercase
  'Up-92-Ab-1234', // mixed case
  'UP92AB1234', // separators stripped
  'up92ab1234', // lowercase and unseparated
  'UP 92 AB 1234', // spaces
  'UP_92_AB_1234', // underscores
  'UP.92.AB.1234', // dots
  'UP--92--AB--1234', // collapsed separator run
];

async function seedVehicleDirect(
  ctx: TestContext,
  vehicleNumber: string,
  meter: number,
): Promise<void> {
  // Inserted straight through Prisma so a test can create rows that the API's
  // own duplicate guard would (correctly) refuse.
  await ctx.prisma.vehicle.create({
    data: {
      vehicle_number: vehicleNumber,
      vehicle_name: 'Fuel Truck',
      vehicle_type: 'Truck',
      vehicle_class: 'Heavy',
      place: 'Depot A',
      current_meter_reading: meter,
      permitted_liters: 60,
    },
  });
}

async function createLog(ctx: TestContext, vehicleNumber: string, meterReading = 5_100) {
  return authed(
    request(ctx.app)
      .post('/api/v1/fuel-logs')
      .send({
        vehicle_number: vehicleNumber,
        meter_reading: meterReading,
        filled_liters: 20,
        place: 'Depot A',
        transaction_date: '2026-10-02',
        transaction_time: '09:30',
      }),
    ctx.token,
  );
}

describe('vehicle number normalisation', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext();
  });

  beforeEach(async () => {
    await resetData(ctx.prisma);
  });

  afterAll(async () => {
    await teardownTestContext(ctx);
  });

  describe('POST /fuel-logs', () => {
    // The reported bug: a lowercase scan resolved on the read endpoints and
    // then 422'd here, because this was the only vehicle lookup that compared
    // `vehicle_number` exactly.
    it.each(EQUIVALENT_SPELLINGS)('accepts a scan spelled %s', async (scan) => {
      await seedVehicleDirect(ctx, STORED, 5_000);

      const res = await createLog(ctx, scan);

      expect(res.status).toBe(201);
      // Proves the right row was locked, not merely that the request passed:
      // the distance is derived from the stored meter of 5,000.
      expect(res.body.vehicle_number).toBe(STORED);
      expect(res.body.previous_meter_reading).toBe(5_000);
      expect(res.body.calculated_distance).toBe(100);
      expect(res.body.calculated_efficiency).toBeCloseTo(5);
    });

    it('advances the stored meter exactly once per accepted scan', async () => {
      await seedVehicleDirect(ctx, STORED, 5_000);

      await createLog(ctx, 'up-92-ab-1234', 5_100);

      const vehicle = await authed(request(ctx.app).get(`/api/v1/vehicles/${STORED}`), ctx.token);
      expect(vehicle.body.current_meter_reading).toBe(5_100);
    });

    it('stores logs canonically regardless of the scan spelling', async () => {
      await seedVehicleDirect(ctx, STORED, 5_000);

      await createLog(ctx, 'up92ab1234');

      const logs = await authed(
        request(ctx.app).get('/api/v1/fuel-logs?from=2026-10-01&to=2026-10-03'),
        ctx.token,
      );
      expect(logs.status).toBe(200);
      expect(logs.body).toHaveLength(1);
    });

    it('still rejects a vehicle that does not exist', async () => {
      const res = await createLog(ctx, 'ZZ-99-ZZ-9999');

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('UNPROCESSABLE');
      expect(res.body.error.message).toContain('Unknown vehicle');
    });

    it('does not match a vehicle that merely shares some of the plate', async () => {
      await seedVehicleDirect(ctx, STORED, 5_000);

      // Same letters and digits region, different plate: must not resolve.
      const res = await createLog(ctx, 'up-92-ab-1235');

      expect(res.status).toBe(422);
    });

    it('refuses an ambiguous key instead of guessing which vehicle was meant', async () => {
      await seedVehicleDirect(ctx, 'KA-01-TEST', 5_000);
      await seedVehicleDirect(ctx, 'KA01TEST', 5_000);

      // Canonicalises to "KA-01TEST", which matches neither stored row, so this
      // reaches the key comparison — and both rows share the key "KA01TEST".
      const res = await createLog(ctx, 'ka-01test', 5_100);

      expect(res.status).toBe(422);
      expect(res.body.error.message).toContain('matches more than one vehicle');
      // Nothing may be written when the target is unclear.
      const logs = await authed(
        request(ctx.app).get('/api/v1/fuel-logs?from=2026-10-01&to=2026-10-03'),
        ctx.token,
      );
      expect(logs.body).toHaveLength(0);
    });

    it('accepts the exact number even when the key is ambiguous', async () => {
      await seedVehicleDirect(ctx, 'KA-01-TEST', 5_000);
      await seedVehicleDirect(ctx, 'KA01TEST', 5_000);

      // The exact match runs first and is unambiguous, so the scan still works:
      // ambiguity only matters when the scan cannot pick a single row.
      const res = await createLog(ctx, 'KA01TEST', 5_100);

      expect(res.status).toBe(201);
      expect(res.body.vehicle_number).toBe('KA01TEST');
    });
  });

  describe('GET /fuel-logs/last', () => {
    it.each(EQUIVALENT_SPELLINGS)('resolves the previous log from a scan spelled %s', async (scan) => {
      await seedVehicleDirect(ctx, STORED, 5_000);
      await createLog(ctx, STORED, 5_400);

      const res = await authed(
        request(ctx.app).get(`/api/v1/fuel-logs/last?vehicleNumber=${encodeURIComponent(scan)}`),
        ctx.token,
      );

      expect(res.status).toBe(200);
      expect(res.body.meter_reading).toBe(5_400);
      expect(res.body.vehicle_number).toBe(STORED);
    });

    it('returns null (not a log) for a vehicle with no logs', async () => {
      await seedVehicleDirect(ctx, STORED, 5_000);

      const res = await authed(
        request(ctx.app).get('/api/v1/fuel-logs/last?vehicleNumber=up92ab1234'),
        ctx.token,
      );

      expect(res.status).toBe(200);
      expect(res.body).toBeNull();
    });

    it('agrees with POST about which vehicle a scan refers to', async () => {
      await seedVehicleDirect(ctx, STORED, 5_000);

      const read = await authed(
        request(ctx.app).get('/api/v1/fuel-logs/last?vehicleNumber=up-92-ab-1234'),
        ctx.token,
      );
      const written = await createLog(ctx, 'up-92-ab-1234');

      // The invariant the two endpoints used to violate: a scan that resolves
      // to a vehicle must also resolve to that vehicle's log.
      expect(read.status).toBe(200);
      expect(written.status).toBe(201);
      expect(written.body.vehicle_number).toBe(STORED);
    });
  });

  describe('GET /vehicles/:number', () => {
    it.each(EQUIVALENT_SPELLINGS)('resolves a scan spelled %s', async (scan) => {
      await seedVehicleDirect(ctx, STORED, 5_000);

      const res = await authed(request(ctx.app).get(`/api/v1/vehicles/${encodeURIComponent(scan)}`), ctx.token);

      expect(res.status).toBe(200);
      expect(res.body.vehicle_number).toBe(STORED);
    });

    it('still 404s a vehicle that does not exist', async () => {
      const res = await authed(request(ctx.app).get('/api/v1/vehicles/zz99zz9999'), ctx.token);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /vehicles', () => {
    it('stores a new vehicle in canonical form', async () => {
      const res = await authed(
        request(ctx.app).post('/api/v1/vehicles').send({
          vehicle_number: '  up 92 ab 1234 ',
          vehicle_name: 'Fuel Truck',
          vehicle_type: 'Truck',
          vehicle_class: 'Heavy',
          place: 'Depot A',
          current_meter_reading: 0,
          permitted_liters: 60,
        }),
        ctx.token,
      );

      expect(res.status).toBe(201);
      expect(res.body.vehicle_number).toBe('UP-92-AB-1234');
    });

    it('rejects a duplicate that differs only by case or separators', async () => {
      await seedVehicleDirect(ctx, STORED, 0);

      const res = await authed(
        request(ctx.app).post('/api/v1/vehicles').send({
          vehicle_number: 'up92ab1234',
          vehicle_name: 'Clash',
          vehicle_type: 'Truck',
          vehicle_class: 'Heavy',
          place: 'Depot A',
          current_meter_reading: 0,
          permitted_liters: 60,
        }),
        ctx.token,
      );

      expect(res.status).toBe(409);
    });
  });

  describe('PATCH /vehicles/:number', () => {
    it('updates the right row when addressed by a lowercase scan', async () => {
      await seedVehicleDirect(ctx, STORED, 5_000);

      const res = await authed(
        request(ctx.app).patch('/api/v1/vehicles/up92ab1234').send({ vehicle_name: 'Renamed' }),
        ctx.token,
      );

      expect(res.status).toBe(200);
      expect(res.body.vehicle_number).toBe(STORED);
      expect(res.body.vehicle_name).toBe('Renamed');
    });

    it('returns the renamed row after a change of number', async () => {
      await seedVehicleDirect(ctx, STORED, 5_000);

      const res = await authed(
        request(ctx.app)
          .patch('/api/v1/vehicles/up-92-ab-1234')
          .send({ vehicle_number: 'up-92-cd-5678' }),
        ctx.token,
      );

      expect(res.status).toBe(200);
      expect(res.body.vehicle_number).toBe('UP-92-CD-5678');
    });

    it('rejects a rename that would collide with an existing key', async () => {
      await seedVehicleDirect(ctx, 'UP-92-AB-1234', 0);
      await seedVehicleDirect(ctx, 'UP-92-CD-5678', 0);

      const res = await authed(
        request(ctx.app)
          .patch('/api/v1/vehicles/up92cd5678')
          .send({ vehicle_number: 'up-92-ab-1234' }),
        ctx.token,
      );

      expect(res.status).toBe(409);
    });
  });

  describe('input validation', () => {
    it('rejects a scan carrying characters that cannot be part of a plate', async () => {
      const res = await createLog(ctx, 'UP-92-AB-1234!');

      expect(res.status).toBe(422);
      expect(res.body.error.message).toContain('letters, digits and separators');
    });

    it('rejects an arbitrary barcode that is not shaped like a plate', async () => {
      const res = await createLog(ctx, '1234567890');

      expect(res.status).toBe(422);
    });
  });
});