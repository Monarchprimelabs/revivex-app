import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fontSize, spacing } from '../theme/theme';
import { fontFamily } from '../fonts';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

/**
 * SectionHeader
 * Used above lists/sections.
 * Optional right-side action like "See all".
 */
export default function SectionHeader({
  title,
  actionLabel,
  onActionPress,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
  },
  action: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
  },
});
