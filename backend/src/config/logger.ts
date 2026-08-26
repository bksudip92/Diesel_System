import { pino } from 'pino';

export function createLogger(level = 'info') {
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
