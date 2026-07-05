import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useWorkout } from '../../src/context/WorkoutContext';
import { useProfile } from '../../src/context/ProfileContext';
import { colors, fontSize, fontWeight, radius, spacing } from '../../src/theme/theme';
import PrimaryButton from '../../src/components/PrimaryButton';
import ExerciseLogCard from '../../src/components/workout/ExerciseLogCard';
import RestTimerBar from '../../src/components/workout/RestTimerBar';
import { formatDuration } from '../../src/utils/format';

const DEFAULT_REST_SECONDS = 90;

/**
 * Active Workout screen.
 *
 * Lifecycle:
 *  - If there's no active workout when this screen opens, it starts one.
 *  - The user can add exercises, edit sets, add/remove sets, and finish.
 *  - "Cancel" discards the in-progress workout entirely.
 *  - "Finish" saves it to history and returns to the Train tab.
 */
export default function ActiveWorkoutScreen() {
  const {
    activeWorkout,
    startWorkout,
    startWorkoutTimer,
    cancelWorkout,
    finishWorkout,
    setWorkoutTitle,
    setWorkoutNotes,
    removeExerciseFromWorkout,
    addSet,
    updateSet,
    removeSet,
  } = useWorkout();
  const { profile } = useProfile();

  // If no active workout, start one (entered from "Start Empty Workout")
  useEffect(() => {
    if (!activeWorkout) {
      startWorkout('New Workout');
    }
  }, [activeWorkout, startWorkout]);

  // Live elapsed-time clock — starts only after the user begins the workout.
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    if (!activeWorkout?.startedAt) {
      setElapsedSec(0);
      return;
    }

    const startedAt = new Date(activeWorkout.startedAt).getTime();
    if (Number.isNaN(startedAt)) {
      setElapsedSec(0);
      return;
    }

    const tick = () => setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const handle = setInterval(tick, 1000);
    return () => clearInterval(handle);
  }, [activeWorkout?.startedAt]);

  // Rest timer — starts when a set is marked done, counts down to a buzz.
  const [restTimer, setRestTimer] = useState<{ endsAt: number; total: number } | null>(null);
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const restVibratedRef = useRef(false);

  useEffect(() => {
    if (!restTimer) {
      setRestSecondsLeft(0);
      return;
    }

    restVibratedRef.current = false;
    const tick = () => {
      const left = Math.max(0, Math.ceil((restTimer.endsAt - Date.now()) / 1000));
      setRestSecondsLeft(left);
      if (left === 0) {
        if (!restVibratedRef.current) {
          restVibratedRef.current = true;
          Vibration.vibrate(600);
        }
        setRestTimer(null);
      }
    };
    tick();
    const handle = setInterval(tick, 250);
    return () => clearInterval(handle);
  }, [restTimer]);

  const startRestTimer = useCallback((restSeconds?: number) => {
    const total = Math.max(5, Math.floor(restSeconds ?? DEFAULT_REST_SECONDS));
    setRestTimer({ endsAt: Date.now() + total * 1000, total });
  }, []);

  const extendRestTimer = useCallback(() => {
    setRestTimer((current) =>
      current
        ? { endsAt: current.endsAt + 15_000, total: current.total + 15 }
        : current
    );
  }, []);

  const skipRestTimer = useCallback(() => setRestTimer(null), []);

  const handleCancel = () => {
    Alert.alert(
      'Cancel workout?',
      'Your in-progress workout will be discarded.',
      [
        { text: 'Keep going', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            cancelWorkout();
            router.back();
          },
        },
      ]
    );
  };

  const handleFinish = async () => {
    if (!activeWorkout) return;

    if (!activeWorkout.startedAt) {
      Alert.alert(
        'Workout not started',
        'Start the workout timer before finishing this session.',
        [{ text: 'OK' }]
      );
      return;
    }

    const hasAnyExercises = activeWorkout.exercises.length > 0;
    if (!hasAnyExercises) {
      Alert.alert(
        'No exercises yet',
        'Add at least one exercise before finishing.',
        [{ text: 'OK' }]
      );
      return;
    }

    await finishWorkout();
    router.back();
  };

  const handleAddExercise = () => {
    router.push('/workout/exercise-picker');
  };

  // While the workout is being initialized, render nothing
  if (!activeWorkout) {
    return <SafeAreaView style={styles.safe} />;
  }

  const exerciseCount = activeWorkout.exercises.length;
  const isWorkoutStarted = Boolean(activeWorkout.startedAt);
  const totalSetsLogged = activeWorkout.exercises.reduce(
    (sum, ex) => sum + ex.sets.length,
    0
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={handleCancel} hitSlop={8} style={styles.topBarBtn}>
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.timer, !isWorkoutStarted && styles.timerPaused]}>
            {formatDuration(elapsedSec)}
          </Text>
          <Pressable
            onPress={handleFinish}
            disabled={!isWorkoutStarted}
            hitSlop={8}
            style={[
              styles.topBarBtn,
              styles.finishBtn,
              !isWorkoutStarted && styles.finishBtnDisabled,
            ]}
          >
            <Text
              style={[
                styles.finishBtnText,
                !isWorkoutStarted && styles.finishBtnTextDisabled,
              ]}
            >
              Finish
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <TextInput
            value={activeWorkout.title}
            onChangeText={setWorkoutTitle}
            style={styles.titleInput}
            placeholder="Workout title"
            placeholderTextColor={colors.textMuted}
            selectTextOnFocus
          />

          {!isWorkoutStarted ? (
            <View style={styles.startTimerCard}>
              <View style={styles.startTimerTextWrap}>
                <Text style={styles.startTimerTitle}>Ready when you are</Text>
                <Text style={styles.startTimerSub}>Timer is paused.</Text>
              </View>
              <PrimaryButton
                label="Start Workout"
                variant="primary"
                onPress={startWorkoutTimer}
                style={styles.startTimerButton}
              />
            </View>
          ) : null}

          {/* Quick stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{exerciseCount}</Text>
              <Text style={styles.quickStatLabel}>Exercises</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{totalSetsLogged}</Text>
              <Text style={styles.quickStatLabel}>Sets</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text
                style={[
                  styles.quickStatValue,
                  { color: isWorkoutStarted ? colors.gold : colors.textMuted },
                ]}
              >
                {formatDuration(elapsedSec)}
              </Text>
              <Text style={styles.quickStatLabel}>
                {isWorkoutStarted ? 'Time' : 'Paused'}
              </Text>
            </View>
          </View>

          {/* Exercise cards */}
          {activeWorkout.exercises.map((ex) => (
            <ExerciseLogCard
              key={ex.id}
              exercise={ex}
              onAddSet={() => addSet(ex.id)}
              onUpdateSet={(setId, patch) => {
                updateSet(ex.id, setId, patch);
                if (patch.completed === true) {
                  startRestTimer(ex.restSeconds);
                }
              }}
              onRemoveSet={(setId) => removeSet(ex.id, setId)}
              weightUnit={profile?.preferredWeightUnit}
              onRemoveExercise={() => {
                Alert.alert(
                  'Remove exercise?',
                  `${ex.exerciseName} and its sets will be removed from this workout.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: () => removeExerciseFromWorkout(ex.id),
                    },
                  ]
                );
              }}
            />
          ))}

          {/* Empty state when no exercises yet */}
          {exerciseCount === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="barbell-outline"
                size={32}
                color={colors.textMuted}
              />
              <Text style={styles.emptyTitle}>No exercises yet</Text>
              <Text style={styles.emptySub}>
                Tap "Add Exercise" to get started.
              </Text>
            </View>
          ) : null}

          {/* Workout notes (optional) */}
          {exerciseCount > 0 ? (
            <View style={styles.notesWrap}>
              <Text style={styles.notesLabel}>Workout notes</Text>
              <TextInput
                style={styles.notesInput}
                value={activeWorkout.notes ?? ''}
                onChangeText={setWorkoutNotes}
                placeholder="How did it feel? Any cues to remember?"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={500}
              />
            </View>
          ) : null}

          {/* Add Exercise button */}
          <PrimaryButton
            label="+ Add Exercise"
            variant="primary"
            onPress={handleAddExercise}
            style={{ marginTop: spacing.lg }}
          />

          {/* Spacer at bottom */}
          <View style={{ height: spacing.xxl }} />
        </ScrollView>

        {restTimer && restSecondsLeft > 0 ? (
          <RestTimerBar
            secondsLeft={restSecondsLeft}
            totalSeconds={restTimer.total}
            onAddTime={extendRestTimer}
            onSkip={skipRestTimer}
          />
        ) : null}
      </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 60,
  },
  timer: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  timerPaused: {
    color: colors.textMuted,
  },
  finishBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 76,
  },
  finishBtnDisabled: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.65,
  },
  finishBtnText: {
    color: colors.background,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },
  finishBtnTextDisabled: {
    color: colors.textMuted,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  titleInput: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.5,
    padding: 0,
    marginBottom: spacing.md,
  },
  startTimerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  startTimerTextWrap: {
    flex: 1,
  },
  startTimerTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  startTimerSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  startTimerButton: {
    minWidth: 132,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  quickStatLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.sm,
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  notesWrap: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  notesLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: spacing.sm,
  },
  notesInput: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    lineHeight: 22,
    padding: 0,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});
