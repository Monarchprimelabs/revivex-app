import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useKeepAwake } from 'expo-keep-awake';
import PrimaryButton from '../../src/components/PrimaryButton';
import { useRuns } from '../../src/context/RunContext';
import { useProfile } from '../../src/context/ProfileContext';
import { colors, fontSize, fontWeight, radius, spacing } from '../../src/theme/theme';
import { formatDuration } from '../../src/utils/format';
import { formatPace } from '../../src/utils/runStats';
import {
  advanceTrack,
  compressRoute,
  createTrackState,
  currentPaceSecondsPerUnit,
  finalizeSplits,
  metersToDistance,
  type TrackState,
} from '../../src/utils/gpsTracking';
import {
  drainBackgroundFixes,
  startBackgroundTracking,
  stopBackgroundTracking,
} from '../../src/gps/backgroundLocation';
import type { DistanceUnit } from '../../src/types';

type Phase = 'requesting' | 'denied' | 'ready' | 'tracking' | 'paused';
type RunMode = 'outdoor' | 'indoor';

/**
 * GPS Run Tracker v1 (foreground).
 * Live distance, rolling pace, and auto-laps from real GPS fixes.
 * Keep the screen on while tracking — background tracking arrives with
 * the dev build phase.
 */
export default function TrackRunScreen() {
  useKeepAwake();
  const { addRun } = useRuns();
  const { profile } = useProfile();
  const unit: DistanceUnit = profile?.preferredDistanceUnit ?? 'mi';

  const [phase, setPhase] = useState<Phase>('ready');
  const [mode, setMode] = useState<RunMode>('outdoor');
  const [track, setTrack] = useState<TrackState>(createTrackState);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [indoorDistanceStr, setIndoorDistanceStr] = useState('');

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const [backgroundMode, setBackgroundMode] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  // Moving-time bookkeeping across pauses.
  const movingMsRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>('ready');
  phaseRef.current = phase;

  useEffect(() => {
    return () => {
      watchRef.current?.remove();
      stopBackgroundTracking();
    };
  }, []);

  // In background mode, drain fixes buffered by the background task.
  useEffect(() => {
    if (!backgroundMode || phase !== 'tracking') return;
    const handle = setInterval(() => {
      const fixes = drainBackgroundFixes();
      if (fixes.length === 0) return;
      setTrack((current) => {
        let next = current;
        for (const fix of fixes) next = advanceTrack(next, fix, unit);
        return next;
      });
    }, 1000);
    return () => clearInterval(handle);
  }, [backgroundMode, phase, unit]);

  // Elapsed (moving) time ticker.
  useEffect(() => {
    if (phase !== 'tracking') return;
    const handle = setInterval(() => {
      const live = segmentStartRef.current ? Date.now() - segmentStartRef.current : 0;
      setElapsedSec(Math.floor((movingMsRef.current + live) / 1000));
    }, 500);
    return () => clearInterval(handle);
  }, [phase]);

  const startWatching = useCallback(async () => {
    watchRef.current?.remove();
    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 2,
      },
      (position) => {
        if (phaseRef.current !== 'tracking') return;
        setTrack((current) =>
          advanceTrack(
            current,
            {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              t: position.timestamp,
              accuracy: position.coords.accuracy ?? undefined,
            },
            unit
          )
        );
      }
    );
  }, [unit]);

  const handleStart = useCallback(async () => {
    if (mode === 'outdoor') {
      // Location is only needed (and requested) for outdoor runs.
      setPhase('requesting');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPhase('denied');
        return;
      }
    }

    startedAtRef.current = Date.now();
    segmentStartRef.current = Date.now();
    setPhase('tracking');

    if (mode === 'outdoor') {
      // Prefer background updates (dev build); fall back to foreground watch.
      const background = await startBackgroundTracking();
      setBackgroundMode(background);
      if (!background) {
        await startWatching();
      }
    }
  }, [mode, startWatching]);

  const handlePause = useCallback(() => {
    if (segmentStartRef.current) {
      movingMsRef.current += Date.now() - segmentStartRef.current;
      segmentStartRef.current = null;
    }
    setPhase('paused');
  }, []);

  const handleResume = useCallback(() => {
    segmentStartRef.current = Date.now();
    // Reset the anchor so the paused gap doesn't count as movement.
    setTrack((current) => ({ ...current, lastFix: null, lapStartedAt: null }));
    setPhase('tracking');
  }, []);

  const handleFinish = useCallback(() => {
    const endedAt = Date.now();
    if (segmentStartRef.current) {
      movingMsRef.current += endedAt - segmentStartRef.current;
      segmentStartRef.current = null;
    }
    watchRef.current?.remove();
    stopBackgroundTracking();

    const durationSeconds = Math.max(1, Math.floor(movingMsRef.current / 1000));

    if (mode === 'indoor') {
      const indoorDistance = Number.parseFloat(indoorDistanceStr.replace(',', '.'));
      const run = addRun({
        title: 'Indoor Run',
        date: new Date(startedAtRef.current ?? endedAt).toISOString(),
        distance: Number.isFinite(indoorDistance) ? Math.max(0, indoorDistance) : 0,
        distanceUnit: unit,
        durationSeconds,
        runType: 'Treadmill',
        source: 'manual',
      });
      router.replace({ pathname: '/run/[id]', params: { id: run.id } });
      return;
    }

    const distance = metersToDistance(track.distanceMeters, unit);
    if (distance < 0.02) {
      Alert.alert('No distance recorded', 'Move a little further before finishing this run.', [
        { text: 'Keep Running', onPress: () => handleResume() },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
      return;
    }

    const run = addRun({
      title: 'Outdoor Run',
      date: new Date(startedAtRef.current ?? endedAt).toISOString(),
      distance,
      distanceUnit: unit,
      durationSeconds,
      runType: 'Outdoor',
      source: 'gps',
      splits: finalizeSplits(track, endedAt, unit),
      routePoints: compressRoute(track.points),
    });

    router.replace({ pathname: '/run/[id]', params: { id: run.id } });
  }, [addRun, handleResume, indoorDistanceStr, mode, track, unit]);

  const handleClose = useCallback(() => {
    if (phase === 'tracking' || phase === 'paused') {
      Alert.alert('Discard run?', 'Your GPS run in progress will be lost.', [
        { text: 'Keep Running', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            watchRef.current?.remove();
            stopBackgroundTracking();
            router.back();
          },
        },
      ]);
      return;
    }
    router.back();
  }, [phase]);

  const isIndoor = mode === 'indoor';
  const indoorDistance = Number.parseFloat(indoorDistanceStr.replace(',', '.')) || 0;
  const distance = isIndoor ? indoorDistance : metersToDistance(track.distanceMeters, unit);
  const livePace = isIndoor ? undefined : currentPaceSecondsPerUnit(track.points, unit);
  const avgPace =
    distance > 0.05 && elapsedSec > 0 ? Math.round(elapsedSec / distance) : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={handleClose} hitSlop={8} style={styles.topBarBtn}>
          <Ionicons name="close" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Run</Text>
        <View style={styles.topBarBtn} />
      </View>

      {phase === 'denied' ? (
        <View style={styles.centerWrap}>
          <Ionicons name="location-outline" size={32} color={colors.textMuted} />
          <Text style={styles.deniedTitle}>Location permission needed</Text>
          <Text style={styles.deniedText}>
            Outdoor runs use your location to measure distance and pace. Enable location in
            Settings, or track this one indoors instead.
          </Text>
          <PrimaryButton
            label="Track Indoors Instead"
            variant="primary"
            onPress={() => {
              setMode('indoor');
              setPhase('ready');
            }}
            style={{ marginTop: spacing.lg, width: '100%' }}
          />
          <PrimaryButton
            label="Back to Run"
            variant="outline"
            onPress={() => router.back()}
            style={{ marginTop: spacing.md, width: '100%' }}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {phase === 'ready' || phase === 'requesting' ? (
            <View style={styles.modeRow}>
              <ModeChip
                label="Outdoor"
                icon="navigate-outline"
                hint="GPS distance, pace, route"
                selected={mode === 'outdoor'}
                onPress={() => setMode('outdoor')}
              />
              <ModeChip
                label="Indoor"
                icon="fitness-outline"
                hint="Treadmill — timer + distance"
                selected={mode === 'indoor'}
                onPress={() => setMode('indoor')}
              />
            </View>
          ) : null}

          <View style={styles.heroCard}>
            {isIndoor ? (
              <>
                <Text style={styles.heroDistance}>{formatDuration(elapsedSec)}</Text>
                <Text style={styles.heroUnit}>time</Text>
              </>
            ) : (
              <>
                <Text style={styles.heroDistance}>{distance.toFixed(2)}</Text>
                <Text style={styles.heroUnit}>{unit}</Text>
              </>
            )}
            <View style={styles.heroRow}>
              {isIndoor ? (
                <HeroMetric
                  label="Distance"
                  value={indoorDistance > 0 ? `${indoorDistance} ${unit}` : '—'}
                />
              ) : (
                <HeroMetric label="Time" value={formatDuration(elapsedSec)} />
              )}
              {!isIndoor ? (
                <HeroMetric
                  label="Pace"
                  value={livePace ? `${formatPace(livePace)}/${unit}` : '—'}
                />
              ) : null}
              <HeroMetric
                label="Avg"
                value={avgPace ? `${formatPace(avgPace)}/${unit}` : '—'}
              />
            </View>
            {phase === 'tracking' && !isIndoor ? (
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>
                  {backgroundMode
                    ? 'GPS live • tracking continues with the screen locked'
                    : 'GPS live • keep the screen on (lock-screen tracking needs the dev build)'}
                </Text>
              </View>
            ) : null}
          </View>

          {isIndoor && phase !== 'ready' && phase !== 'requesting' ? (
            <View style={styles.indoorCard}>
              <Text style={styles.indoorLabel}>Treadmill distance ({unit}) — optional</Text>
              <TextInput
                value={indoorDistanceStr}
                onChangeText={setIndoorDistanceStr}
                style={styles.indoorInput}
                placeholder="0.0"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
          ) : null}

          {track.splits.length > 0 ? (
            <View style={styles.splitsCard}>
              <Text style={styles.splitsTitle}>Splits</Text>
              {track.splits.map((split) => (
                <View key={split.index} style={styles.splitRow}>
                  <Text style={styles.splitIndex}>
                    {unit} {split.index}
                  </Text>
                  <Text style={styles.splitTime}>{formatDuration(split.durationSeconds)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {phase === 'ready' || phase === 'requesting' ? (
            <PrimaryButton
              label={
                phase === 'requesting'
                  ? 'Checking GPS...'
                  : isIndoor
                    ? 'Start Indoor Run'
                    : 'Start Outdoor Run'
              }
              variant="primary"
              onPress={handleStart}
              style={{ marginTop: spacing.lg }}
            />
          ) : null}

          {phase === 'tracking' ? (
            <>
              <PrimaryButton
                label="Pause"
                variant="outline"
                onPress={handlePause}
                style={{ marginTop: spacing.lg }}
              />
              <PrimaryButton
                label="Finish Run"
                variant="primary"
                onPress={handleFinish}
                style={{ marginTop: spacing.md }}
              />
            </>
          ) : null}

          {phase === 'paused' ? (
            <>
              <PrimaryButton
                label="Resume"
                variant="primary"
                onPress={handleResume}
                style={{ marginTop: spacing.lg }}
              />
              <PrimaryButton
                label="Finish Run"
                variant="outline"
                onPress={handleFinish}
                style={{ marginTop: spacing.md }}
              />
            </>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ModeChip({
  label,
  icon,
  hint,
  selected,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  hint: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.modeChip, selected && styles.modeChipSelected]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={selected ? colors.accentTeal : colors.textMuted}
      />
      <Text style={[styles.modeChipLabel, selected && styles.modeChipLabelSelected]}>
        {label}
      </Text>
      <Text style={styles.modeChipHint}>{hint}</Text>
    </Pressable>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroMetric}>
      <Text style={styles.heroMetricValue}>{value}</Text>
      <Text style={styles.heroMetricLabel}>{label}</Text>
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
  modeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  modeChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  modeChipSelected: {
    borderColor: colors.accentTeal,
    backgroundColor: 'rgba(0, 180, 179, 0.08)',
  },
  modeChipLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  modeChipLabelSelected: {
    color: colors.accentTeal,
  },
  modeChipHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  indoorCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  indoorLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: spacing.sm,
  },
  indoorInput: {
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    textAlign: 'center',
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  heroDistance: {
    color: colors.textPrimary,
    fontSize: 64,
    fontWeight: fontWeight.heavy,
    fontVariant: ['tabular-nums'],
  },
  heroUnit: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: -6,
  },
  heroRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: spacing.xl,
  },
  heroMetric: {
    flex: 1,
    alignItems: 'center',
  },
  heroMetricValue: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    fontVariant: ['tabular-nums'],
  },
  heroMetricLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentLime,
  },
  liveText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    flexShrink: 1,
  },
  splitsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  splitsTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: spacing.sm,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  splitIndex: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
  },
  splitTime: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  deniedTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
  },
  deniedText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
