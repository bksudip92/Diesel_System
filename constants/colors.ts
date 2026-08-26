/** Centralized color palette — import from here, never hardcode. */
export const colors = {
  primary: '#2563eb',
  primaryPressed: '#1d4ed8',
  primaryDisabled: '#93c5fd',

  background: '#f5f5f5',
  surface: '#ffffff',
  surfaceAlt: '#f9fafb',

  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textInverse: '#ffffff',

  border: '#e5e7eb',
  divider: '#f0f0f0',

  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#007AFF',

  accent: '#007AFF',
  accentLight: '#eff6ff',
  accentBorder: '#bfdbfe',
  accentText: '#1e40af',
} as const;
