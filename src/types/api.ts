/**
 * Centralized API types mirroring the backend's response envelopes.
 * Domain models live in `src/types/models.ts`.
 */

/** Standard error envelope returned by the backend for non-2xx responses. */
export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

/** Auth token pair issued by POST /auth/login and POST /auth/refresh. */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Response of POST /auth/login. */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    place: string;
    name: string | null;
  };
}
