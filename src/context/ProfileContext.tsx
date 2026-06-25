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
  ExperienceLevel,
  PreferredDistanceUnit,
  PreferredWeightUnit,
  PrimaryGoal,
  TrainingFocus,
  UserProfile,
  UserProfileInput,
} from '../types';

const PROFILE_STORAGE_KEY = 'revivex.profile.v1';
const ONBOARDING_STORAGE_KEY = 'revivex.onboarding.v1';

interface ProfileContextValue {
  profile: UserProfile | null;
  profileLoaded: boolean;
  onboardingCompleted: boolean;
  saveProfile: (input: UserProfileInput) => Promise<UserProfile>;
  updateProfile: (input: Partial<UserProfileInput>) => Promise<UserProfile | null>;
  getProfile: () => UserProfile | null;
  completeOnboarding: (input: UserProfileInput) => Promise<UserProfile>;
  resetOnboarding: () => Promise<void>;
  hasCompletedOnboarding: () => boolean;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

let _profileIdCounter = 0;
function makeProfileId() {
  _profileIdCounter += 1;
  return `profile_${Date.now()}_${_profileIdCounter}`;
}

function isTrainingFocus(value: unknown): value is TrainingFocus {
  return value === 'Lift' || value === 'Run' || value === 'Hybrid' || value === 'General Fitness';
}

function isPrimaryGoal(value: unknown): value is PrimaryGoal {
  return (
    value === 'Build Strength' ||
    value === 'Build Muscle' ||
    value === 'Improve Running' ||
    value === 'Hybrid Performance' ||
    value === 'Weight Loss' ||
    value === 'General Fitness'
  );
}

function isWeightUnit(value: unknown): value is PreferredWeightUnit {
  return value === 'lb' || value === 'kg';
}

function isDistanceUnit(value: unknown): value is PreferredDistanceUnit {
  return value === 'mi' || value === 'km';
}

function isExperienceLevel(value: unknown): value is ExperienceLevel {
  return value === 'Beginner' || value === 'Intermediate' || value === 'Advanced';
}

function normalizeWeeklyTarget(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 4;
  return Math.min(6, Math.max(2, Math.floor(parsed)));
}

function normalizeUsername(username?: string): string | undefined {
  const trimmed = username?.trim().replace(/^@+/, '');
  return trimmed ? trimmed : undefined;
}

function normalizeProfileInput(
  input: Partial<UserProfileInput>,
  existing?: UserProfile | null
): UserProfile {
  const now = new Date().toISOString();
  const displayName = input.displayName?.trim() || existing?.displayName || 'ReviveX Athlete';
  const trainingFocus = isTrainingFocus(input.trainingFocus)
    ? input.trainingFocus
    : existing?.trainingFocus ?? 'Hybrid';
  const primaryGoal = isPrimaryGoal(input.primaryGoal)
    ? input.primaryGoal
    : existing?.primaryGoal ?? 'Hybrid Performance';
  const preferredWeightUnit = isWeightUnit(input.preferredWeightUnit)
    ? input.preferredWeightUnit
    : existing?.preferredWeightUnit ?? 'lb';
  const preferredDistanceUnit = isDistanceUnit(input.preferredDistanceUnit)
    ? input.preferredDistanceUnit
    : existing?.preferredDistanceUnit ?? 'mi';

  return {
    id: existing?.id ?? makeProfileId(),
    displayName,
    username: normalizeUsername(input.username ?? existing?.username),
    avatarUri: input.avatarUri?.trim() || existing?.avatarUri || undefined,
    trainingFocus,
    primaryGoal,
    experienceLevel: isExperienceLevel(input.experienceLevel)
      ? input.experienceLevel
      : isExperienceLevel(existing?.experienceLevel)
      ? existing.experienceLevel
      : 'Intermediate',
    weeklyTrainingTarget: normalizeWeeklyTarget(
      input.weeklyTrainingTarget ?? existing?.weeklyTrainingTarget
    ),
    preferredWeightUnit,
    preferredDistanceUnit,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function normalizeLoadedProfile(value: unknown): UserProfile | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<UserProfile>;
  if (!candidate.displayName || typeof candidate.displayName !== 'string') return null;
  return normalizeProfileInput(candidate as Partial<UserProfileInput>, candidate as UserProfile);
}

function parseOnboardingState(raw: string | null): boolean {
  if (!raw) return false;
  if (raw === 'true') return true;
  try {
    const parsed = JSON.parse(raw) as { completed?: unknown };
    return parsed.completed === true;
  } catch {
    return false;
  }
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [rawProfile, rawOnboarding] = await Promise.all([
          AsyncStorage.getItem(PROFILE_STORAGE_KEY),
          AsyncStorage.getItem(ONBOARDING_STORAGE_KEY),
        ]);

        if (rawProfile) {
          const parsedProfile = JSON.parse(rawProfile);
          setProfile(normalizeLoadedProfile(parsedProfile));
        }

        setOnboardingCompleted(parseOnboardingState(rawOnboarding));
      } catch (err) {
        console.warn('Failed to load profile:', err);
        setProfile(null);
        setOnboardingCompleted(false);
      } finally {
        setProfileLoaded(true);
      }
    })();
  }, []);

  const persistProfile = useCallback(async (nextProfile: UserProfile) => {
    setProfile(nextProfile);
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
    return nextProfile;
  }, []);

  const saveProfile = useCallback(
    async (input: UserProfileInput) => persistProfile(normalizeProfileInput(input, null)),
    [persistProfile]
  );

  const updateProfile = useCallback(
    async (input: Partial<UserProfileInput>) => {
      if (!profile) return null;
      return persistProfile(normalizeProfileInput(input, profile));
    },
    [persistProfile, profile]
  );

  const completeOnboarding = useCallback(
    async (input: UserProfileInput) => {
      const nextProfile = normalizeProfileInput(input, profile);
      await persistProfile(nextProfile);
      setOnboardingCompleted(true);
      await AsyncStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify({ completed: true, completedAt: new Date().toISOString() })
      );
      return nextProfile;
    },
    [persistProfile, profile]
  );

  const resetOnboarding = useCallback(async () => {
    setOnboardingCompleted(false);
    await AsyncStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({ completed: false, resetAt: new Date().toISOString() })
    );
  }, []);

  const getProfile = useCallback(() => profile, [profile]);

  const hasCompletedOnboarding = useCallback(
    () => onboardingCompleted,
    [onboardingCompleted]
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      profileLoaded,
      onboardingCompleted,
      saveProfile,
      updateProfile,
      getProfile,
      completeOnboarding,
      resetOnboarding,
      hasCompletedOnboarding,
    }),
    [
      profile,
      profileLoaded,
      onboardingCompleted,
      saveProfile,
      updateProfile,
      getProfile,
      completeOnboarding,
      resetOnboarding,
      hasCompletedOnboarding,
    ]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used inside <ProfileProvider>');
  }
  return ctx;
}
