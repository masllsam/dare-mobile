import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { Colors } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.amber,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#0d1218',
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
        sceneStyle: { backgroundColor: Colors.bg },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 17, fontWeight: 700, color }}>⌂</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 16, fontWeight: 700, color }}>▤</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 17, fontWeight: 700, color }}>▷</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 17, fontWeight: 700, color }}>◉</Text>
          ),
        }}
      />
    </Tabs>
  );
}
