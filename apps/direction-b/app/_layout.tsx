import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors, useRevivexFonts } from '@revivex/design-system';
import { View } from 'react-native';

/**
 * Root layout for Revive X Direction B (daily coach).
 * Providers for readiness, plans and cloud sync arrive with the vertical slice.
 */
export default function RootLayout() {
  const fontsReady = useRevivexFonts();
  if (!fontsReady) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
