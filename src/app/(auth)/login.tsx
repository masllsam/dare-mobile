import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthProvider';
import { Button, ErrorText } from '@/components/ui';
import { Colors, Spacing } from '@/theme';

function Brand() {
  return (
    <View style={{ alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.five }}>
      <Text style={{ fontSize: 44, fontWeight: 900, letterSpacing: 8, color: Colors.amber }}>
        DARE
      </Text>
      <Text
        style={{
          color: Colors.textMuted,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}>
        Social Trading Card Protocol
      </Text>
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  autoCapitalize = 'none',
  keyboardType,
  onSubmit,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secure?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  onSubmit?: () => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          color: Colors.textMuted,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 1.6,
          textTransform: 'uppercase',
        }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textFaint}
        secureTextEntry={secure}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        onSubmitEditing={onSubmit}
        style={{
          backgroundColor: Colors.surface,
          borderWidth: 1,
          borderColor: Colors.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          color: Colors.text,
          fontSize: 15,
        }}
      />
    </View>
  );
}

export default function LoginScreen() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (!identifier.trim() || !password) {
      setError('Enter your username/email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(identifier.trim(), password);
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
          <Brand />
          <View style={{ gap: Spacing.three, maxWidth: 420, alignSelf: 'stretch' }}>
            <Field
              label="Username or email"
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="ghost_rider"
              keyboardType="email-address"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secure
              onSubmit={onSubmit}
            />
            <ErrorText>{error}</ErrorText>
            <Button label={busy ? 'Signing in…' : 'Enter the grid'} onPress={onSubmit} loading={busy} />
            <Text style={{ color: Colors.textMuted, fontSize: 13, textAlign: 'center' }}>
              No account?{' '}
              <Link href="/(auth)/register" asChild>
                <Pressable>
                  <Text style={{ color: Colors.amber, fontWeight: 700 }}>Create one</Text>
                </Pressable>
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
