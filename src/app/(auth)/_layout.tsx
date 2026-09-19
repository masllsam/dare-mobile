import { Redirect, Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/context/AuthProvider';
import { Colors } from '@/theme';

export default function AuthLayout() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'signedIn') {
      router.replace('/(tabs)');
    }
  }, [status, router]);

  if (status === 'signedIn') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg }} />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
  );
}
