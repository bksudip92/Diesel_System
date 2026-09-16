/**
 * In-memory ring buffer of recent API request/response pairs.
 *
 * Purpose: surface backend traffic on-screen (e.g. login screen debug
 * panel) without reaching for Flipper/Logcat. `lib/` never imports from
 * `features/` or `app/`, so this store lives here and `api-client.ts`
 * pushes into it; UI subscribes via `useApiDebugEntries()`.
 *
 * Entries are capped (default 25) and sensitive fields are redacted at the
 * recording site — never log raw passwords or tokens.
 */

import { useSyncExternalStore } from 'react';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface ApiDebugEntry {
  id: number;
  timestamp: string;
  method: HttpMethod;
  path: string;
  url: string;
  requestBody?: unknown;
  status: number | null;
  ok: boolean | null;
  durationMs: number;
  responseBody?: unknown;
  errorCode?: string;
  errorMessage?: string;
}

const MAX_ENTRIES = 25;
const SENSITIVE_KEYS = new Set(['password', 'accesstoken', 'refreshtoken', 'token']);

let nextId = 1;
let entries: ApiDebugEntry[] = [];
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

/** Deep-redact passwords/tokens so the on-screen panel is safe to screenshot. */
export function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : redactSensitive(v);
    }
    return out;
  }
  return value;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ApiDebugEntry[] {
  return entries;
}

/** React hook for the debug panel — re-renders whenever a request completes. */
export function useApiDebugEntries(): ApiDebugEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Called by `api-client.ts` after every completed request (success or error). */
export function recordApiDebugEntry(entry: Omit<ApiDebugEntry, 'id' | 'timestamp'>): void {
  const full: ApiDebugEntry = {
    ...entry,
    id: nextId++,
    timestamp: new Date().toISOString(),
  };
  entries = [full, ...entries].slice(0, MAX_ENTRIES);
  emit();
}

/** Clears the on-screen history (panel "Clear" button). */
export function clearApiDebugEntries(): void {
  entries = [];
  emit();
}
