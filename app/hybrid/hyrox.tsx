import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import PrimaryButton from '../../src/components/PrimaryButton';
import { useHybridSessions } from '../../src/context/HybridContext';
import {
  HYROX_DIVISIONS,
  hyroxRacePlan,
  formatRaceClock,
  type HyroxDivision,
  type HyroxPlannedSegment,
} from '../../src/data/hyrox';
import { celebratePR, notifySuccess, tapLight, tapMedium } from '../../src/utils/haptics';
import { colors, fontSize, fontWeight, radius, spacing } from '../../src/theme/theme';

type RacePhase = 'setup' | 'racing';

interface CompletedSegment {
  planned: HyroxPlannedSegment;
  durationSeconds: number;
}

/**
 * HYROX Race Simulation player (Phase 49).
 *
 * A live, guided run-through of the full race: 8 × 1 km runs alternating
 * with the 8 stations, in official order. One big race clock, one tap per
 * completed segment, splits recorded per segment. Saves as a
 * 'HYROX Race Sim' hybrid session so history/PRs work automatically.
 */
export default function HyroxRaceScreen() {
  useKeepAwake();
  const { addHybridSession } = useHybridSessions();

  const [phase, setPhase] = useState<RacePhase>('setup');
  const [division, setDivision] = useState<HyroxDivision>('openMen');
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [completed, setCompleted] = useState<CompletedSegment[]>([]);
  const [nowMs, setNowMs] = useState(Date.now());

  const raceStartRef = useRef<number | null>(null);
  const segmentStartRef = useRef<number | null>(null);

  const plan = useMemo(() => hyroxRacePlan(division), [division]);

  // 4 Hz clock while racing.
  useEffect(() => {
    if (phase !== 'racing') return;
    const handle = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(handle);
  }, [phase]);

  const raceSeconds = raceStartRef.current ? (nowMs - raceStartRef.current) / 1000 : 0;
  const segmentSeconds = segmentStartRef.current ? (nowMs - segmentStartRef.current) / 1000 : 0;

  const handleStart = () => {
    const now = Date.now();
    raceStartRef.current = now;
    segmentStartRef.current = now;
    setSegmentIndex(0);
    setCompleted([]);
    tapMedium();
    setPhase('racing');
  };

  const handleCompleteSegment = () => {
    const now = Date.now();
    const duration = Math.max(1, Math.round((now - (segmentStartRef.current ?? now)) / 1000));
    const entry: CompletedSegment = { planned: plan[segmentIndex], durationSeconds: duration };
    const allCompleted = [...completed, entry];

    if (segmentIndex >= plan.length - 1) {
      finishRace(allCompleted, now);
      return;
    }

    notifySuccess();
    setCompleted(allCompleted);
    segmentStartRef.current = now;
    setSegmentIndex(segmentIndex + 1);
  };

  const finishRace = (allCompleted: CompletedSegment[], endedAt: number) => {
    const totalSeconds = Math.max(
      1,
      Math.round((endedAt - (raceStartRef.current ?? endedAt)) / 1000)
    );
    const divisionLabel = HYROX_DIVISIONS.find((d) => d.id === division)?.label ?? '';

    const session = addHybridSession({
      title: 'HYROX Race Simulation',
      date: new Date(raceStartRef.current ?? endedAt).toISOString(),
      sessionType: 'HYROX Race Sim',
      notes: `Division: ${divisionLabel} • Finish: ${formatRaceClock(totalSeconds)}`,
      segments: allCompleted.map((item) => ({
        name: item.planned.name,
        segmentType: item.planned.segmentType,
        distance: item.planned.distanceMeters,
        distanceUnit: item.planned.distanceMeters ? ('m' as const) : undefined,
        durationSeconds: item.durationSeconds,
      })),
    });

    celebratePR();
    router.replace({ pathname: '/hybrid/[id]', params: { id: session.id } });
  };

  const handleClose = () => {
    if (phase === 'racing') {
      Alert.alert('Abandon race?', 'Your race in progress will be discarded.', [
        { text: 'Keep Racing', style: 'cancel' },
        { text: 'Abandon', style: 'destructive', onPress: () => router.back() },
      ]);
      return;
    }
    router.back();
  };

  const current = plan[segmentIndex];
  const next = plan[segmentIndex + 1];
  const isLast = segmentIndex === plan.length - 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={handleClose} hitSlop={8} style={styles.topBarBtn}>
          <Ionicons name="close" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>HYROX Race Sim</Text>
        <View style={styles.topBarBtn} />
      </View>

      {phase === 'setup' ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.setupLead}>
            The full race, in official order: 8 × 1 km runs, one station after each.
            One tap per completed segment — the clock handles the rest.
          </Text>

          <Text style={styles.sectionLabel}>Division</Text>
          <View style={styles.divisionRow}>
            {HYROX_DIVISIONS.map((item) => {
              const selected = item.id === division;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    tapLight();
                    setDivision(item.id);
                  }}
                  style={[styles.divisionChip, selected && styles.divisionChipSelected]}
                >
                  <Text
                    style={[styles.divisionChipText, selected && styles.divisionChipTextSelected]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Race plan</Text>
          <View style={styles.planCard}>
            {plan.map((segment, idx) => (
              <View
                key={segment.position}
                style={[styles.planRow, idx !== plan.length - 1 && styles.planDivider]}
              >
                <MaterialCommunityIcons
                  name={segment.icon as never}
                  size={18}
                  color={segment.segmentType === 'run' ? colors.accentTeal : colors.accentCoral}
                />
                <Text style={styles.planName}>{segment.name}</Text>
                <Text style={styles.planMetric}>
                  {segment.metric}
                  {segment.load && segment.load !== '—' && segment.load !== 'Bodyweight'
                    ? ` · ${segment.load}`
                    : ''}
                </Text>
              </View>
            ))}
          </View>

          <PrimaryButton
            label="Start Race"
            variant="primary"
            onPress={handleStart}
            style={{ marginTop: spacing.lg }}
          />
          <Text style={styles.setupHint}>
            Loads are the published division standards — treat them as targets and scale to
            your gym's equipment.
          </Text>
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Race clock */}
          <View style={styles.clockWrap}>
            <Text style={styles.clockLabel}>RACE TIME</Text>
            <Text style={styles.clock}>{formatRaceClock(raceSeconds)}</Text>
            <Text style={styles.progressLabel}>
              Segment {segmentIndex + 1} of {plan.length}
            </Text>
          </View>

          {/* Current segment */}
          <View
            style={[
              styles.currentCard,
              current.segmentType === 'run' ? styles.currentRun : styles.currentStation,
            ]}
          >
            <View style={styles.currentHeader}>
              <MaterialCommunityIcons
                name={current.icon as never}
                size={30}
                color={current.segmentType === 'run' ? colors.accentTeal : colors.accentCoral}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.currentName}>{current.name}</Text>
                <Text style={styles.currentMetric}>
                  {current.metric}
                  {current.load && current.load !== '—' ? ` · ${current.load}` : ''}
                </Text>
              </View>
            </View>
            <Text style={styles.segmentClock}>{formatRaceClock(segmentSeconds)}</Text>
            <PrimaryButton
              label={isLast ? 'Finish Race 🏁' : 'Complete Segment'}
              variant={current.segmentType === 'run' ? 'tech' : 'accent'}
              onPress={handleCompleteSegment}
            />
            {next ? (
              <Text style={styles.nextUp}>
                Next: {next.name} · {next.metric}
              </Text>
            ) : null}
          </View>

          {/* Splits so far */}
          {completed.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>Splits</Text>
              <View style={styles.planCard}>
                {completed.map((item, idx) => (
                  <View
                    key={`${item.planned.position}`}
                    style={[styles.planRow, idx !== completed.length - 1 && styles.planDivider]}
                  >
                    <MaterialCommunityIcons
                      name={item.planned.icon as never}
                      size={16}
                      color={
                        item.planned.segmentType === 'run'
                          ? colors.accentTeal
                          : colors.accentCoral
                      }
                    />
                    <Text style={styles.planName}>{item.planned.name}</Text>
                    <Text style={styles.splitTime}>{formatRaceClock(item.durationSeconds)}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
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
  },
  setupLead: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 21,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  divisionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  divisionChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  divisionChipSelected: {
    borderColor: colors.accentCoral,
    backgroundColor: 'rgba(255, 107, 61, 0.12)',
  },
  divisionChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  divisionChipTextSelected: {
    color: colors.accentCoral,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  planDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  planName: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  planMetric: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  splitTime: {
    color: colors.accentTeal,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  setupHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    lineHeight: 17,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  clockWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  clockLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.2,
  },
  clock: {
    color: colors.textPrimary,
    fontSize: 56,
    fontWeight: fontWeight.heavy,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  currentCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  currentRun: {
    borderColor: 'rgba(0, 180, 179, 0.55)',
  },
  currentStation: {
    borderColor: 'rgba(255, 107, 61, 0.55)',
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  currentName: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.3,
  },
  currentMetric: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  segmentClock: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  nextUp: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
