import request from 'supertest';
import type { Express } from 'express';
import { loadEnv, type Env } from '../src/config/env.js';
import { getPrisma } from '../src/db/prisma.js';
import { createApp } from '../src/app.js';
import type { PrismaClient } from '../src/generated/prisma/client.js';

export interface TestContext {
  app: Express;
  env: Env;
  prisma: PrismaClient;
  token: string;
}

const TEST_USER = {
  id: 'test-user-0001',
  email: 'tester@example.com',
  place: 'Depot A',
  name: 'API Tester',
};

export async function createTestContext(): Promise<TestContext> {
  const env = loadEnv();
  const prisma = getPrisma(env.DATABASE_URL);

  // Clean slate for each test file.
  await prisma.refreshToken.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.monthlyReport.deleteMany();
  await prisma.yearlyReport.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      id: TEST_USER.id,
      email: TEST_USER.email,
      place: TEST_USER.place,
      name: TEST_USER.name,
    },
  });

  const app = createApp(env, { prisma });

  // Obtain a token through the real login flow — but the user has no
  // password set; insert a known bcrypt hash directly.
  const bcrypt = await import('bcryptjs');
  await prisma.user.update({
    where: { id: TEST_USER.id },
    data: { password_hash: bcrypt.hashSync('secret123', 4) },
  });

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: TEST_USER.email, password: 'secret123' });

  return { app, env, prisma, token: loginRes.body.accessToken as string };
}

export async function teardownTestContext(ctx: TestContext): Promise<void> {
  await ctx.prisma.$disconnect();
}

/**
 * Wipes domain data between tests while keeping the seeded user
 * (so issued tokens stay valid).
 */
export async function resetData(prisma: PrismaClient): Promise<void> {
  await prisma.refreshToken.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.monthlyReport.deleteMany();
  await prisma.yearlyReport.deleteMany();
}

export function authed(req: request.Test, token: string): request.Test {
  return req.set('Authorization', `Bearer ${token}`);
}

export { TEST_USER };
