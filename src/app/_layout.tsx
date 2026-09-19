import { Redirect, Stack, ThemeProvider, DarkTheme } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { Colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

const dareTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.amber,
    background: Colors.bg,
    card: Colors.surface,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.amber,
  },
};

const detailHeaderOptions = {
  headerShown: true,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: Colors.bg },
  headerTintColor: Colors.text,
  headerTitleStyle: { fontWeight: '800' as const, fontSize: 14 },
} as const;

function RootNavigator() {
  const { status } = useAuth();
  const restoring = status === 'restoring';

  useEffect(() => {
    if (!restoring) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [restoring]);

  if (restoring) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg }} />;
  }

  if (status === 'signedOut') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'default',
      }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="[dareId]"
        options={{ ...detailHeaderOptions, title: 'DARE CARD' }}
      />
      <Stack.Screen
        name="[sessionId]"
        options={{ ...detailHeaderOptions, title: 'CHALLENGE' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={dareTheme}>
      <StatusBar style="light" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
