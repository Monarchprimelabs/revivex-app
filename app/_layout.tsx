import React from 'react';
import { router, Stack, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../src/theme/theme';
import { WorkoutProvider } from '../src/context/WorkoutContext';
import { RunProvider } from '../src/context/RunContext';
import { HybridProvider } from '../src/context/HybridContext';
import { ProfileProvider, useProfile } from '../src/context/ProfileContext';

/**
 * Root layout for the whole app.
 * Wraps everything in providers and renders the navigation stack.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <ProfileProvider>
          <WorkoutProvider>
            <RunProvider>
              <HybridProvider>
                <StatusBar style="light" />
                <OnboardingGate />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen
                    name="profile/index"
                    options={{
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="profile/edit"
                    options={{
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="workout/active"
                    options={{
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                    }}
                  />
                  <Stack.Screen
                    name="workout/exercise-picker"
                    options={{
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                    }}
                  />
                  <Stack.Screen
                    name="workout/[id]"
                    options={{
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="routine/create"
                    options={{
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                    }}
                  />
                  <Stack.Screen
                    name="routine/[id]"
                    options={{
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="run/log"
                    options={{
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                    }}
                  />
                  <Stack.Screen
                    name="run/history"
                    options={{
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="run/[id]"
                    options={{
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="hybrid/start"
                    options={{
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="hybrid/active"
                    options={{
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                    }}
                  />
                  <Stack.Screen
                    name="hybrid/history"
                    options={{
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="hybrid/[id]"
                    options={{
                      animation: 'slide_from_right',
                    }}
                  />
                </Stack>
              </HybridProvider>
            </RunProvider>
          </WorkoutProvider>
        </ProfileProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function OnboardingGate() {
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();
  const { onboardingCompleted, profile, profileLoaded } = useProfile();

  React.useEffect(() => {
    if (!rootNavigationState?.key || !profileLoaded) return;

    const isOnboardingRoute = segments[0] === 'onboarding';
    const needsOnboarding = !onboardingCompleted || !profile;

    if (needsOnboarding && !isOnboardingRoute) {
      router.replace('/onboarding');
      return;
    }

    if (!needsOnboarding && isOnboardingRoute) {
      router.replace('/');
    }
  }, [onboardingCompleted, profile, profileLoaded, rootNavigationState?.key, segments]);

  return null;
}
