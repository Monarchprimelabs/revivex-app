import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors, useRevivexFonts } from '@revivex/design-system';
import { AuthProvider } from '../src/context/AuthContext';
import { CoachProvider } from '../src/context/CoachContext';
import { SyncProvider } from '../src/sync/SyncContext';

/**
 * Root layout for Revive X Direction B (daily coach).
 * Today is home. Check-in is a modal. History, plan detail, settings and
 * account slide in from the right. No tab bar.
 */
export default function RootLayout() {
  const fontsReady = useRevivexFonts();
  if (!fontsReady) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <AuthProvider>
          <CoachProvider>
            <SyncProvider>
              <StatusBar style="light" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="checkin" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="complete" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="plan/[id]" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="history" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="account" options={{ animation: 'slide_from_right' }} />
              </Stack>
            </SyncProvider>
          </CoachProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
