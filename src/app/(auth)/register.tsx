import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthProvider';
import { Button, ErrorText } from '@/components/ui';
import { Colors, Spacing } from '@/theme';
import { Field } from './login';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (username.trim().length < 3) {
      setError('Username needs at least 3 characters (letters, numbers, _ . -).');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password needs at least 8 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register(username.trim(), email.trim(), password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: Spacing.four }}
          keyboardShouldPersistTaps="handled">
          <View style={{ gap: Spacing.three, maxWidth: 420, alignSelf: 'stretch' }}>
            <View style={{ marginBottom: Spacing.three }}>
              <Text style={{ fontSize: 30, fontWeight: 900, letterSpacing: 6, color: Colors.amber }}>
                DARE
              </Text>
              <Text
                style={{
                  color: Colors.textMuted,
                  fontSize: 12,
                  marginTop: 6,
                  lineHeight: 17,
                }}>
                Create your account. You start with 500 ⚡ Energy and 21 starter cards.
              </Text>
            </View>
            <Field
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="neon_vandal"
            />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@night.city"
              keyboardType="email-address"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="min 8 characters"
              secure
              onSubmit={onSubmit}
            />
            <ErrorText>{error}</ErrorText>
            <Button
              label={busy ? 'Creating account…' : 'Join the grid'}
              onPress={onSubmit}
              loading={busy}
            />
            <Text style={{ color: Colors.textMuted, fontSize: 13, textAlign: 'center' }}>
              Already have an account?{' '}
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text style={{ color: Colors.amber, fontWeight: 700 }}>Sign in</Text>
                </Pressable>
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
