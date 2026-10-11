import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { readinessBand, type SlotKind } from '@revivex/coach';
import {
  AppCard,
  BrandTagline,
  Chip,
  PrimaryButton,
  ScreenContainer,
  SectionHeader,
  colors,
  fontFamily,
  fontSize,
  spacing,
} from '@revivex/design-system';
import PlanBlocks from '../src/components/PlanBlocks';
import SyncBadge from '../src/components/SyncBadge';
import { useAuth } from '../src/context/AuthContext';
import { useCoach } from '../src/context/CoachContext';
import { formatToday } from '../src/lib/dates';

const SLOT_SHORT: Record<SlotKind, string> = {
  upper: 'Upper',
  lower: 'Lower',
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  full: 'Full body',
  run_easy: 'Easy run',
  run_quality: 'Tempo',
  run_long: 'Long run',
  hybrid: 'Hybrid',
};

const KIND_LABEL = { lift: 'Lift', run: 'Run', hybrid: 'Hybrid', recovery: 'Recovery', rest: 'Rest' } as const;
const KIND_COLOR = {
  lift: colors.modalityStrength,
  run: colors.modalityRun,
  hybrid: colors.modalityHybrid,
  recovery: colors.accentTeal,
  rest: colors.textSecondary,
} as const;

/** Today: one check-in, one session, one reason why. */
export default function TodayScreen() {
  const { user } = useAuth();
  const coach = useCoach();
  const { settings, loaded, todayCheckin, todayPlan, weekTemplate, completedThisWeek } = coach;

  if (!loaded) {
    return (
      <ScreenContainer>
        <View />
      </ScreenContainer>
    );
  }

  const plan = todayPlan ? coach.dayPlanOf(todayPlan) : undefined;
  const summary = todayPlan ? coach.summaryOfCompleted(todayPlan) : undefined;

  const buildFromCheckin = () => {
    if (todayCheckin) {
      coach.submitCheckin({ sleep: todayCheckin.sleep, soreness: todayCheckin.soreness, energy: todayCheckin.energy }, todayCheckin.notes);
    } else {
      coach.planWithoutCheckin();
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>ReviveX</Text>
          <BrandTagline />
          <Text style={styles.date} testID="today-date">
            {formatToday()}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <HeaderButton icon="calendar-outline" label="History" onPress={() => router.push('/history')} testID="today-history" />
          <HeaderButton icon="options-outline" label="Settings" onPress={() => router.push('/settings')} testID="today-settings" />
          <HeaderButton icon={user ? 'cloud-done-outline' : 'cloud-outline'} label="Account" onPress={() => router.push('/account')} testID="today-account" />
        </View>
      </View>

      {!settings.setupComplete ? (
        <AppCard elevated tint="brand">
          <Text style={styles.cardTitle}>Tell the coach about your week</Text>
          <Text style={styles.cardBody}>
            Pick your focus, how many days you train, and your units. One minute now, then one session a day from here on.
          </Text>
          <View testID="today-setup">
            <PrimaryButton label="Set up" onPress={() => router.push('/settings')} style={{ marginTop: spacing.md }} />
          </View>
        </AppCard>
      ) : (
        <>
          {todayCheckin ? (
            <AppCard>
              <View style={styles.readinessRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Readiness today</Text>
                  <View style={styles.scoreRow}>
                    <Text style={styles.score} testID="today-readiness-score">
                      {todayCheckin.score}
                    </Text>
                    <Text style={styles.scoreMax}>/100 · {readinessBand(todayCheckin.score)}</Text>
                  </View>
                </View>
                <View style={styles.miniStats}>
                  <MiniStat label="Sleep" value={todayCheckin.sleep} />
                  <MiniStat label="Soreness" value={todayCheckin.soreness} />
                  <MiniStat label="Energy" value={todayCheckin.energy} />
                </View>
              </View>
              <Pressable onPress={() => router.push('/checkin')} hitSlop={8} testID="today-update-checkin">
                <Text style={styles.link}>Update check-in</Text>
              </Pressable>
            </AppCard>
          ) : (
            <AppCard elevated tint="brand">
              <Text style={styles.cardTitle}>How are you today?</Text>
              <Text style={styles.cardBody}>Three taps: sleep, soreness, energy. The coach sizes today's session to match.</Text>
              <View testID="today-checkin-button">
                <PrimaryButton label="Check in" onPress={() => router.push('/checkin')} style={{ marginTop: spacing.md }} />
              </View>
              {!todayPlan ? (
                <Pressable onPress={() => coach.planWithoutCheckin()} hitSlop={8} style={{ marginTop: spacing.md }} testID="today-plan-without">
                  <Text style={styles.link}>Plan without checking in</Text>
                </Pressable>
              ) : null}
            </AppCard>
          )}

          {todayPlan && plan ? (
            todayPlan.status === 'completed' ? (
              <AppCard elevated tint="strength" style={{ marginTop: spacing.lg }}>
                <View style={styles.doneRow}>
                  <Ionicons name="checkmark-circle" size={28} color={colors.accentLime} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle} testID="today-done">
                      Done for today
                    </Text>
                    <Text style={styles.cardBody}>
                      {summary ? `${summary.title} · ${summary.line}` : plan.title}
                    </Text>
                    {summary ? (
                      <SyncBadge
                        table={summary.kind === 'workout' ? 'workouts' : summary.kind === 'run' ? 'runs' : 'hybrid_sessions'}
                        clientId={summary.id}
                      />
                    ) : null}
                  </View>
                </View>
                <Pressable onPress={() => router.push({ pathname: '/plan/[id]', params: { id: todayPlan.id } })} hitSlop={8} style={{ marginTop: spacing.md }} testID="today-open-plan">
                  <Text style={styles.link}>View the plan</Text>
                </Pressable>
              </AppCard>
            ) : todayPlan.status === 'skipped' ? (
              <AppCard style={{ marginTop: spacing.lg }}>
                <Text style={styles.cardTitle}>Skipped today</Text>
                <Text style={styles.cardBody}>No problem. The week picks up where you left off.</Text>
                <View style={styles.actionsRow}>
                  <Pressable onPress={() => coach.regeneratePlan()} hitSlop={8} testID="today-rebuild">
                    <Text style={styles.link}>Plan again</Text>
                  </Pressable>
                  <Pressable onPress={() => router.push({ pathname: '/plan/[id]', params: { id: todayPlan.id } })} hitSlop={8} testID="today-open-plan">
                    <Text style={styles.link}>View the plan</Text>
                  </Pressable>
                </View>
              </AppCard>
            ) : (
              <AppCard elevated style={{ marginTop: spacing.lg }}>
                <View style={styles.kindRow}>
                  <View style={[styles.kindDot, { backgroundColor: KIND_COLOR[plan.kind] }]} />
                  <Text style={[styles.kindText, { color: KIND_COLOR[plan.kind] }]}>{KIND_LABEL[plan.kind]}</Text>
                  <Text style={styles.minutes}>~{plan.estimatedMinutes} min</Text>
                </View>
                <Text style={styles.planTitle} testID="today-plan-title">
                  {plan.title}
                </Text>
                <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
                <SyncBadge table="daily_plans" clientId={todayPlan.id} />

                {plan.blocks.length > 0 ? (
                  <View style={{ marginTop: spacing.lg }}>
                    <PlanBlocks blocks={plan.blocks} compact />
                  </View>
                ) : null}

                <Text style={styles.whyTitle}>Why this today</Text>
                {plan.rationale.slice(0, 3).map((line, index) => (
                  <View key={index} style={styles.bullet}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{line}</Text>
                  </View>
                ))}

                <View testID="today-complete">
                  <PrimaryButton
                    label={plan.kind === 'rest' ? 'Got it, resting' : 'Mark complete'}
                    onPress={() => coach.completePlan(todayPlan.id)}
                    style={{ marginTop: spacing.lg }}
                  />
                </View>
                <View style={styles.actionsRow}>
                  <Pressable onPress={() => coach.skipPlan(todayPlan.id)} hitSlop={8} testID="today-skip">
                    <Text style={styles.link}>Skip today</Text>
                  </Pressable>
                  <Pressable onPress={() => coach.regeneratePlan()} hitSlop={8} testID="today-rebuild">
                    <Text style={styles.link}>Rebuild</Text>
                  </Pressable>
                  <Pressable onPress={() => router.push({ pathname: '/plan/[id]', params: { id: todayPlan.id } })} hitSlop={8} testID="today-open-plan">
                    <Text style={styles.link}>Details</Text>
                  </Pressable>
                </View>
              </AppCard>
            )
          ) : todayCheckin ? (
            <View testID="today-build">
              <PrimaryButton label="Build today's plan" onPress={buildFromCheckin} style={{ marginTop: spacing.lg }} />
            </View>
          ) : null}

          <SectionHeader title="This week" actionLabel="History" onActionPress={() => router.push('/history')} />
          <View style={styles.week} testID="today-week">
            {weekTemplate.map((slot, index) => (
              <Chip
                key={`${slot}-${index}`}
                label={`${index < completedThisWeek ? '✓ ' : ''}${SLOT_SHORT[slot]}`}
                selected={index < completedThisWeek}
                disabled
                style={{ opacity: 1 }}
              />
            ))}
          </View>
          <Text style={styles.weekNote}>
            {completedThisWeek} of {weekTemplate.length} sessions done this week. Skip a day and the plan carries on from the next slot.
          </Text>
        </>
      )}
      <View style={{ height: spacing.xxl }} />
    </ScreenContainer>
  );
}

function HeaderButton({ icon, label, onPress, testID }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} style={styles.headerBtn} accessibilityLabel={label} testID={testID}>
      <Ionicons name={icon} size={20} color={colors.textPrimary} />
    </Pressable>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: spacing.sm, paddingBottom: spacing.lg },
  headerActions: { flexDirection: 'row', gap: spacing.xs, marginTop: 4 },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { color: colors.text, fontSize: fontSize.xxl, fontFamily: fontFamily.extrabold, letterSpacing: 0.4 },
  date: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 6, fontFamily: fontFamily.regular },
  cardTitle: { color: colors.text, fontSize: fontSize.lg, fontFamily: fontFamily.bold, marginBottom: 6 },
  cardBody: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20, fontFamily: fontFamily.regular },
  label: { color: colors.textSecondary, fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  score: { color: colors.text, fontSize: fontSize.display, fontFamily: fontFamily.extrabold },
  scoreMax: { color: colors.textSecondary, fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  readinessRow: { flexDirection: 'row', alignItems: 'center' },
  miniStats: { flexDirection: 'row', gap: spacing.md },
  miniStat: { alignItems: 'center', minWidth: 48 },
  miniValue: { color: colors.text, fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  miniLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontFamily: fontFamily.regular },
  link: { color: colors.accentTeal, fontSize: fontSize.sm, fontFamily: fontFamily.semibold, marginTop: spacing.sm },
  doneRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  kindRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kindDot: { width: 8, height: 8, borderRadius: 4 },
  kindText: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, letterSpacing: 1, textTransform: 'uppercase' },
  minutes: { marginLeft: 'auto', color: colors.textSecondary, fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  planTitle: { color: colors.text, fontSize: fontSize.xl, fontFamily: fontFamily.extrabold, marginTop: spacing.sm },
  planSubtitle: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2, fontFamily: fontFamily.regular },
  whyTitle: { color: colors.text, fontSize: fontSize.sm, fontFamily: fontFamily.bold, marginTop: spacing.lg, marginBottom: 6 },
  bullet: { flexDirection: 'row', gap: 8, marginTop: 4 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accentTeal, marginTop: 7 },
  bulletText: { flex: 1, color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 19, fontFamily: fontFamily.regular },
  actionsRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.xs },
  week: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  weekNote: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.md, lineHeight: 17, fontFamily: fontFamily.regular },
});
