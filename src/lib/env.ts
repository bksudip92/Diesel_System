/**
 * Runtime-validated environment configuration.
 *
 * Read lazily via `getApiUrl()` (not at module top level) so a missing or
 * malformed `EXPO_PUBLIC_API_URL` throws at request time — inside the
 * ErrorBoundary, with a readable message — instead of killing the whole
 * app during module load with a blank white screen.
 *
 * NOTE: an empty string (e.g. an unset-but-present CI secret) is treated as
 * missing. `z.string().url().default(...)` only defaults `undefined`, which
 * is why an empty value used to crash release builds on startup.
 */

const FALLBACK_API_URL = 'http://10.0.2.2:3000/api/v1'; // emulator-only

let cachedApiUrl: string | null = null;

export function getApiUrl(): string {
  if (cachedApiUrl) return cachedApiUrl;

  const raw = process.env.EXPO_PUBLIC_API_URL;

  if (!raw || !raw.trim()) {
    if (__DEV__) {
      console.warn(
        '[env] EXPO_PUBLIC_API_URL is not set — falling back to emulator-only ' +
          `${FALLBACK_API_URL}. Set it in .env (see .env.example) for real devices.`,
      );
    }
    cachedApiUrl = FALLBACK_API_URL;
    return cachedApiUrl;
  }

  try {
    cachedApiUrl = new URL(raw.trim()).toString().replace(/\/+$/, '');
    return cachedApiUrl;
  } catch {
    throw new Error(
      `[env] Invalid EXPO_PUBLIC_API_URL: "${raw}". ` +
        'Set it in .env (see .env.example) before building the app.',
    );
  }
}
