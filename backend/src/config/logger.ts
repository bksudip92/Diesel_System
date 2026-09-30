import { pino } from 'pino';

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * `LOG_LEVEL` is declared in `config/env.ts` but was never passed here, so the
 * level was permanently pinned to `info` and `debug`/`trace` could not be
 * switched on without editing source. Read it directly (and defensively —
 * an unrecognised value must not break boot) so the setting actually works.
 */
function resolveLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.trim().toLowerCase();
  return LOG_LEVELS.includes(raw as LogLevel) ? (raw as LogLevel) : 'info';
}

export function createLogger(level: LogLevel = resolveLevel()) {
  return pino({
    level,
    base: null,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  });
}

export type Logger = ReturnType<typeof createLogger>;

export const logger = createLogger();
