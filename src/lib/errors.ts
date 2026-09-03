/**
 * Maps API errors to user-friendly messages. Screens should render these
 * instead of inventing their own Alert wording.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
      return 'Cannot reach the server. Check your connection and try again.';
    }
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

/** Convenience strings used across screens. */
export const MESSAGES = {
  listLoadFailed: 'Unable to load data. Please try again.',
  saveFailed: 'Unable to save. Please try again.',
  saved: 'Saved successfully.',
} as const;
