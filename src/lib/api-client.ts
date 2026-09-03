import { ApiErrorBody } from '@/src/types/api';
import { env } from '@/src/lib/env';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  storeTokens,
} from '@/src/lib/secure-storage';
import { debugLog } from '@/src/lib/debug';

/** Thrown for every non-2xx API response. `code` matches the backend error codes. */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiRequestError';
  }
}

export async function refreshSession(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${env.apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      await clearTokens();
      return false;
    }

    const body = (await res.json()) as { accessToken: string; refreshToken: string };
    await storeTokens(body);
    return true;
  } catch {
    // Network failure during refresh — keep tokens so the next call can retry.
    return false;
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method?: Method;
  body?: unknown;
  /**
   * Skip auth header + refresh handling (used by login/refresh themselves).
   */
  anonymous?: boolean;
  /** Optional per-request abort signal. */
  signal?: AbortSignal;
}

/**
 * Core request helper: attaches the bearer token, parses the JSON envelope,
 * transparently retries once after a token refresh on 401, and throws
 * `ApiRequestError` for non-2xx responses.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, anonymous = false, signal } = options;

  const doFetch = async (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    return fetch(`${env.apiUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  };

  let token = anonymous ? null : await getAccessToken();
  let res = await doFetch(token);

  if (res.status === 401 && !anonymous) {
    debugLog('401 received — attempting token refresh');
    const refreshed = await refreshSession();
    if (refreshed) {
      token = await getAccessToken();
      res = await doFetch(token);
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const json = (await res.json().catch(() => null)) as ApiErrorBody | null;

  if (!res.ok) {
    throw new ApiRequestError(
      res.status,
      json?.error?.code ?? 'UNKNOWN',
      json?.error?.message ?? `Request failed (${res.status})`,
    );
  }

  return json as T;
}
