import React, { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../../src/components/ScreenContainer';
import AppCard from '../../../src/components/AppCard';
import PrimaryButton from '../../../src/components/PrimaryButton';
import BrandTagline from '../../../src/components/BrandTagline';
import { useWorkout } from '../../../src/context/WorkoutContext';
import { useRuns } from '../../../src/context/RunContext';
import { useHybridSessions } from '../../../src/context/HybridContext';
import { useProfile } from '../../../src/context/ProfileContext';
import { useActivityFeed } from '../../../src/context/ActivityFeedContext';
import { colors, fontSize, fontWeight, gradients, radius, spacing } from '../../../src/theme/theme';
import {
  buildActivityFeed,
  buildShareText,
} from '../../../src/utils/activityFeed';
import { getFastestSegment, getSlowestSegment, formatSegmentTime } from '../../../src/utils/hybridStats';
import type { ActivityFeedItem, ActivityFeedType } from '../../../src/types';

export default function SharePreviewScreen() {
  const { type, id } = useLocalSearchParams<{ type?: string; id?: string }>();
  const { history, historyLoaded } = useWorkout();
  const { runs, runsLoaded } = useRuns();
  const { hybridSessions, hybridSessionsLoaded } = useHybridSessions();
  const { profile } = useProfile();
  const { getActivityBySource } = useActivityFeed();
  const cardRef = useRef<View>(null);
  const [exporting, setExporting] = useState(false);

  const activityType = normalizeActivityType(type);
  const activity = useMemo(() => {
    if (!activityType || !id) return undefined;
    const freshActivity = buildActivityFeed(history, runs, hybridSessions).find(
      (item) => item.type === activityType && item.sourceId === id
    );
    if (freshActivity) return freshActivity;

    const sourceLoaded =
      activityType === 'workout'
        ? historyLoaded
        : activityType === 'run'
        ? runsLoaded
        : hybridSessionsLoaded;

    return sourceLoaded ? undefined : getActivityBySource(activityType, id);
  }, [
    activityType,
    getActivityBySource,
    history,
    historyLoaded,
    hybridSessions,
    hybridSessionsLoaded,
    id,
    runs,
    runsLoaded,
  ]);

  const hybridSegmentHighlights = useMemo(() => {
    if (activityType !== 'hybrid' || !id) return [];
    const session = hybridSessions.find((item) => item.id === id);
    if (!session) return [];

    const fastest = getFastestSegment([session]);
    const slowest = getSlowestSegment([session]);
    return [
      fastest ? { label: 'Fastest Segment', value: `${fastest.name} • ${formatSegmentTime(fastest.durationSeconds)}` } : undefined,
      slowest ? { label: 'Slowest Segment', value: `${slowest.name} • ${formatSegmentTime(slowest.durationSeconds)}` } : undefined,
    ].filter(Boolean) as { label: string; value: string }[];
  }, [activityType, hybridSessions, id]);

  const handleShareImage = async () => {
    if (!activity || exporting) return;

    setExporting(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your ReviveX recap',
        });
      } else {
        Alert.alert('Share unavailable', 'Image sharing is not available on this device.');
      }
    } catch {
      Alert.alert('Export failed', 'ReviveX could not create the share image.');
    } finally {
      setExporting(false);
    }
  };

  const handleShareText = async () => {
    if (!activity) return;

    try {
      await Share.share({
        message: buildShareText(activity, profile?.displayName),
      });
    } catch {
      Alert.alert('Share unavailable', 'ReviveX could not open the device share sheet.');
    }
  };

  if (!activity) {
    return (
      <ScreenContainer>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <AppCard style={{ marginTop: spacing.lg }}>
          <Text style={styles.emptyTitle}>Activity not found</Text>
          <Text style={styles.emptyText}>
            This share card can’t be created because the activity may have been deleted.
          </Text>
          <PrimaryButton
            label="Back"
            variant="outline"
            onPress={() => router.back()}
            style={{ marginTop: spacing.lg }}
          />
        </AppCard>
      </ScreenContainer>
    );
  }

  const ownerName = profile?.displayName?.trim() || 'ReviveX Athlete';
  const username = profile?.username?.trim();

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Share Card</Text>
          <Text style={styles.headerSub}>Private recap preview.</Text>
        </View>
      </View>

      <View ref={cardRef} collapsable={false} style={styles.cardShell}>
        <LinearGradient
          colors={['rgba(0, 180, 179, 0.20)', 'rgba(198, 255, 0, 0.12)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.recapHeader}>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brandText}>Revive</Text>
              <Text style={styles.brandX}>X</Text>
            </View>
            <BrandTagline style={styles.tagline} />
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{activity.chipLabel}</Text>
          </View>
        </View>

        <View style={styles.ownerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{ownerName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ownerName}>{ownerName}</Text>
            {username ? <Text style={styles.username}>@{username}</Text> : null}
          </View>
        </View>

        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activityDate}>{activity.dateLabel}</Text>
        <Text style={styles.activitySummary}>{activity.subtitle}</Text>

        <View style={styles.statGrid}>
          {[...activity.stats, ...hybridSegmentHighlights].slice(0, 6).map((stat) => (
            <View key={stat.label} style={styles.recapStat}>
              <Text style={styles.recapStatValue} numberOfLines={1}>
                {stat.value}
              </Text>
              <Text style={styles.recapStatLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Lift.</Text>
          <Text style={[styles.footerText, { color: colors.accentTeal }]}>Run.</Text>
          <Text style={[styles.footerText, { color: colors.accentLime }]}>Revive.</Text>
        </View>
      </View>

      <PrimaryButton
        label={exporting ? 'Creating Image...' : 'Share Image'}
        variant="primary"
        onPress={handleShareImage}
        style={{ marginTop: spacing.lg }}
      />
      <PrimaryButton
        label="Share Text"
        variant="outline"
        onPress={handleShareText}
        style={{ marginTop: spacing.md }}
      />
      <PrimaryButton
        label="Back to Activity"
        variant="outline"
        onPress={() => router.push('/activity')}
        style={{ marginTop: spacing.md }}
      />
    </ScreenContainer>
  );
}

function normalizeActivityType(value?: string): ActivityFeedType | undefined {
  if (value === 'workout' || value === 'run' || value === 'hybrid') return value;
  return undefined;
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
  },
  headerSub: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  cardShell: {
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.42,
    shadowRadius: 18,
    elevation: 6,
  },
  recapHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandText: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    fontStyle: 'italic',
    letterSpacing: 0,
  },
  brandX: {
    color: gradients.revive[1],
    fontSize: fontSize.xl + 4,
    fontWeight: fontWeight.heavy,
    fontStyle: 'italic',
    letterSpacing: 0,
    transform: [{ skewX: '-8deg' }],
  },
  tagline: {
    marginTop: spacing.xs,
  },
  typeBadge: {
    maxWidth: 132,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 179, 0.35)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(15, 17, 20, 0.35)',
  },
  typeBadgeText: {
    color: colors.accentTeal,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(198, 255, 0, 0.11)',
    borderWidth: 1,
    borderColor: 'rgba(198, 255, 0, 0.28)',
  },
  avatarText: {
    color: colors.accentLime,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
  },
  ownerName: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  username: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  activityTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    marginTop: spacing.xl,
  },
  activityDate: {
    color: colors.accentTeal,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
  },
  activitySummary: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  recapStat: {
    width: '47%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: 'rgba(15, 17, 20, 0.46)',
    padding: spacing.md,
  },
  recapStatValue: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
  },
  recapStatLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
  },
  footerText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    fontStyle: 'italic',
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
