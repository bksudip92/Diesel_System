import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  authed,
  createTestContext,
  resetData,
  teardownTestContext,
  type TestContext,
} from './helpers.js';

describe('reports', () => {
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

  async function seedLog(
    ctx: TestContext,
    date: string,
    liters: number,
  ): Promise<void> {
    const create = await authed(
      request(ctx.app)
        .post('/api/v1/vehicles')
        .send({
          vehicle_number: `KA-09-${date.replaceAll('-', '')}`,
          vehicle_name: 'Rig',
          vehicle_type: 'Truck',
          vehicle_class: 'Heavy',
          place: 'Depot A',
          current_meter_reading: 0,
          permitted_liters: 100,
        }),
      ctx.token,
    );
    expect(create.status).toBe(201);

    const log = await authed(
      request(ctx.app)
        .post('/api/v1/fuel-logs')
        .send({
          vehicle_number: `KA-09-${date.replaceAll('-', '')}`,
          meter_reading: 10,
          filled_liters: liters,
          place: 'Depot A',
          transaction_date: date,
          transaction_time: '06:00',
        }),
      ctx.token,
    );
    expect(log.status).toBe(201);
  }

  it('refresh aggregates a month and upserts idempotently', async () => {
    await seedLog(ctx, '2026-07-05', 20);
    await seedLog(ctx, '2026-07-20', 30);
    // Out-of-range log — must not be counted.
    await seedLog(ctx, '2026-08-01', 999);

    const first = await authed(
      request(ctx.app)
        .post('/api/v1/reports/monthly/refresh')
        .send({ firstDatePrev: '2026-07-01', lastDatePrev: '2026-08-01', period: 'July' }),
      ctx.token,
    );
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({
      month_name: 'July',
      total_diesel: 50,
      total_fills: 2,
    });

    // Re-running must update the same row, not duplicate.
    const again = await authed(
      request(ctx.app)
        .post('/api/v1/reports/monthly/refresh')
        .send({ firstDatePrev: '2026-07-01', lastDatePrev: '2026-08-01', period: 'July' }),
      ctx.token,
    );
    expect(again.body.id).toBe(first.body.id);

    const list = await authed(request(ctx.app).get('/api/v1/reports/monthly'), ctx.token);
    expect(list.body).toHaveLength(1);
  });

  it('fetches a monthly report by name and 404s otherwise', async () => {
    await authed(
      request(ctx.app)
        .post('/api/v1/reports/monthly/refresh')
        .send({ firstDatePrev: '2026-06-01', lastDatePrev: '2026-07-01', period: 'June' }),
      ctx.token,
    );

    const found = await authed(
      request(ctx.app).get('/api/v1/reports/monthly/June'),
      ctx.token,
    );
    expect(found.status).toBe(200);
    expect(found.body.month_name).toBe('June');

    const missing = await authed(
      request(ctx.app).get('/api/v1/reports/monthly/Nosember'),
      ctx.token,
    );
    expect(missing.status).toBe(404);
  });

  it('lists yearly reports', async () => {
    const res = await authed(request(ctx.app).get('/api/v1/reports/yearly'), ctx.token);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
