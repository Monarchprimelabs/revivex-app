import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import PrimaryButton from '../src/components/PrimaryButton';
import { usePro } from '../src/context/ProContext';
import { notifySuccess, tapLight } from '../src/utils/haptics';
import { colors, fontSize, fontWeight, radius, spacing } from '../src/theme/theme';
import type { ProPackage } from '../src/monetization/purchases';

/**
 * ReviveX Pro paywall (Phase 50 — dark launch).
 * Unreachable from the UI until the RevenueCat key is configured, and no
 * feature is gated yet — this screen exists so flipping monetization on
 * later is a config change, not a build project.
 */

const PRO_FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }[] = [
  { icon: 'flash', title: 'HYROX Race Mode', sub: 'Full race simulations with per-station splits and race PRs' },
  { icon: 'calendar', title: 'Structured Programs', sub: 'Multi-week hybrid plans that mix lifting and running' },
  { icon: 'trending-up', title: 'Deep Analytics', sub: 'Full history, 1RM trends, and muscle-group breakdowns' },
  { icon: 'download', title: 'Data Export', sub: 'Your complete training history, yours to take anywhere' },
];

export default function ProScreen() {
  const { status, isPro, packages, purchase, restore, refresh } = usePro();
  const [busy, setBusy] = useState(false);

  const annual = packages.find((pkg) => pkg.packageType === 'ANNUAL');
  const monthly = packages.find((pkg) => pkg.packageType === 'MONTHLY');
  const [selected, setSelected] = useState<'ANNUAL' | 'MONTHLY'>('ANNUAL');

  const handlePurchase = async () => {
    const pkg: ProPackage | undefined = selected === 'ANNUAL' ? annual : monthly;
    if (!pkg || busy) return;
    setBusy(true);
    const result = await purchase(pkg);
    setBusy(false);
    if (result.isPro) {
      notifySuccess();
      Alert.alert('Welcome to Pro!', 'Everything is unlocked. Go earn it.', [
        { text: "Let's go", onPress: () => router.back() },
      ]);
    } else if (!result.cancelled) {
      Alert.alert('Purchase failed', 'Nothing was charged. Please try again.');
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    setBusy(true);
    const restored = await restore();
    setBusy(false);
    if (restored) {
      notifySuccess();
      Alert.alert('Restored', 'Your Pro subscription is active on this device.');
    } else {
      Alert.alert('Nothing to restore', 'No previous Pro purchase was found for this Apple ID.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.topBarBtn}>
          <Ionicons name="close" size={26} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.topBarBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>REVIVEX PRO</Text>
        <Text style={styles.title}>Train like it's race day.</Text>
        <Text style={styles.lead}>
          Logging is free forever. Pro unlocks the depth built for hybrid athletes.
        </Text>

        <View style={styles.featureCard}>
          {PRO_FEATURES.map((feature, idx) => (
            <View
              key={feature.title}
              style={[styles.featureRow, idx !== PRO_FEATURES.length - 1 && styles.featureDivider]}
            >
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={18} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSub}>{feature.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {isPro ? (
          <View style={styles.activeCard}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={styles.activeText}>Pro is active on this account.</Text>
          </View>
        ) : status === 'ready' && (annual || monthly) ? (
          <>
            <View style={styles.planRow}>
              {annual ? (
                <PlanCard
                  label="Annual"
                  price={annual.priceString}
                  per="per year"
                  badge="7-day free trial"
                  selected={selected === 'ANNUAL'}
                  onPress={() => {
                    tapLight();
                    setSelected('ANNUAL');
                  }}
                />
              ) : null}
              {monthly ? (
                <PlanCard
                  label="Monthly"
                  price={monthly.priceString}
                  per="per month"
                  selected={selected === 'MONTHLY'}
                  onPress={() => {
                    tapLight();
                    setSelected('MONTHLY');
                  }}
                />
              ) : null}
            </View>

            <PrimaryButton
              label={busy ? 'Working…' : 'Continue'}
              variant="primary"
              onPress={handlePurchase}
              style={{ marginTop: spacing.lg }}
            />
            <Pressable onPress={handleRestore} hitSlop={6}>
              <Text style={styles.restoreLink}>Restore Purchases</Text>
            </Pressable>
            <Text style={styles.legal}>
              Payment is charged to your Apple ID. Subscriptions renew automatically unless
              cancelled at least 24 hours before the end of the period, and can be managed or
              cancelled anytime in your App Store account settings.
            </Text>
          </>
        ) : (
          <View style={styles.pendingCard}>
            <Ionicons name="hourglass-outline" size={20} color={colors.textMuted} />
            <Text style={styles.pendingText}>
              {status === 'needs-dev-build'
                ? 'Plans load in the full app build.'
                : 'Pro plans are not available yet. Check back soon.'}
            </Text>
            <Pressable onPress={refresh} hitSlop={6}>
              <Text style={styles.restoreLink}>Refresh</Text>
            </Pressable>
          </View>
        )}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanCard({
  label,
  price,
  per,
  badge,
  selected,
  onPress,
}: {
  label: string;
  price: string;
  per: string;
  badge?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.planCard, selected && styles.planCardSelected]}
    >
      {badge ? (
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>{badge}</Text>
        </View>
      ) : null}
      <Text style={styles.planLabel}>{label}</Text>
      <Text style={styles.planPrice}>{price}</Text>
      <Text style={styles.planPer}>{per}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  topBarBtn: {
    width: 44,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
  },
  kicker: {
    color: colors.gold,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.6,
    marginTop: spacing.sm,
  },
  lead: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  featureCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  featureDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(198, 255, 0, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  featureSub: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 1,
  },
  planRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  planCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  planCardSelected: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(198, 255, 0, 0.06)',
  },
  planBadge: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.sm,
  },
  planBadgeText: {
    color: colors.background,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
  },
  planLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  planPrice: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    marginTop: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  planPer: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  restoreLink: {
    color: colors.tech,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  legal: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  activeText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  pendingCard: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  pendingText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
