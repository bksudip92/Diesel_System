import { z } from 'zod';

/**
 * Runtime-validated environment configuration.
 *
 * The app MUST fail fast with a readable message when the API URL is missing,
 * instead of silently falling back to `http://10.0.2.2:3000` (emulator-only),
 * which used to produce blank fuel-log places in real builds.
 */

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().trim().url().default('http://10.0.2.2:3000/api/v1'),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});

if (!parsed.success) {
  throw new Error(
    `[env] Invalid EXPO_PUBLIC_API_URL: "${String(process.env.EXPO_PUBLIC_API_URL)}". ` +
      'Set it in .env (see .env.example) before building the app.',
  );
}

export const env = {
  apiUrl: parsed.data.EXPO_PUBLIC_API_URL.replace(/\/+$/, ''),
} as const;
