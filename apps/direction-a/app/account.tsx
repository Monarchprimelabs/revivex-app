import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppCard, PrimaryButton, ScreenContainer, colors, fontSize, fontWeight, spacing } from '@revivex/design-system';
import { formatRelativeDate } from '@revivex/core';
import { deleteAccount, validateCredentials } from '@revivex/backend';
import { getSupabase } from '../src/social/supabase';
import { useSocial } from '../src/context/SocialContext';
import { useSync } from '../src/sync/SyncContext';

/**
 * Account & Sync
 * Sign in or create an account, see what is backed up, and force a sync.
 * The same email/password session powers Community.
 */
export default function AccountScreen() {
  const { status, session, signIn, signUp, signOut } = useSocial();
  const { cloudState, pendingCount, lastSyncAt, lastError, syncing, syncNow } = useSync();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    const client = getSupabase();
    if (!client) return;
    setDeleting(true);
    setMessage(null);
    const error = await deleteAccount(client);
    setDeleting(false);
    if (error) {
      setMessage({ tone: 'error', text: error });
      return;
    }
    setConfirmDelete(false);
    await signOut();
    setMessage({ tone: 'info', text: 'Your account and cloud data were deleted. Training data on this phone was kept.' });
  };

  const submit = async () => {
    const invalid = validateCredentials(email, password);
    if (invalid) {
      setMessage({ tone: 'error', text: invalid });
      return;
    }
    setBusy(true);
    setMessage(null);
    const error = mode === 'signIn' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (error) {
      setMessage({ tone: 'error', text: error });
    } else if (mode === 'signUp') {
      setMessage({
        tone: 'info',
        text: 'Account created. If this project requires email confirmation, confirm it and then sign in.',
      });
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.topBarBtn} testID="account-back">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Account & Sync</Text>
        <View style={styles.topBarBtn} />
      </View>

      {status === 'unconfigured' ? (
        <AppCard>
          <Text style={styles.cardTitle}>Cloud backup is not configured in this build</Text>
          <Text style={styles.cardBody}>
            Everything you log stays on this device. To turn on backup and sync, add the Supabase project URL and
            anon key to app.json under expo.extra and restart the app.
          </Text>
        </AppCard>
      ) : status === 'loading' ? (
        <AppCard>
          <Text style={styles.cardBody}>Checking your session…</Text>
        </AppCard>
      ) : session ? (
        <>
          <AppCard elevated tint="brand">
            <Text style={styles.cardLabel}>Signed in as</Text>
            <Text style={styles.cardTitle} testID="account-email-label">
              {session.user.email}
            </Text>
          </AppCard>

          <Text style={styles.sectionTitle}>Backup</Text>
          <AppCard>
            <Row
              icon={pendingCount > 0 ? 'cloud-upload-outline' : 'cloud-done-outline'}
              label={pendingCount > 0 ? `${pendingCount} change${pendingCount === 1 ? '' : 's'} waiting to sync` : 'All changes synced'}
              testID="account-pending"
            />
            <Row icon="time-outline" label={lastSyncAt ? `Last sync ${formatRelativeDate(lastSyncAt).toLowerCase()}` : 'No sync yet this session'} />
            {lastError ? <Row icon="alert-circle-outline" label={lastError} tone="error" /> : null}
            <Text style={styles.footnote}>Workouts sync now. Runs, hybrid sessions and routines follow in the next step.</Text>
            <View testID="account-sync-now">
              <PrimaryButton label="Sync now" onPress={() => void syncNow()} loading={syncing} disabled={cloudState !== 'active'} style={{ marginTop: spacing.md }} />
            </View>
          </AppCard>

          <Pressable onPress={() => void signOut()} style={styles.signOut} testID="account-signout">
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>

          <AppCard>
            <Text style={styles.cardTitle}>Delete account</Text>
            <Text style={styles.cardBody}>
              Removes your account and everything backed up to the cloud. Training data on this phone stays until you delete the app.
            </Text>
            {message && message.tone === 'error' ? <Text style={[styles.message, styles.messageError]}>{message.text}</Text> : null}
            {confirmDelete ? (
              <>
                <Text style={[styles.message, styles.messageError]}>This cannot be undone.</Text>
                <View testID="account-delete-confirm">
                  <PrimaryButton label="Yes, delete my account" onPress={() => void handleDeleteAccount()} loading={deleting} style={{ marginTop: spacing.md }} />
                </View>
                <Pressable onPress={() => setConfirmDelete(false)} style={styles.signOut}>
                  <Text style={styles.signOutText}>Keep my account</Text>
                </Pressable>
              </>
            ) : (
              <Pressable onPress={() => setConfirmDelete(true)} style={styles.signOut} testID="account-delete">
                <Text style={[styles.signOutText, { color: colors.danger }]}>Delete account</Text>
              </Pressable>
            )}
          </AppCard>
        </>
      ) : (
        <>
          <AppCard elevated tint="brand">
            <Text style={styles.cardTitle}>Back up your training</Text>
            <Text style={styles.cardBody}>
              Sign in to keep your workouts safe and pick them up on any phone. Logging never waits on the network.
            </Text>
          </AppCard>

          <View style={styles.segment}>
            {(['signIn', 'signUp'] as const).map((option) => (
              <Pressable
                key={option}
                onPress={() => {
                  setMode(option);
                  setMessage(null);
                }}
                style={[styles.segmentItem, mode === option && styles.segmentItemActive]}
                testID={`account-mode-${option}`}
              >
                <Text style={[styles.segmentText, mode === option && styles.segmentTextActive]}>
                  {option === 'signIn' ? 'Sign in' : 'Create account'}
                </Text>
              </Pressable>
            ))}
          </View>

          <AppCard>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              style={styles.input}
              testID="account-email"
            />
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
              style={styles.input}
              testID="account-password"
            />
            {message ? (
              <Text style={[styles.message, message.tone === 'error' ? styles.messageError : styles.messageInfo]} testID="account-message">
                {message.text}
              </Text>
            ) : null}
            <View testID="account-submit">
              <PrimaryButton label={mode === 'signIn' ? 'Sign in' : 'Create account'} onPress={() => void submit()} loading={busy} style={{ marginTop: spacing.md }} />
            </View>
          </AppCard>
        </>
      )}
      <View style={{ height: spacing.xxl }} />
    </ScreenContainer>
  );
}

function Row({ icon, label, tone, testID }: { icon: keyof typeof Ionicons.glyphMap; label: string; tone?: 'error'; testID?: string }) {
  const color = tone === 'error' ? colors.danger : colors.textSecondary;
  return (
    <View style={styles.row} testID={testID}>
      <Ionicons name={icon} size={18} color={tone === 'error' ? colors.danger : colors.accentTeal} />
      <Text style={[styles.rowText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  topBarBtn: { width: 44 },
  topBarTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  cardLabel: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: 4 },
  cardTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginBottom: 6 },
  cardBody: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  footnote: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  rowText: { fontSize: fontSize.sm, flex: 1 },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  segmentItemActive: { backgroundColor: colors.card },
  segmentText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  segmentTextActive: { color: colors.textPrimary },
  inputLabel: { color: colors.textSecondary, fontSize: fontSize.xs, marginBottom: 6, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSize.md,
  },
  message: { marginTop: spacing.md, fontSize: fontSize.sm, lineHeight: 20 },
  messageError: { color: colors.danger },
  messageInfo: { color: colors.accentTeal },
  signOut: { alignItems: 'center', paddingVertical: spacing.lg, marginTop: spacing.md },
  signOutText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});
