import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppCard, ScreenContainer, colors, fontFamily, fontSize, spacing } from '@revivex/design-system';
import SyncBadge from '../src/components/SyncBadge';
import TopBar from '../src/components/TopBar';
import { useCoach } from '../src/context/CoachContext';
import { formatDateKey } from '../src/lib/dates';

const KIND_ICON = { lift: 'barbell-outline', run: 'walk-outline', hybrid: 'flash-outline', recovery: 'leaf-outline', rest: 'moon-outline' } as const;
const STATUS_COLOR = { planned: colors.accentTeal, completed: colors.accentLime, skipped: colors.textSecondary } as const;

export default function HistoryScreen() {
  const { plans, workouts, runs, hybridSessions } = useCoach();
  const sorted = [...plans].sort((a, b) => (a.date < b.date ? 1 : -1));
  const completed = plans.filter((plan) => plan.status === 'completed').length;
  const skipped = plans.filter((plan) => plan.status === 'skipped').length;
  const sessions = workouts.length + runs.length + hybridSessions.length;

  return (
    <ScreenContainer>
      <TopBar title="History" />
      <Text style={styles.summary} testID="history-summary">
        {completed} completed · {skipped} skipped · {sessions} session{sessions === 1 ? '' : 's'} logged
      </Text>
      {sorted.length === 0 ? (
        <AppCard>
          <Text style={styles.emptyTitle}>No plans yet</Text>
          <Text style={styles.body}>Check in on Today and your first plan lands here.</Text>
        </AppCard>
      ) : (
        sorted.map((plan) => (
          <Pressable key={plan.id} onPress={() => router.push({ pathname: '/plan/[id]', params: { id: plan.id } })} style={{ marginBottom: spacing.md }} testID={`history-item-${plan.id}`}>
            <AppCard>
              <View style={styles.row}>
                <View style={styles.icon}>
                  <Ionicons name={KIND_ICON[plan.kind]} size={18} color={colors.textPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{plan.title}</Text>
                  <Text style={styles.meta}>{formatDateKey(plan.date, { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                  <SyncBadge table="daily_plans" clientId={plan.id} />
                </View>
                <Text style={[styles.status, { color: STATUS_COLOR[plan.status] }]}>{plan.status}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </AppCard>
          </Pressable>
        ))
      )}
      <View style={{ height: spacing.xxl }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  summary: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.lg, fontFamily: fontFamily.regular },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontFamily: fontFamily.bold, marginBottom: 6 },
  body: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20, fontFamily: fontFamily.regular },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: fontSize.md, fontFamily: fontFamily.semibold },
  meta: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2, fontFamily: fontFamily.regular },
  status: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, textTransform: 'uppercase', letterSpacing: 0.8 },
});
