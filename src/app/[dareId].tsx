import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import * as api from '@/api';
import { assetUrl, errorMessage } from '@/api/client';
import type { Dare } from '@/api/types';
import { useAuth } from '@/context/AuthProvider';
import { proofIcon } from '@/app/(tabs)/browse';
import {
  Badge,
  Button,
  Card,
  ErrorText,
  Meter,
  SectionTitle,
  Spinner,
} from '@/components/ui';
import { Colors, Spacing, withAlpha, rarityColor, rarityLabel } from '@/theme';

export default function DareDetailScreen() {
  const { dareId } = useLocalSearchParams<{ dareId?: string }>();
  const router = useRouter();
  const { user, token } = useAuth();

  const [dare, setDare] = useState<Dare | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rolled, setRolled] = useState<Record<string, string> | null>(null);
  const [rolledFinal, setRolledFinal] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const id = dareId ? Number(dareId) : NaN;

  useEffect(() => {
    let cancelled = false;
    if (!Number.isFinite(id)) {
      setError('Invalid dare id.');
      return;
    }
    api
      .getDare(id, token ?? null)
      .then((d) => !cancelled && setDare(d))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  const rc = useMemo(() => (dare ? rarityColor(dare.rarity) : Colors.slate), [dare]);

  const onRoll = useCallback(async () => {
    if (!dare) return;
    setRolling(true);
    setStartError(null);
    try {
      const res = await api.rollDareVariables(dare, token ?? null);
      setRolled(res.rolled_variables);
      setRolledFinal(res.final_description);
    } catch (e) {
      setStartError(errorMessage(e));
    } finally {
      setRolling(false);
    }
  }, [dare, token]);

  const onOpenChallenge = useCallback(async () => {
    if (!dare || !token) return;
    setStarting(true);
    setStartError(null);
    try {
      const session = await api.createSession(
        {
          dare_id: dare.id,
          bounty_amount: dare.default_bounty,
          initial_variables: rolled ?? undefined,
        },
        token,
      );
      router.push(`/sessionId?sessionId=${session.id}`);
    } catch (e) {
      setStartError(errorMessage(e));
      setStarting(false);
    }
  }, [dare, token, rolled, router]);

  const variableEntries = useMemo(
    () =>
      dare?.variables
        ? (Object.entries(dare.variables) as [string, string[] | string | null][])
        : [],
    [dare],
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'DARE CARD' }} />
      <ScrollView
        contentContainerStyle={{ padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three }}
        showsVerticalScrollIndicator={false}>
        <ErrorText>{error}</ErrorText>
        {!dare && !error ? <Spinner label="Loading card…" /> : null}

        {dare ? (
          <>
            {/* Card visual */}
            <View
              style={{
                borderRadius: 18,
                borderWidth: 1.5,
                borderColor: rc,
                backgroundColor: Colors.surface,
                overflow: 'hidden',
                shadowColor: rc,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.35,
                shadowRadius: 22,
                elevation: 8,
              }}>
              {dare.image_url ? (
                <Image
                  source={{ uri: assetUrl(dare.image_url) ?? undefined }}
                  style={{ width: '100%', height: 210 }}
                  contentFit="cover"
                  transition={250}
                />
              ) : (
                <View
                  style={{
                    height: 140,
                    backgroundColor: withAlpha(rc, '14'),
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Text style={{ fontSize: 40 }}>{proofIcon(dare.proof_type)}</Text>
                  </View>
              )}
              <View style={{ padding: Spacing.three, gap: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <Badge label={rarityLabel(dare.rarity)} color={rc} />
                  <Text style={{ color: Colors.amber, fontSize: 15, fontWeight: 900 }}>
                    {Math.round(dare.default_bounty).toLocaleString()} ⚡ bounty
                  </Text>
                </View>
                <Text style={{ color: Colors.text, fontSize: 22, fontWeight: 900, letterSpacing: 0.5 }}>
                  {dare.title}
                </Text>
                <Text style={{ color: Colors.textMuted, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                  {dare.category}
                  {dare.deck_set ? ` · ${dare.deck_set}` : ''}
                </Text>
                <Text style={{ color: Colors.text, fontSize: 14, lineHeight: 21 }}>
                  {rolledFinal ?? dare.description}
                </Text>
              </View>
            </View>

            {/* Variable slots */}
            {variableEntries.length > 0 ? (
              <Card style={{ gap: 8 }}>
                <SectionTitle>Dynamic slots</SectionTitle>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {variableEntries.map(([key, options]) => {
                    const rolledValue = rolled?.[key];
                    const sample = Array.isArray(options) ? options[0] : typeof options === 'string' ? options : null;
                    return (
                      <View
                        key={key}
                        style={{
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: rolledValue ? withAlpha(Colors.green, '88') : Colors.border,
                          backgroundColor: rolledValue ? 'rgba(147,184,154,0.12)' : 'rgba(255,255,255,0.03)',
                          paddingVertical: 5,
                          paddingHorizontal: 10,
                        }}>
                        <Text
                          style={{
                            color: rolledValue ? Colors.green : Colors.textMuted,
                            fontSize: 12,
                            fontWeight: 600,
                          }}>
                          {rolledValue ?? `[${key}]`}
                          {!rolledValue && sample ? ` · e.g. ${sample}` : ''}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                <Button
                  variant="subtle"
                  label={rolled ? '🎲 Roll again' : '🎲 Roll variables'}
                  onPress={onRoll}
                  loading={rolling}
                  style={{ marginTop: 4 }}
                />
              </Card>
            ) : null}

            {/* Meters + meta */}
            <Card style={{ gap: Spacing.two }}>
              <Meter label="Spiciness" value={dare.spiciness_level ?? 0} color={Colors.pink} />
              <Meter label="Embarrassment" value={dare.embarrassment_level ?? 0} color={Colors.purple} />
              <Meter label="Danger" value={dare.danger_level ?? 0} color={Colors.red} />
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                <Badge label={`⏱ ${dare.timer_minutes} min`} color={Colors.blue} />
                <Badge label={`${proofIcon(dare.proof_type)} ${dare.proof_type} proof`} color={Colors.slate} />
                {dare.is_public ? <Badge label="public arena" color={Colors.textMuted} /> : null}
              </View>
            </Card>

            {/* Start challenge */}
            <View style={{ gap: Spacing.two }}>
              <ErrorText>{startError}</ErrorText>
              {!user ? (
                <>
                  <Button label="Sign in to start a challenge" onPress={() => router.push('/(auth)/login')} />
                  <Text style={{ color: Colors.textFaint, fontSize: 12, textAlign: 'center' }}>
                    Your Energy bounty is locked in escrow until the dare is settled.
                  </Text>
                </>
              ) : dare.is_owned ? (
                <Button
                  label={`Start challenge · stake ${Math.round(dare.default_bounty).toLocaleString()} ⚡`}
                  onPress={onOpenChallenge}
                  loading={starting}
                />
              ) : (
                <>
                  <Button
                    label="Start challenge"
                    onPress={onOpenChallenge}
                    loading={starting}
                    variant="subtle"
                  />
                  <Text style={{ color: Colors.textFaint, fontSize: 12, textAlign: 'center', lineHeight: 17 }}>
                    You don’t own this card yet. Opening a challenge with it stakes your card as the
                    ante — you’ll risk it if you lose.
                  </Text>
                </>
              )}
              <Text style={{ color: Colors.textFaint, fontSize: 11, textAlign: 'center' }}>
                Open challenge: anyone can accept. Live escrow matching with named opponents lands in
                P1.
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </>
  );
}
