/**
 * Design tokens — the single source of truth for all styling.
 * Screens must import from here; hardcoded hex values are banned
 * (enforced in code review; previously 7/9 screens had ad-hoc colors).
 */

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

  /** Alert/warning card surfaces (fill-fuel summary). */
  warningSurface: '#fff667',
  warningBorder: '#fed7aa',
  warningTextStrong: '#9a3412',
  warningText: '#7c2d12',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: '700' as const, color: colors.textPrimary },
  heading: { fontSize: 20, fontWeight: '700' as const, color: colors.textPrimary },
  body: { fontSize: 16, fontWeight: '400' as const, color: colors.textPrimary },
  label: { fontSize: 14, fontWeight: '500' as const, color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textMuted },
} as const;

export const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
} as const;

export const theme = { colors, spacing, radius, typography, shadow } as const;
