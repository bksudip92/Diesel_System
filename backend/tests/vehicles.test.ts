import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  authed,
  createTestContext,
  resetData,
  teardownTestContext,
  type TestContext,
} from './helpers.js';

const VEHICLE = {
  vehicle_number: 'KA-01-AB1234',
  vehicle_name: 'Hauler',
  vehicle_type: 'Truck',
  vehicle_class: 'Heavy',
  place: 'Depot A',
  current_meter_reading: 5000,
  permitted_liters: 40,
};

describe('vehicles', () => {
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

  it('creates a vehicle', async () => {
    const res = await authed(
      request(ctx.app).post('/api/v1/vehicles').send(VEHICLE),
      ctx.token,
    );
    expect(res.status).toBe(201);
    expect(res.body.vehicle_number).toBe(VEHICLE.vehicle_number);
  });

  it('rejects duplicate vehicle numbers with 409', async () => {
    await authed(request(ctx.app).post('/api/v1/vehicles').send(VEHICLE), ctx.token);
    const res = await authed(
      request(ctx.app).post('/api/v1/vehicles').send({ ...VEHICLE, vehicle_name: 'Copy' }),
      ctx.token,
    );
    expect(res.status).toBe(409);
  });

  it('lists vehicles and filters by place', async () => {
    await authed(request(ctx.app).post('/api/v1/vehicles').send(VEHICLE), ctx.token);
    await authed(
      request(ctx.app)
        .post('/api/v1/vehicles')
        .send({
          ...VEHICLE,
          vehicle_number: 'KA-02-CD5678',
          place: 'Depot B',
        }),
      ctx.token,
    );

    const all = await authed(request(ctx.app).get('/api/v1/vehicles'), ctx.token);
    expect(all.body).toHaveLength(2);

    const filtered = await authed(
      request(ctx.app).get('/api/v1/vehicles?place=Depot%20B'),
      ctx.token,
    );
    expect(filtered.body).toHaveLength(1);
    expect(filtered.body[0].vehicle_number).toBe('KA-02-CD5678');
  });

  it('fetches one vehicle by number via the view', async () => {
    await authed(request(ctx.app).post('/api/v1/vehicles').send(VEHICLE), ctx.token);

    const res = await authed(
      request(ctx.app).get(`/api/v1/vehicles/${VEHICLE.vehicle_number}`),
      ctx.token,
    );
    expect(res.status).toBe(200);
    expect(res.body.current_meter_reading).toBe(5000);
  });

  it('returns 404 for unknown vehicle', async () => {
    const res = await authed(
      request(ctx.app).get('/api/v1/vehicles/NOPE'),
      ctx.token,
    );
    expect(res.status).toBe(404);
  });

  it('updates a vehicle and returns the fresh row', async () => {
    await authed(request(ctx.app).post('/api/v1/vehicles').send(VEHICLE), ctx.token);

    const res = await authed(
      request(ctx.app)
        .patch(`/api/v1/vehicles/${VEHICLE.vehicle_number}`)
        .send({ permitted_liters: 55, department: 'Logistics' }),
      ctx.token,
    );
    expect(res.status).toBe(200);
    expect(res.body.permitted_liters).toBe(55);
    expect(res.body.department).toBe('Logistics');
    expect(res.body.vehicle_name).toBe(VEHICLE.vehicle_name);
  });
});
