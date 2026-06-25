import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, fontSize, fontWeight, spacing } from '../theme/theme';

interface BrandTaglineProps {
  style?: StyleProp<ViewStyle>;
}

export default function BrandTagline({ style }: BrandTaglineProps) {
  return (
    <View style={[styles.row, style]} accessibilityLabel="Lift. Run. Revive.">
      <Text style={[styles.word, styles.lift]}>Lift.</Text>
      <Text style={[styles.word, styles.run]}>Run.</Text>
      <Text style={[styles.word, styles.revive]}>Revive.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  word: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    fontStyle: 'italic',
    letterSpacing: 1.6,
  },
  lift: {
    color: colors.textPrimary,
  },
  run: {
    color: colors.accentTeal,
  },
  revive: {
    color: colors.accentLime,
  },
});
