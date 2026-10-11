import React from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { fontFamily } from '../fonts';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Selectable pill used for filters and single-choice inputs. */
export default function Chip({ label, selected = false, onPress, disabled, style, testID }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: Boolean(disabled) }}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.chipPressed, disabled && styles.chipDisabled, style]}
      testID={testID}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.accentTeal,
    backgroundColor: 'rgba(0, 180, 179, 0.14)',
  },
  chipPressed: { opacity: 0.8 },
  chipDisabled: { opacity: 0.4 },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
  },
  labelSelected: { color: colors.textPrimary },
});
