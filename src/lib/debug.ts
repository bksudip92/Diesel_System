/** Set this to true to enable verbose request logging in development. */
export const __DEV_LOGS = false;

/* istanbul ignore next — debug helper, not exercised in production paths */
export function debugLog(...args: unknown[]): void {
  if (__DEV_LOGS) {
    // eslint-disable-next-line no-console
    console.log('[api]', ...args);
  }
}
