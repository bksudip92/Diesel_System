import AsyncStorage from '@react-native-async-storage/async-storage';

// Android emulators reach the host machine at 10.0.2.2, not localhost.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000/api/v1';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export interface ApiError {
  status: number;
  code: string;
  message: string;
}

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

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function storeTokens(tokens: TokenPair): Promise<void> {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, tokens.accessToken],
    [REFRESH_TOKEN_KEY, tokens.refreshToken],
  ]);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Exchanges the stored refresh token for a fresh pair.
 * Returns true when a new access token was obtained.
 */
export async function refreshSession(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    await clearTokens();
    return false;
  }

  const body = (await res.json()) as TokenPair;
  await storeTokens(body);
  return true;
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: Method;
  body?: unknown;
  /**
   * Skip auth header + refresh handling (used by login/refresh themselves).
   */
  anonymous?: boolean;
}

/**
 * Core request helper: attaches the bearer token, parses the JSON envelope,
 * transparently retries once after a token refresh on 401, and throws
 * ApiRequestError for non-2xx responses.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, anonymous = false } = options;

  const doFetch = async (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let token = anonymous ? null : await getAccessToken();
  let res = await doFetch(token);

  if (res.status === 401 && !anonymous) {
    const refreshed = await refreshSession();
    if (refreshed) {
      token = await getAccessToken();
      res = await doFetch(token);
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const json = (await res.json().catch(() => null)) as
    | { error?: { code?: string; message?: string } }
    | null;

  if (!res.ok) {
    throw new ApiRequestError(
      res.status,
      json?.error?.code ?? 'UNKNOWN',
      json?.error?.message ?? `Request failed (${res.status})`,
    );
  }

  return json as T;
}
