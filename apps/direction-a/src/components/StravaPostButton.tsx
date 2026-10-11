import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StravaActivityKind } from '@revivex/backend';
import { PrimaryButton, colors, fontSize, spacing } from '@revivex/design-system';
import { useStrava } from '../strava/StravaContext';

/** "Post to Strava" for a logged activity. Renders nothing unless Strava is connected. */
export default function StravaPostButton({ kind, clientId }: { kind: StravaActivityKind; clientId: string }) {
  const strava = useStrava();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  if (strava.status !== 'connected') return null;

  const existing = strava.pushFor(kind, clientId);
  const inFlight = existing && (existing.status === 'queued' || existing.status === 'uploading' || existing.status === 'processing');
  const label = existing?.status === 'done' ? 'Posted to Strava' : inFlight ? 'Posting to Strava…' : existing?.status === 'failed' ? 'Retry Strava post' : 'Post to Strava';

  const onPress = async () => {
    setBusy(true);
    setNote(null);
    const message = await strava.postActivity(kind, clientId);
    setNote(message);
    setBusy(false);
  };

  return (
    <View style={styles.wrap} testID="strava-post">
      <PrimaryButton label={label} variant="outline" onPress={() => void onPress()} loading={busy} disabled={existing?.status === 'done' || Boolean(inFlight)} />
      {note ? <Text style={styles.note}>{note}</Text> : existing?.status === 'failed' && existing.error ? <Text style={[styles.note, styles.error]}>{existing.error}</Text> : null}
      <Text style={styles.compat}>Compatible with Strava</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md },
  note: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.sm, textAlign: 'center' },
  error: { color: colors.danger },
  compat: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 6, textAlign: 'center' },
});
