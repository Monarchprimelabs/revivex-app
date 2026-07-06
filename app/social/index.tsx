import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AppCard from '../../src/components/AppCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import { useSocial } from '../../src/context/SocialContext';
import { useProfile } from '../../src/context/ProfileContext';
import { colors, fontSize, fontWeight, glow, radius, spacing } from '../../src/theme/theme';

/**
 * Community (Phase 39): account + public profile foundation.
 * The Hevy-style feed (posts, likes, comments, following) lands next
 * phase on top of this.
 */
export default function CommunityScreen() {
  const { status, cloudProfile, signUp, signIn, signOut, saveCloudProfile } = useSocial();
  const { profile } = useProfile();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.topBarBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.topBarTitle}>Community</Text>
          <View style={styles.topBarBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {status === 'unconfigured' ? <UnconfiguredCard /> : null}
          {status === 'loading' ? (
            <AppCard>
              <Text style={styles.hint}>Connecting...</Text>
            </AppCard>
          ) : null}
          {status === 'signedOut' ? <AuthCard signUp={signUp} signIn={signIn} /> : null}
          {status === 'signedIn' ? (
            <SignedInView
              username={cloudProfile?.username}
              displayName={cloudProfile?.displayName || profile?.displayName || ''}
              onSaveProfile={saveCloudProfile}
              onSignOut={signOut}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function UnconfiguredCard() {
  return (
    <AppCard elevated tint="brand">
      <View style={styles.heroIcon}>
        <Ionicons name="people-outline" size={28} color={colors.accentTeal} />
      </View>
      <Text style={styles.heroTitle}>The ReviveX community is almost here</Text>
      <Text style={styles.heroText}>
        Share workouts, runs with route maps, and hybrid sessions. Follow friends, give
        likes, and talk training — Hevy-style, but built for hybrid athletes.
      </Text>
      <Text style={[styles.heroText, { marginTop: spacing.md }]}>
        Owner setup: create a free Supabase project, run docs/supabase/schema.sql, and add
        the project URL + anon key to app.json → expo.extra. This screen activates
        automatically.
      </Text>
    </AppCard>
  );
}

function AuthCard({
  signUp,
  signIn,
}: {
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
}) {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signUp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (!email.trim() || password.length < 8) {
      Alert.alert(
        'Check your details',
        'Enter your email and a password of at least 8 characters.'
      );
      return;
    }
    setBusy(true);
    const error = mode === 'signUp' ? await signUp(email, password) : await signIn(email, password);
    setBusy(false);
    if (error) {
      Alert.alert(mode === 'signUp' ? 'Sign up failed' : 'Sign in failed', error);
    } else if (mode === 'signUp') {
      Alert.alert(
        'Almost there',
        'Check your email for a confirmation link if required, then sign in.'
      );
      setMode('signIn');
    }
  };

  return (
    <AppCard elevated tint="brand">
      <Text style={styles.heroTitle}>
        {mode === 'signUp' ? 'Join the ReviveX community' : 'Welcome back'}
      </Text>
      <Text style={styles.heroText}>
        Your training data stays on your device — an account only powers sharing, follows,
        and the feed.
      </Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
      />
      <Text style={[styles.label, { marginTop: spacing.md }]}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholder="At least 8 characters"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
      />

      <PrimaryButton
        label={busy ? 'Working...' : mode === 'signUp' ? 'Create Account' : 'Sign In'}
        variant="primary"
        onPress={submit}
        style={{ marginTop: spacing.lg }}
      />
      <Pressable
        onPress={() => setMode(mode === 'signUp' ? 'signIn' : 'signUp')}
        hitSlop={8}
        style={{ marginTop: spacing.md }}
      >
        <Text style={styles.switchText}>
          {mode === 'signUp'
            ? 'Already have an account? Sign in'
            : 'New here? Create an account'}
        </Text>
      </Pressable>
    </AppCard>
  );
}

function SignedInView({
  username,
  displayName,
  onSaveProfile,
  onSignOut,
}: {
  username?: string;
  displayName: string;
  onSaveProfile: (username: string, displayName: string) => Promise<string | null>;
  onSignOut: () => Promise<void>;
}) {
  const [usernameDraft, setUsernameDraft] = useState(username ?? '');
  const [nameDraft, setNameDraft] = useState(displayName);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    const error = await onSaveProfile(usernameDraft, nameDraft);
    setBusy(false);
    if (error) {
      Alert.alert('Could not save', error);
    } else {
      Alert.alert('Profile saved', `You're @${usernameDraft.trim().toLowerCase()}.`);
    }
  };

  return (
    <>
      {username ? (
        <AppCard elevated tint="brand">
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(displayName || username).charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{displayName || username}</Text>
              <Text style={styles.profileUsername}>@{username}</Text>
            </View>
          </View>
          <View style={styles.countsRow}>
            <CountStat label="Posts" value="0" />
            <CountStat label="Followers" value="0" />
            <CountStat label="Following" value="0" />
          </View>
        </AppCard>
      ) : null}

      <AppCard style={{ marginTop: spacing.md }}>
        <Text style={styles.heroTitle}>
          {username ? 'Edit public profile' : 'Claim your username'}
        </Text>
        <Text style={styles.label}>Username</Text>
        <TextInput
          value={usernameDraft}
          onChangeText={setUsernameDraft}
          style={styles.input}
          placeholder="e.g. geo_lifts"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
        />
        <Text style={[styles.label, { marginTop: spacing.md }]}>Display name</Text>
        <TextInput
          value={nameDraft}
          onChangeText={setNameDraft}
          style={styles.input}
          placeholder="Shown on your posts"
          placeholderTextColor={colors.textMuted}
          maxLength={40}
        />
        <PrimaryButton
          label={busy ? 'Saving...' : username ? 'Save Profile' : 'Claim Username'}
          variant="primary"
          onPress={save}
          style={{ marginTop: spacing.lg }}
        />
      </AppCard>

      {username ? (
        <AppCard style={{ marginTop: spacing.md }}>
          <View style={styles.comingRow}>
            <Ionicons name="rocket-outline" size={20} color={colors.accentLime} />
            <Text style={styles.comingText}>
              The feed is next: share workouts, runs with route maps, and hybrid sessions —
              likes and comments included.
            </Text>
          </View>
        </AppCard>
      ) : null}

      <PrimaryButton
        label="Sign Out"
        variant="outline"
        onPress={onSignOut}
        style={{ marginTop: spacing.lg }}
      />
    </>
  );
}

function CountStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.countStat}>
      <Text style={styles.countValue}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  topBarBtn: {
    width: 44,
  },
  topBarTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glow.tealFaint,
    borderWidth: 1,
    borderColor: colors.accentTeal,
    marginBottom: spacing.md,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  heroText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  input: {
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
  },
  switchText: {
    color: colors.accentTeal,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glow.tealFaint,
    borderWidth: 1,
    borderColor: colors.accentTeal,
  },
  avatarText: {
    color: colors.accentTeal,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
  },
  profileName: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  profileUsername: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  countsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  countStat: {
    flex: 1,
  },
  countValue: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
  },
  countLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  comingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  comingText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
