import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppCard, PrimaryButton, ScreenContainer, colors, fontFamily, fontSize, spacing } from '@revivex/design-system';
import PlanBlocks from '../../src/components/PlanBlocks';
import SyncBadge from '../../src/components/SyncBadge';
import TopBar from '../../src/components/TopBar';
import { useCoach } from '../../src/context/CoachContext';
import { formatDateKey } from '../../src/lib/dates';

const STATUS_LABEL = { planned: 'Planned', completed: 'Completed', skipped: 'Skipped' } as const;
const STATUS_COLOR = { planned: colors.accentTeal, completed: colors.accentLime, skipped: colors.textSecondary } as const;

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const coach = useCoach();
  const record = coach.plans.find((plan) => plan.id === id);

  if (!record) {
    return (
      <ScreenContainer>
        <TopBar title="Plan" />
        <AppCard>
          <Text style={styles.body}>This plan is not on this device.</Text>
        </AppCard>
      </ScreenContainer>
    );
  }

  const plan = coach.dayPlanOf(record);
  const summary = coach.summaryOfCompleted(record);
  const isToday = record.date === coach.todayKey;

  return (
    <ScreenContainer>
      <TopBar title={formatDateKey(record.date, { weekday: 'short', month: 'short', day: 'numeric' })} />

      <View style={styles.statusRow}>
        <Text style={[styles.status, { color: STATUS_COLOR[record.status] }]} testID="plan-detail-status">
          {STATUS_LABEL[record.status]}
        </Text>
        <SyncBadge table="daily_plans" clientId={record.id} />
      </View>
      <Text style={styles.title} testID="plan-detail-title">
        {plan.title}
      </Text>
      <Text style={styles.subtitle}>
        {plan.subtitle}
        {plan.estimatedMinutes > 0 ? ` · ~${plan.estimatedMinutes} min` : ''}
      </Text>

      {plan.readiness ? (
        <AppCard style={{ marginTop: spacing.lg }}>
          <Text style={styles.sectionTitle}>Readiness {plan.readiness.score}/100</Text>
          <Text style={styles.body}>{plan.readiness.summary}</Text>
        </AppCard>
      ) : null}

      {plan.blocks.length > 0 ? (
        <AppCard style={{ marginTop: spacing.lg }}>
          <Text style={styles.sectionTitle}>Session</Text>
          <PlanBlocks blocks={plan.blocks} onSwap={isToday && record.status === 'planned' ? (index) => coach.swapPlanBlock(record.id, index) : undefined} />
        </AppCard>
      ) : null}

      <AppCard style={{ marginTop: spacing.lg }}>
        <Text style={styles.sectionTitle}>Why this plan</Text>
        {plan.rationale.map((line, index) => (
          <View key={index} style={styles.bullet}>
            <View style={styles.bulletDot} />
            <Text style={styles.body}>{line}</Text>
          </View>
        ))}
        <Text style={styles.footnote}>Engine {plan.engineVersion}. Deterministic rules, no AI.</Text>
      </AppCard>

      {summary ? (
        <AppCard elevated tint="strength" style={{ marginTop: spacing.lg }}>
          <Text style={styles.sectionTitle}>Logged</Text>
          <Text style={styles.body}>
            {summary.title} · {summary.line}
          </Text>
          <SyncBadge table={summary.kind === 'workout' ? 'workouts' : summary.kind === 'run' ? 'runs' : 'hybrid_sessions'} clientId={summary.id} />
        </AppCard>
      ) : null}

      {isToday && record.status === 'planned' ? (
        <>
          <View testID="plan-complete">
            <PrimaryButton label={plan.kind === 'rest' ? 'Got it, resting' : 'Mark complete'} onPress={() => coach.completePlan(record.id)} style={{ marginTop: spacing.xl }} />
          </View>
          <View style={styles.actions}>
            <Pressable onPress={() => coach.shortenTodayPlan(record.id)} hitSlop={8} testID="plan-shorten">
              <Text style={styles.link}>Shorten</Text>
            </Pressable>
            <Pressable onPress={() => coach.skipPlan(record.id)} hitSlop={8} testID="plan-skip">
              <Text style={styles.link}>Skip today</Text>
            </Pressable>
          </View>
        </>
      ) : null}
      {record.status !== 'planned' ? (
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.skip}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
      ) : null}
      <View style={{ height: spacing.xxl }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  status: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: fontSize.xxl, fontFamily: fontFamily.extrabold, marginTop: spacing.sm },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 4, fontFamily: fontFamily.regular },
  sectionTitle: { color: colors.text, fontSize: fontSize.md, fontFamily: fontFamily.bold, marginBottom: spacing.sm },
  body: { flex: 1, color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20, fontFamily: fontFamily.regular },
  bullet: { flexDirection: 'row', gap: 8, marginTop: 4 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accentTeal, marginTop: 8 },
  footnote: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.md, fontFamily: fontFamily.regular },
  skip: { alignItems: 'center', paddingVertical: spacing.lg },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, paddingVertical: spacing.lg },
  link: { color: colors.textSecondary, fontSize: fontSize.sm, fontFamily: fontFamily.semibold },
});
