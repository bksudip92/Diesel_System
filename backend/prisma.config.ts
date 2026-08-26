import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/scripts/seed.ts',
  },
  datasource: {
    // Read directly from the environment (instead of the env() helper) so
    // commands that don't need a database — like `prisma generate` in Docker
    // builds — can run without DATABASE_URL being set.
    url: process.env.DATABASE_URL ?? '',
  },
});
