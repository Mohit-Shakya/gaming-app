/**
 * Design Tokens / Theme Constants
 * Centralized styling values to reduce inline style duplication.
 */

// Border Radius
export const radius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

// Spacing (in pixels - can be used as px or rem conversion)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

// Common Colors
export const colors = {
  // Primary
  primary: '#3b82f6',
  primaryLight: 'rgba(59, 130, 246, 0.1)',
  primaryBorder: 'rgba(59, 130, 246, 0.3)',

  // Success / Green
  success: '#22c55e',
  successLight: 'rgba(34, 197, 94, 0.1)',
  successBorder: 'rgba(34, 197, 94, 0.3)',

  // Warning / Amber
  warning: '#f59e0b',
  warningLight: 'rgba(245, 158, 11, 0.1)',
  warningBorder: 'rgba(245, 158, 11, 0.3)',

  // Error / Red
  error: '#ef4444',
  errorLight: 'rgba(239, 68, 68, 0.1)',
  errorBorder: 'rgba(239, 68, 68, 0.3)',

  // Info / Cyan
  info: '#06b6d4',
  infoLight: 'rgba(6, 182, 212, 0.1)',
  infoBorder: 'rgba(6, 182, 212, 0.3)',

  // Purple
  purple: '#a855f7',
  purpleLight: 'rgba(168, 85, 247, 0.1)',
  purpleBorder: 'rgba(168, 85, 247, 0.3)',

  // Backgrounds
  bgDark: '#0f172a',
  bgCard: 'rgba(15, 23, 42, 0.8)',
  bgModal: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(10, 15, 30, 0.98))',

  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.05)',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
} as const;

// Status Colors (for badges, status indicators)
export const statusColors = {
  'in-progress': { bg: colors.infoLight, text: colors.info, border: colors.infoBorder },
  'confirmed': { bg: colors.successLight, text: colors.success, border: colors.successBorder },
  'pending': { bg: colors.warningLight, text: colors.warning, border: colors.warningBorder },
  'completed': { bg: colors.primaryLight, text: colors.primary, border: colors.primaryBorder },
  'cancelled': { bg: colors.errorLight, text: colors.error, border: colors.errorBorder },
} as const;

// Shadow Presets
export const shadows = {
  sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
  md: '0 4px 8px rgba(0, 0, 0, 0.15)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.2)',
  xl: '0 16px 32px rgba(0, 0, 0, 0.25)',
  glow: (color: string) => `0 0 20px ${color}40`,
} as const;

// Transitions
export const transitions = {
  fast: 'all 0.15s ease',
  normal: 'all 0.2s ease',
  smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
