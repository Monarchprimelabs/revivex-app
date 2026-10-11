import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, fontFamily, fontSize, spacing } from '@revivex/design-system';

export default function TopBar({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.bar}>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.btn} testID="topbar-back" accessibilityLabel="Back">
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.btn}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
  btn: { width: 44, alignItems: 'flex-end' },
  title: { color: colors.textPrimary, fontSize: fontSize.lg, fontFamily: fontFamily.bold },
});
