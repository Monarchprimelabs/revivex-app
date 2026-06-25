/**
 * ReviveX theme.
 * One central place for colors, spacing, font sizes, gradients, and glows.
 *
 * Color usage rules:
 *  - Dark neutrals carry most of the interface.
 *  - Teal supports active states, running, analytics, and links.
 *  - Lime supports progress, PRs, confirmations, and the energetic X feel.
 *  - The teal-to-lime gradient is reserved for important CTAs and highlights.
 */

export const colors = {
  // Core ReviveX neutrals
  background: '#0F1114',
  surface: '#1A1D21',
  card: '#2A2F36',
  surfaceAlt: '#20242A',
  surfaceElevated: '#242A31',
  border: '#3A4048',
  borderSubtle: '#2A2F36',

  // Text
  text: '#F5F5F5',
  textPrimary: '#F5F5F5',
  textSecondary: '#AEB7BD',
  textMuted: '#687177',

  // ReviveX accents
  accentTeal: '#00B4B3',
  accentLime: '#C6FF00',
  accentGradientStart: '#00B4B3',
  accentGradientEnd: '#C6FF00',

  // Backward-compatible semantic aliases used across existing screens.
  primary: '#00B4B3',
  primaryDark: '#008F8D',
  gold: '#C6FF00',
  accent: '#C6FF00',
  accentWarm: '#86E700',
  tech: '#00B4B3',
  techCool: '#4DD8D6',
  techDeep: '#008F8D',

  // Status
  success: '#A7F432',
  danger: '#EF4444',
};

/**
 * Linear gradient stops, as paired [from, to] values.
 * Used by expo-linear-gradient when we layer subtle backgrounds.
 */
export const gradients = {
  // Subtle card lift for hero cards.
  cardElevated: ['#242A31', '#1A1D21'] as const,

  // Main ReviveX CTA gradient, slightly damped for app UI use.
  cta: ['#00B4B3', '#9EF000'] as const,
  revive: ['#00B4B3', '#9EF000'] as const,
  strength: ['#00B4B3', '#9EF000'] as const,

  // Analytics stays mostly teal.
  analytics: ['#00B4B3', '#4DD8D6'] as const,

  // Hybrid combines both brand accents.
  hybrid: ['#00B4B3', '#9EF000'] as const,

  // Background atmospheric tint at the top of screens.
  ambient: ['#1A1D21', '#0F1114'] as const,
};

/**
 * Soft "glow" tints — used as low-opacity backgrounds, halos,
 * or as a wash behind a stat to suggest premium light.
 */
export const glow = {
  tealFaint: 'rgba(0, 180, 179, 0.10)',
  tealStrong: 'rgba(0, 180, 179, 0.20)',
  limeFaint: 'rgba(198, 255, 0, 0.08)',
  limeStrong: 'rgba(198, 255, 0, 0.18)',
  successFaint: 'rgba(167, 244, 50, 0.12)',

  // Compatibility aliases.
  goldFaint: 'rgba(198, 255, 0, 0.08)',
  goldStrong: 'rgba(198, 255, 0, 0.18)',
  orangeFaint: 'rgba(0, 180, 179, 0.10)',
  cyanFaint: 'rgba(0, 180, 179, 0.10)',
  cyanStrong: 'rgba(0, 180, 179, 0.20)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};
