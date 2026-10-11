import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize } from '../theme/theme';
import { fontFamily } from '../fonts';

export type CloudStatus = 'local' | 'pending' | 'synced' | 'error';

const SPEC: Record<CloudStatus, { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }> = {
  synced: { icon: 'cloud-done-outline', label: 'Synced', color: colors.accentTeal },
  pending: { icon: 'cloud-upload-outline', label: 'Syncing', color: colors.textSecondary },
  error: { icon: 'cloud-offline-outline', label: 'Sync failed', color: colors.danger },
  local: { icon: 'phone-portrait-outline', label: 'On this device', color: colors.textMuted },
};

/** Presentational cloud status for a mirrored record. */
export default function CloudStatusChip({ status }: { status: CloudStatus }) {
  const spec = SPEC[status];
  return (
    <View style={styles.row} testID={`sync-badge-${status}`} accessibilityLabel={`Cloud status: ${spec.label}`}>
      <Ionicons name={spec.icon} size={13} color={spec.color} />
      <Text style={[styles.label, { color: spec.color }]}>{spec.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  label: { fontSize: fontSize.xs, fontFamily: fontFamily.semibold },
});
