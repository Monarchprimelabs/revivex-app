import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, fontSize, fontWeight, radius, spacing, glow } from '../theme/theme';

type AccentColor =
  | 'primary'
  | 'accent'
  | 'accentWarm'
  | 'gold'
  | 'tech'
  | 'techCool'
  | 'success'
  | 'textPrimary';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: AccentColor;
  style?: StyleProp<ViewStyle>;
}

/**
 * StatCard
 * Displays a single metric: small label + large value.
 * Use `accent` to color the value for emphasis. The card also paints
 * a faint colored glow in the bottom-right that matches the accent,
 * giving each stat a subtle premium tint.
 *
 *   primary / tech                → teal performance stats
 *   gold / accent / accentWarm    → lime progress highlights
 *   success                       → PRs and positive momentum
 */
export default function StatCard({
  label,
  value,
  hint,
  accent = 'textPrimary',
  style,
}: StatCardProps) {
  // Pick a faint glow color that matches the accent family
  const glowColor =
    accent === 'tech' || accent === 'techCool'
      ? glow.cyanFaint
      : accent === 'gold' || accent === 'accent'
      ? glow.goldFaint
      : accent === 'primary' || accent === 'accentWarm'
      ? glow.orangeFaint
      : accent === 'success'
      ? glow.successFaint
      : 'transparent';

  return (
    <View style={[styles.card, style]}>
      <View style={[styles.glowOrb, { backgroundColor: glowColor }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: colors[accent] }]}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  glowOrb: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.5,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
