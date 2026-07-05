import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  CreateRoutineInput,
  Exercise,
  Routine,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from '../types';

/**
 * WorkoutContext
 * ---------------
 * One place that owns:
 *  - The "active workout" — a workout currently in progress (in-memory only).
 *  - The "workout history" — saved completed workouts (persisted to AsyncStorage).
 *  - Saved routines — reusable workout templates that can start active workouts.
 *
 * Keeping all mutations here means screens stay dumb and predictable.
 *
 * Persistence note (Phase 2 trade-off):
 *  - History is persisted to AsyncStorage.
 *  - The active (in-progress) workout is NOT persisted — closing the app
 *    mid-workout will lose it. We can add a draft-save flow in a later phase.
 */

// Keep the original HybridTrack keys so the ReviveX rebrand does not wipe local data.
const HISTORY_STORAGE_KEY = 'hybridtrack.workouts.v1';
const ROUTINES_STORAGE_KEY = 'hybridtrack.routines.v1';

interface WorkoutContextValue {
  // Active workout (in progress)
  activeWorkout: Workout | null;
  startWorkout: (title?: string) => void;
  startWorkoutTimer: () => void;
  cancelWorkout: () => void;
  finishWorkout: () => Promise<void>;

  // Active workout mutations
  setWorkoutTitle: (title: string) => void;
  setWorkoutNotes: (notes: string) => void;
  addExerciseToWorkout: (exercise: Exercise) => void;
  removeExerciseFromWorkout: (workoutExerciseId: string) => void;
  addSet: (workoutExerciseId: string) => void;
  updateSet: (
    workoutExerciseId: string,
    setId: string,
    patch: Partial<Pick<WorkoutSet, 'weight' | 'reps' | 'notes' | 'completed'>>
  ) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;

  // History
  history: Workout[];
  historyLoaded: boolean;
  deleteWorkout: (workoutId: string) => void;
  updateWorkoutMetadata: (
    workoutId: string,
    patch: UpdateWorkoutMetadataInput
  ) => Workout | undefined;
  updateWorkoutDetails: (
    workoutId: string,
    patch: UpdateWorkoutDetailsInput
  ) => Workout | undefined;
  getWorkoutById: (workoutId: string) => Workout | undefined;
  repeatWorkout: (workoutId: string) => boolean;

  // Routines
  routines: Routine[];
  routinesLoaded: boolean;
  createRoutine: (input: CreateRoutineInput) => Routine;
  updateRoutine: (routineId: string, input: CreateRoutineInput) => Routine | undefined;
  deleteRoutine: (routineId: string) => void;
  getRoutineById: (routineId: string) => Routine | undefined;
  startWorkoutFromRoutine: (routineId: string) => boolean;
}

interface UpdateWorkoutMetadataInput {
  title?: string;
  date?: string;
  notes?: string;
}

interface UpdateWorkoutDetailsInput {
  title?: string;
  date?: string;
  notes?: string;
  exercises: WorkoutExercise[];
}

function normalizeWorkoutExercises(exercises: WorkoutExercise[]): WorkoutExercise[] {
  return exercises.map((exercise) => ({
    ...exercise,
    id: exercise.id || makeId('we'),
    sets: exercise.sets.map((set, index) => ({
      ...set,
      id: set.id || makeId('set'),
      setNumber: index + 1,
      weight: Math.max(0, Number.isFinite(set.weight) ? set.weight : 0),
      reps: Math.max(0, Math.floor(Number.isFinite(set.reps) ? set.reps : 0)),
    })),
  }));
}

const WorkoutContext = createContext<WorkoutContextValue | undefined>(undefined);

// Simple id generator — fine for Phase 2.
let _idCounter = 0;
function makeId(prefix: string) {
  _idCounter += 1;
  return `${prefix}_${Date.now()}_${_idCounter}`;
}

function computeWorkoutTotals(exercises: WorkoutExercise[]) {
  let totalSets = 0;
  let totalVolume = 0;
  for (const ex of exercises) {
    for (const s of ex.sets) {
      totalSets += 1;
      // Only count completed sets in volume — feels right for "what you actually did"
      if (s.completed) {
        totalVolume += s.weight * s.reps;
      }
    }
  }
  return { totalSets, totalVolume };
}

function sortWorkouts(workouts: Workout[]): Workout[] {
  return [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function normalizeRoutineExercises(exercises: Routine['exercises']): Routine['exercises'] {
  return exercises.map((ex, index) => ({
    ...ex,
    id: ex.id || makeId(`rtex_${index + 1}`),
    targetSets: Math.max(1, Math.floor(ex.targetSets || 1)),
    targetReps:
      ex.targetReps === undefined ? undefined : Math.max(0, Math.floor(ex.targetReps)),
    targetWeight:
      ex.targetWeight === undefined ? undefined : Math.max(0, ex.targetWeight),
    restSeconds:
      ex.restSeconds === undefined ? undefined : Math.max(0, Math.floor(ex.restSeconds)),
  }));
}

interface ProviderProps {
  children: React.ReactNode;
}

export function WorkoutProvider({ children }: ProviderProps) {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [history, setHistory] = useState<Workout[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routinesLoaded, setRoutinesLoaded] = useState(false);

  // Load saved history once on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Workout[];
          setHistory(parsed);
        }
      } catch (err) {
        // If storage is corrupt or unavailable, just start empty.
        console.warn('Failed to load workout history:', err);
      } finally {
        setHistoryLoaded(true);
      }
    })();
  }, []);

  // Load saved routines once on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Routine[];
          setRoutines(parsed);
        }
      } catch (err) {
        console.warn('Failed to load routines:', err);
      } finally {
        setRoutinesLoaded(true);
      }
    })();
  }, []);

  // Persist history whenever it changes (after initial load)
  useEffect(() => {
    if (!historyLoaded) return;
    AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history)).catch(
      (err) => console.warn('Failed to save workout history:', err)
    );
  }, [history, historyLoaded]);

  // Persist routines whenever they change (after initial load)
  useEffect(() => {
    if (!routinesLoaded) return;
    AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(routines)).catch(
      (err) => console.warn('Failed to save routines:', err)
    );
  }, [routines, routinesLoaded]);

  const startWorkout = useCallback((title = 'New Workout') => {
    setActiveWorkout({
      id: makeId('wk'),
      title,
      date: new Date().toISOString(),
      duration: 0,
      exercises: [],
      totalSets: 0,
      totalVolume: 0,
    });
  }, []);

  const startWorkoutTimer = useCallback(() => {
    setActiveWorkout((current) => {
      if (!current || current.startedAt) return current;

      const startedAt = new Date().toISOString();
      return {
        ...current,
        date: startedAt,
        startedAt,
      };
    });
  }, []);

  const cancelWorkout = useCallback(() => {
    setActiveWorkout(null);
  }, []);

  const finishWorkout = useCallback(async () => {
    setActiveWorkout((current) => {
      if (!current) return null;

      const finishedAt = Date.now();
      const startedAt = current.startedAt ?? new Date(finishedAt).toISOString();
      const durationSec = Math.max(
        0,
        Math.floor((finishedAt - new Date(startedAt).getTime()) / 1000)
      );
      const { totalSets, totalVolume } = computeWorkoutTotals(current.exercises);

      const finished: Workout = {
        ...current,
        date: startedAt,
        startedAt,
        duration: durationSec,
        totalSets,
        totalVolume,
      };

      // Prepend to history (newest first)
      setHistory((prev) => [finished, ...prev]);
      return null;
    });
  }, []);

  const deleteWorkout = useCallback((workoutId: string) => {
    setHistory((prev) => prev.filter((workout) => workout.id !== workoutId));
  }, []);

  const updateWorkoutMetadata = useCallback(
    (workoutId: string, patch: UpdateWorkoutMetadataInput) => {
      let updatedWorkout: Workout | undefined;

      setHistory((prev) => {
        const next = prev.map((workout) => {
          if (workout.id !== workoutId) return workout;

          const date = patch.date || workout.date;
          updatedWorkout = {
            ...workout,
            title: patch.title?.trim() || workout.title,
            date,
            startedAt: workout.startedAt ? date : workout.startedAt,
            notes: patch.notes !== undefined ? patch.notes.trim() || undefined : workout.notes,
            updatedAt: new Date().toISOString(),
          };

          return updatedWorkout;
        });

        return sortWorkouts(next);
      });

      return updatedWorkout;
    },
    []
  );

  const updateWorkoutDetails = useCallback(
    (workoutId: string, patch: UpdateWorkoutDetailsInput) => {
      let updatedWorkout: Workout | undefined;

      setHistory((prev) => {
        const next = prev.map((workout) => {
          if (workout.id !== workoutId) return workout;

          const date = patch.date || workout.date;
          const exercises = normalizeWorkoutExercises(patch.exercises);
          const { totalSets, totalVolume } = computeWorkoutTotals(exercises);

          updatedWorkout = {
            ...workout,
            title: patch.title?.trim() || workout.title,
            date,
            startedAt: workout.startedAt ? date : workout.startedAt,
            notes: patch.notes !== undefined ? patch.notes.trim() || undefined : workout.notes,
            exercises,
            totalSets,
            totalVolume,
            updatedAt: new Date().toISOString(),
          };

          return updatedWorkout;
        });

        return sortWorkouts(next);
      });

      return updatedWorkout;
    },
    []
  );

  const getWorkoutById = useCallback(
    (workoutId: string) => history.find((workout) => workout.id === workoutId),
    [history]
  );

  const repeatWorkout = useCallback(
    (workoutId: string) => {
      const workout = history.find((item) => item.id === workoutId);
      if (!workout || workout.exercises.length === 0) {
        return false;
      }

      setActiveWorkout({
        id: makeId('wk'),
        title: workout.title,
        date: new Date().toISOString(),
        duration: 0,
        exercises: workout.exercises.map((exercise) => ({
          id: makeId('we'),
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          muscleGroup: exercise.muscleGroup,
          sets: exercise.sets.map((set, index) => ({
            id: makeId('set'),
            setNumber: index + 1,
            weight: Math.max(0, Number.isFinite(set.weight) ? set.weight : 0),
            reps: Math.max(0, Number.isFinite(set.reps) ? set.reps : 0),
            completed: false,
            notes: set.notes,
          })),
        })),
        notes: workout.notes,
        totalSets: 0,
        totalVolume: 0,
      });

      return true;
    },
    [history]
  );

  const setWorkoutTitle = useCallback((title: string) => {
    setActiveWorkout((current) => (current ? { ...current, title } : current));
  }, []);

  const setWorkoutNotes = useCallback((notes: string) => {
    setActiveWorkout((current) => (current ? { ...current, notes } : current));
  }, []);

  const addExerciseToWorkout = useCallback((exercise: Exercise) => {
    setActiveWorkout((current) => {
      if (!current) return current;
      const newExercise: WorkoutExercise = {
        id: makeId('we'),
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscleGroup: exercise.muscleGroup,
        sets: [
          // Seed with one empty set — feels less janky than empty-state
          {
            id: makeId('set'),
            setNumber: 1,
            weight: 0,
            reps: 0,
            completed: false,
          },
        ],
      };
      return { ...current, exercises: [...current.exercises, newExercise] };
    });
  }, []);

  const removeExerciseFromWorkout = useCallback((workoutExerciseId: string) => {
    setActiveWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.filter((ex) => ex.id !== workoutExerciseId),
      };
    });
  }, []);

  const addSet = useCallback((workoutExerciseId: string) => {
    setActiveWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((ex) => {
          if (ex.id !== workoutExerciseId) return ex;
          // Carry over last set's weight/reps as defaults — small UX win
          const last = ex.sets[ex.sets.length - 1];
          return {
            ...ex,
            sets: [
              ...ex.sets,
              {
                id: makeId('set'),
                setNumber: ex.sets.length + 1,
                weight: last?.weight ?? 0,
                reps: last?.reps ?? 0,
                completed: false,
              },
            ],
          };
        }),
      };
    });
  }, []);

  const updateSet = useCallback(
    (
      workoutExerciseId: string,
      setId: string,
      patch: Partial<Pick<WorkoutSet, 'weight' | 'reps' | 'notes' | 'completed'>>
    ) => {
      setActiveWorkout((current) => {
        if (!current) return current;
        return {
          ...current,
          exercises: current.exercises.map((ex) => {
            if (ex.id !== workoutExerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
            };
          }),
        };
      });
    },
    []
  );

  const removeSet = useCallback((workoutExerciseId: string, setId: string) => {
    setActiveWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((ex) => {
          if (ex.id !== workoutExerciseId) return ex;
          // Renumber remaining sets
          const remaining = ex.sets.filter((s) => s.id !== setId);
          return {
            ...ex,
            sets: remaining.map((s, i) => ({ ...s, setNumber: i + 1 })),
          };
        }),
      };
    });
  }, []);

  const createRoutine = useCallback((input: CreateRoutineInput) => {
    const now = new Date().toISOString();
    const routine: Routine = {
      id: makeId('rt'),
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      goal: input.goal,
      exercises: normalizeRoutineExercises(input.exercises),
      createdAt: now,
      updatedAt: now,
    };

    setRoutines((prev) => [routine, ...prev]);
    return routine;
  }, []);

  const updateRoutine = useCallback((routineId: string, input: CreateRoutineInput) => {
    let updatedRoutine: Routine | undefined;

    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine.id !== routineId) return routine;

        updatedRoutine = {
          ...routine,
          name: input.name.trim() || routine.name,
          description: input.description?.trim() || undefined,
          goal: input.goal,
          exercises: normalizeRoutineExercises(input.exercises),
          updatedAt: new Date().toISOString(),
        };

        return updatedRoutine;
      })
    );

    return updatedRoutine;
  }, []);

  const deleteRoutine = useCallback((routineId: string) => {
    setRoutines((prev) => prev.filter((routine) => routine.id !== routineId));
  }, []);

  const getRoutineById = useCallback(
    (routineId: string) => routines.find((routine) => routine.id === routineId),
    [routines]
  );

  const startWorkoutFromRoutine = useCallback(
    (routineId: string) => {
      const routine = routines.find((item) => item.id === routineId);
      if (!routine || routine.exercises.length === 0) {
        return false;
      }

      const workoutExercises: WorkoutExercise[] = routine.exercises.map((exercise) => {
        const targetSets = Math.max(1, Math.floor(exercise.targetSets || 1));
        return {
          id: makeId('we'),
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          muscleGroup: exercise.muscleGroup,
          sets: Array.from({ length: targetSets }, (_, index) => ({
            id: makeId('set'),
            setNumber: index + 1,
            weight: exercise.targetWeight ?? 0,
            reps: exercise.targetReps ?? 0,
            completed: false,
          })),
        };
      });

      setActiveWorkout({
        id: makeId('wk'),
        title: routine.name,
        date: new Date().toISOString(),
        duration: 0,
        exercises: workoutExercises,
        notes: routine.description,
        totalSets: 0,
        totalVolume: 0,
      });

      return true;
    },
    [routines]
  );

  const value = useMemo<WorkoutContextValue>(
    () => ({
      activeWorkout,
      startWorkout,
      startWorkoutTimer,
      cancelWorkout,
      finishWorkout,
      setWorkoutTitle,
      setWorkoutNotes,
      addExerciseToWorkout,
      removeExerciseFromWorkout,
      addSet,
      updateSet,
      removeSet,
      history,
      historyLoaded,
      deleteWorkout,
      updateWorkoutMetadata,
      updateWorkoutDetails,
      getWorkoutById,
      repeatWorkout,
      routines,
      routinesLoaded,
      createRoutine,
      updateRoutine,
      deleteRoutine,
      getRoutineById,
      startWorkoutFromRoutine,
    }),
    [
      activeWorkout,
      startWorkout,
      startWorkoutTimer,
      cancelWorkout,
      finishWorkout,
      setWorkoutTitle,
      setWorkoutNotes,
      addExerciseToWorkout,
      removeExerciseFromWorkout,
      addSet,
      updateSet,
      removeSet,
      history,
      historyLoaded,
      deleteWorkout,
      updateWorkoutMetadata,
      updateWorkoutDetails,
      getWorkoutById,
      repeatWorkout,
      routines,
      routinesLoaded,
      createRoutine,
      updateRoutine,
      deleteRoutine,
      getRoutineById,
      startWorkoutFromRoutine,
    ]
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout(): WorkoutContextValue {
  const ctx = useContext(WorkoutContext);
  if (!ctx) {
    throw new Error('useWorkout must be used inside <WorkoutProvider>');
  }
  return ctx;
}
