import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, radius, spacing } from '../../theme/theme';

/**
 * Sticky rest countdown shown above the bottom of the Active Workout
 * screen after a set is completed.
 */
export default function RestTimerBar({
  secondsLeft,
  totalSeconds,
  onAddTime,
  onSkip,
}: {
  secondsLeft: number;
  totalSeconds: number;
  onAddTime: () => void;
  onSkip: () => void;
}) {
  const percent =
    totalSeconds > 0 ? Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100)) : 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <View style={styles.row}>
        <View style={styles.labelWrap}>
          <Ionicons name="hourglass-outline" size={16} color={colors.accentTeal} />
          <Text style={styles.label}>Rest</Text>
          <Text style={styles.time}>
            {minutes}:{String(seconds).padStart(2, '0')}
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={onAddTime} hitSlop={8} style={styles.actionBtn}>
            <Text style={styles.actionText}>+15s</Text>
          </Pressable>
          <Pressable onPress={onSkip} hitSlop={8} style={[styles.actionBtn, styles.skipBtn]}>
            <Text style={[styles.actionText, styles.skipText]}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  track: {
    height: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  fill: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accentTeal,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  time: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceAlt,
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  skipBtn: {
    borderColor: colors.accentTeal,
    backgroundColor: 'rgba(0, 180, 179, 0.10)',
  },
  skipText: {
    color: colors.accentTeal,
  },
});
