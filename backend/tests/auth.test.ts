import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  authed,
  createTestContext,
  teardownTestContext,
  TEST_USER,
  type TestContext,
} from './helpers.js';

describe('auth', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext();
  });

  beforeEach(async () => {
    await ctx.prisma.refreshToken.deleteMany();
  });

  afterAll(async () => {
    await teardownTestContext(ctx);
  });

  it('logs in with valid credentials', async () => {
    const res = await request(ctx.app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.user).toMatchObject({ email: TEST_USER.email, place: 'Depot A' });
  });

  it('rejects wrong password', async () => {
    const res = await request(ctx.app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: 'nope' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects malformed payloads', async () => {
    const res = await request(ctx.app).post('/api/v1/auth/login').send({ email: 'x' });
    expect(res.status).toBe(422);
  });

  it('rotates refresh tokens and revokes reused ones', async () => {
    const login = await request(ctx.app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: 'secret123' });
    const { refreshToken } = login.body;

    const first = await request(ctx.app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });
    expect(first.status).toBe(200);

    const reuse = await request(ctx.app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });
    expect(reuse.status).toBe(401);

    // The rotated token from the same family must now be revoked too.
    const second = await request(ctx.app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first.body.refreshToken });
    expect(second.status).toBe(401);
  });

  it('protects endpoints without a bearer token', async () => {
    const res = await request(ctx.app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });

  it('returns the profile for /users/me', async () => {
    const res = await authed(request(ctx.app).get('/api/v1/users/me'), ctx.token);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: TEST_USER.email, place: 'Depot A' });
  });

  it('logs out and invalidates the refresh token', async () => {
    const login = await request(ctx.app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: 'secret123' });

    const logout = await authed(
      request(ctx.app).post('/api/v1/auth/logout').send({
        refreshToken: login.body.refreshToken,
      }),
      ctx.token,
    );
    expect(logout.status).toBe(204);

    const reuse = await request(ctx.app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.refreshToken });
    expect(reuse.status).toBe(401);
  });
});
