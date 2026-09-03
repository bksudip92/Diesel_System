import React from 'react';
import { apiFetch, ApiRequestError } from '@/src/lib/api-client';
import { clearTokens, getRefreshToken, storeTokens } from '@/src/lib/secure-storage';
import type { AuthResponse } from '@/src/types/api';
import type { UserProfile } from '@/src/types/models';

/**
 * Auth feature API. Only this module knows the auth endpoints' wire format;
 * the provider and screens depend on the returned domain models.
 */

/** Logs in and persists the token pair. Throws ApiRequestError on bad credentials. */
export async function login(email: string, password: string): Promise<UserProfile> {
  const res = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    anonymous: true,
  });

  await storeTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });

  return {
    id: res.user.id,
    email: res.user.email,
    place: res.user.place,
    name: res.user.name ?? undefined,
  };
}

/** Server-side logout (best-effort) plus local token cleanup. */
export async function logout(refreshToken: string): Promise<void> {
  try {
    await apiFetch('/auth/logout', {
      method: 'POST',
      body: { refreshToken },
    });
  } catch {
    // Best-effort — the caller always clears local state.
  }
  await clearTokens();
}

export { getRefreshToken, ApiRequestError };

/** Fetches the signed-in user's profile. */
export async function fetchProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/me');
}
