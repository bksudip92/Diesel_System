import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  authed,
  createTestContext,
  resetData,
  teardownTestContext,
  type TestContext,
} from './helpers.js';

async function seedVehicle(ctx: TestContext, meter: number): Promise<void> {
  const res = await authed(
    request(ctx.app)
      .post('/api/v1/vehicles')
      .send({
        vehicle_number: 'KA-05-FL0001',
        vehicle_name: 'Fuel Truck',
        vehicle_type: 'Truck',
        vehicle_class: 'Heavy',
        place: 'Depot A',
        current_meter_reading: meter,
        permitted_liters: 60,
      }),
    ctx.token,
  );
  expect(res.status).toBe(201);
}

describe('fuel-logs', () => {
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

  it('creates a log, derives metrics server-side and advances the meter', async () => {
    await seedVehicle(ctx, 10_000);

    const res = await authed(
      request(ctx.app)
        .post('/api/v1/fuel-logs')
        .send({
          vehicle_number: 'KA-05-FL0001',
          meter_reading: 10_300,
          filled_liters: 25,
          place: 'Depot A',
          transaction_date: '2026-08-23',
          transaction_time: '09:45',
        }),
      ctx.token,
    );

    expect(res.status).toBe(201);
    expect(res.body.previous_meter_reading).toBe(10_000);
    expect(res.body.calculated_distance).toBe(300);
    expect(res.body.calculated_efficiency).toBeCloseTo(12);
    expect(res.body.transaction_time).toBe('09:45:00');

    const vehicle = await authed(
      request(ctx.app).get('/api/v1/vehicles/KA-05-FL0001'),
      ctx.token,
    );
    expect(vehicle.body.current_meter_reading).toBe(10_300);
  });

  it('rejects a meter reading lower than the last one', async () => {
    await seedVehicle(ctx, 10_000);

    const res = await authed(
      request(ctx.app)
        .post('/api/v1/fuel-logs')
        .send({
          vehicle_number: 'KA-05-FL0001',
          meter_reading: 9_900,
          filled_liters: 20,
          place: 'Depot A',
          transaction_date: '2026-08-23',
          transaction_time: '10:00',
        }),
      ctx.token,
    );
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('UNPROCESSABLE');
  });

  it('rejects unknown vehicles', async () => {
    const res = await authed(
      request(ctx.app)
        .post('/api/v1/fuel-logs')
        .send({
          vehicle_number: 'GHOST-01',
          meter_reading: 100,
          filled_liters: 5,
          place: 'Depot A',
          transaction_date: '2026-08-23',
          transaction_time: '10:00',
        }),
      ctx.token,
    );
    expect(res.status).toBe(422);
  });

  it('lists recent logs flattened with the vehicle number', async () => {
    await seedVehicle(ctx, 0);

    await authed(
      request(ctx.app)
        .post('/api/v1/fuel-logs')
        .send({
          vehicle_number: 'KA-05-FL0001',
          meter_reading: 100,
          filled_liters: 10,
          place: 'Depot A',
          transaction_date: '2026-08-23',
          transaction_time: '08:00',
        }),
      ctx.token,
    );

    const res = await authed(
      request(ctx.app).get('/api/v1/fuel-logs/recent?place=Depot%20A&limit=5'),
      ctx.token,
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].vehicles).toBe('KA-05-FL0001');
  });

  it('returns the last log via fuel_logs_with_vehicle view', async () => {
    await seedVehicle(ctx, 500);
    await authed(
      request(ctx.app)
        .post('/api/v1/fuel-logs')
        .send({
          vehicle_number: 'KA-05-FL0001',
          meter_reading: 600,
          filled_liters: 8,
          place: 'Depot A',
          transaction_date: '2026-08-23',
          transaction_time: '12:00',
        }),
      ctx.token,
    );

    const res = await authed(
      request(ctx.app).get('/api/v1/fuel-logs/last?vehicleNumber=KA-05-FL0001'),
      ctx.token,
    );
    expect(res.status).toBe(200);
    expect(res.body.meter_reading).toBe(600);
    expect(res.body.vehicle_number).toBe('KA-05-FL0001');
  });

  it('filters logs by date range [from, to)', async () => {
    await seedVehicle(ctx, 1_000);
    await authed(
      request(ctx.app)
        .post('/api/v1/fuel-logs')
        .send({
          vehicle_number: 'KA-05-FL0001',
          meter_reading: 1_100,
          filled_liters: 5,
          place: 'Depot A',
          transaction_date: '2026-07-31',
          transaction_time: '06:00',
        }),
      ctx.token,
    );
    await authed(
      request(ctx.app)
        .post('/api/v1/fuel-logs')
        .send({
          vehicle_number: 'KA-05-FL0001',
          meter_reading: 1_200,
          filled_liters: 5,
          place: 'Depot A',
          transaction_date: '2026-08-02',
          transaction_time: '07:00',
        }),
      ctx.token,
    );

    const res = await authed(
      request(ctx.app).get('/api/v1/fuel-logs?from=2026-08-01&to=2026-08-03'),
      ctx.token,
    );
    expect(res.status).toBe(200);
    expect(res.body.map((r: { transaction_date: string }) => r.transaction_date)).toEqual([
      '2026-08-02',
    ]);
  });
});
