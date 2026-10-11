import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppCard, PrimaryButton, ScreenContainer, colors, fontSize, fontWeight, spacing } from '@revivex/design-system';
import { formatRelativeDate } from '@revivex/core';
import { useStrava } from '../../src/strava/StravaContext';

/**
 * Strava connection screen. Push-first: Revive X posts activities you choose
 * and never reads your Strava data.
 */
export default function StravaScreen() {
  const strava = useStrava();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleConnect = async () => {
    setBusy(true);
    setMessage(null);
    const error = await strava.connect();
    setMessage(error ?? 'Strava connected.');
    setBusy(false);
  };

  const handleDisconnect = async () => {
    setBusy(true);
    const error = await strava.disconnect();
    setMessage(error ?? 'Strava disconnected.');
    setBusy(false);
  };

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.topBarBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Strava</Text>
        <View style={styles.topBarBtn} />
      </View>

      {strava.status === 'unconfigured' ? (
        <AppCard>
          <Text style={styles.cardTitle}>Cloud is not configured in this build</Text>
          <Text style={styles.cardBody}>Strava posting needs the cloud backend. Add the Supabase keys to app.json first.</Text>
        </AppCard>
      ) : strava.status === 'signedOut' ? (
        <AppCard>
          <Text style={styles.cardTitle}>Sign in first</Text>
          <Text style={styles.cardBody}>Strava connects to your Revive X account so posts work from any of your devices.</Text>
          <PrimaryButton label="Go to Account" onPress={() => router.push('/account')} style={{ marginTop: spacing.md }} />
        </AppCard>
      ) : strava.status === 'connected' && strava.connection ? (
        <>
          <AppCard elevated tint="brand">
            <Text style={styles.cardLabel}>Connected</Text>
            <Text style={styles.cardTitle}>Strava athlete {strava.connection.athleteId}</Text>
            <Text style={styles.cardBody}>Since {formatRelativeDate(strava.connection.connectedAt).toLowerCase()}. Scope: {strava.connection.scope || 'activity:write'}.</Text>
          </AppCard>
          <Text style={styles.sectionTitle}>Recent posts</Text>
          {strava.pushes.length === 0 ? (
            <AppCard>
              <Text style={styles.cardBody}>Nothing posted yet. Open any workout, run or hybrid session and tap "Post to Strava".</Text>
            </AppCard>
          ) : (
            strava.pushes.slice(0, 20).map((push) => (
              <AppCard key={push.id} style={{ marginBottom: spacing.sm }}>
                <View style={styles.row}>
                  <Ionicons
                    name={push.status === 'done' ? 'checkmark-circle-outline' : push.status === 'failed' ? 'alert-circle-outline' : 'time-outline'}
                    size={18}
                    color={push.status === 'done' ? colors.accentTeal : push.status === 'failed' ? colors.danger : colors.textSecondary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>
                      {push.activityKind} · {push.status}
                    </Text>
                    <Text style={styles.rowMeta}>{formatRelativeDate(push.createdAt)}</Text>
                    {push.error ? <Text style={styles.rowError}>{push.error}</Text> : null}
                  </View>
                </View>
              </AppCard>
            ))
          )}
          <Pressable onPress={() => void handleDisconnect()} style={styles.secondary} disabled={busy}>
            <Text style={styles.secondaryText}>Disconnect Strava</Text>
          </Pressable>
        </>
      ) : (
        <AppCard elevated tint="brand">
          <Text style={styles.cardTitle}>{strava.status === 'revoked' ? 'Strava access was revoked' : 'Post your sessions to Strava'}</Text>
          <Text style={styles.cardBody}>
            Revive X posts the workouts, runs and hybrid sessions you choose. It never reads your Strava data and never shows Strava data to anyone else.
          </Text>
          <PrimaryButton label="Connect with Strava" onPress={() => void handleConnect()} loading={busy} style={{ marginTop: spacing.md }} />
        </AppCard>
      )}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Text style={styles.compat}>Compatible with Strava</Text>
      <View style={{ height: spacing.xxl }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
  topBarBtn: { width: 44 },
  topBarTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  sectionTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginTop: spacing.xl, marginBottom: spacing.md },
  cardLabel: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: 4 },
  cardTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginBottom: 6 },
  cardBody: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  rowTitle: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, textTransform: 'capitalize' },
  rowMeta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  rowError: { color: colors.danger, fontSize: fontSize.xs, marginTop: 4 },
  secondary: { alignItems: 'center', paddingVertical: spacing.lg },
  secondaryText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  message: { color: colors.accentTeal, fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.md },
  compat: { color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.lg },
});
