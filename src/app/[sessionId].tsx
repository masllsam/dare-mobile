import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import * as api from '@/api';
import { assetUrl, errorMessage } from '@/api/client';
import type { SessionDetail } from '@/api/types';
import { useAuth } from '@/context/AuthProvider';
import { proofIcon } from '@/app/(tabs)/browse';
import {
  Badge,
  Button,
  Card,
  ErrorText,
  SectionTitle,
  Spinner,
} from '@/components/ui';
import { Colors, Spacing, rarityColor, rarityLabel } from '@/theme';

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function statusTone(status: string): string {
  switch (status) {
    case 'pending_acceptance':
      return Colors.gold;
    case 'accepted':
      return Colors.blue;
    case 'active_timer_running':
      return Colors.amber;
    case 'pending_verification':
      return Colors.purple;
    case 'completed_success':
      return Colors.green;
    case 'completed_failed':
      return Colors.red;
    case 'declined':
      return Colors.textFaint;
    case 'expired':
      return Colors.red;
    default:
      return Colors.textMuted;
  }
}

const STATUS_COPY: Record<string, string> = {
  pending_acceptance: 'Open challenge — waiting for a challenger to accept',
  accepted: 'Accepted — ready to roll and start the timer',
  active_timer_running: 'Timer is running — proof or forfeit',
  pending_verification: 'Proof submitted — awaiting verification',
  completed_success: 'Dare completed — bounty released',
  completed_failed: 'Dare failed — stake forfeited',
  declined: 'Challenge was declined',
  expired: 'Timer expired — bounty refunded',
};

export default function SessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const router = useRouter();
  const { user, token } = useAuth();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authNeeded, setAuthNeeded] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = () =>
    api.getSession(sessionId ?? '', token ?? null).then((s) => {
      setSession(s);
      return s;
    });

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setAuthNeeded(false);
    if (!sessionId) {
      setError('Invalid session id.');
      return;
    }
    api
      .getSession(sessionId, token ?? null)
      .then((s) => {
        if (cancelled) return;
        setSession(s);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof Error && 'status' in e && (e as { status?: number }).status === 401) {
          setAuthNeeded(true);
        } else {
          setError(errorMessage(e));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, token]);

  // 1s tick for the countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const isChallenger = !!(session && user && session.challenger_id === user.id);
  const isRecipient = !!(session && user && session.recipient_id === user.id);
  const isParticipant = isChallenger || isRecipient;

  const deadlineMs = useMemo(() => {
    if (!session?.timer_started_at) return null;
    const start = new Date(session.timer_started_at).getTime();
    if (Number.isNaN(start)) return null;
    return start + (session.timer_minutes ?? 0) * 60 * 1000;
  }, [session?.timer_started_at, session?.timer_minutes]);

  const timerState = useMemo(() => {
    if (!session) return null;
    if (session.status === 'active_timer_running' && deadlineMs) {
      const remaining = Math.round((deadlineMs - now) / 1000);
      return { running: true, remaining, expired: remaining <= 0 };
    }
    return { running: false, remaining: null, expired: false };
  }, [session, deadlineMs, now]);

  async function runAction(label: string, fn: () => Promise<unknown>) {
    setActing(label);
    setActionError(null);
    try {
      await fn();
      if (sessionId) await load();
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setActing(null);
    }
  }

  const canAccept = isParticipant && session?.status === 'pending_acceptance' && !isChallenger;
  const canDecline = canAccept;
  const canRoll = isChallenger && ['pending_acceptance', 'accepted'].includes(session?.status ?? '');
  const canStartTimer =
    isChallenger &&
    ['accepted', 'active_timer_running'].includes(session?.status ?? '') &&
    !session?.timer_started_at;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'CHALLENGE' }} />
      <ScrollView
        contentContainerStyle={{ padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three }}
        showsVerticalScrollIndicator={false}>
        <ErrorText>{error}</ErrorText>

        {authNeeded ? (
          <Card style={{ gap: Spacing.two, alignItems: 'center' }}>
            <Text style={{ color: Colors.text, fontSize: 15, fontWeight: 700, textAlign: 'center' }}>
              This challenge needs a signed-in account to view.
            </Text>
            <Button label="Sign in" onPress={() => router.push('/(auth)/login')} />
          </Card>
        ) : null}

        {!session && !error && !authNeeded ? <Spinner label="Loading session…" /> : null}

        {session ? (
          <>
            {/* Status banner */}
            <Card
              style={{
                gap: 6,
                borderWidth: 1.5,
                borderColor: statusTone(session.status),
                backgroundColor: 'rgba(255,255,255,0.02)',
              }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text
                  style={{
                    color: statusTone(session.status),
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                  }}>
                  {session.status.replaceAll('_', ' ')}
                </Text>
                <Text style={{ color: Colors.amber, fontSize: 15, fontWeight: 900 }}>
                  {Math.round(session.bounty_amount).toLocaleString()} ⚡
                </Text>
              </View>
              <Text style={{ color: Colors.textMuted, fontSize: 12, lineHeight: 17 }}>
                {STATUS_COPY[session.status] ?? 'Challenge in progress'}
              </Text>
            </Card>

            {/* Timer */}
            {timerState?.running ? (
              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: timerState.expired ? Colors.red : Colors.amber,
                  backgroundColor: timerState.expired ? 'rgba(224,122,122,0.08)' : 'rgba(251,191,36,0.06)',
                  paddingVertical: Spacing.three,
                  alignItems: 'center',
                  gap: 4,
                }}>
                <Text
                  style={{
                    color: timerState.expired ? Colors.red : Colors.amber,
                    fontSize: 42,
                    fontWeight: 900,
                    fontVariant: ['tabular-nums'],
                    letterSpacing: 2,
                  }}>
                  {timerState.expired ? '00:00' : formatClock(timerState.remaining ?? 0)}
                </Text>
                <Text style={{ color: Colors.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
                  {timerState.expired ? 'Time is up — awaiting resolution' : 'Time remaining'}
                </Text>
              </View>
            ) : null}

            {/* Challenge detail */}
            <Card style={{ gap: Spacing.two }}>
              {session.dare?.image_url ? (
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <View
                    style={{
                      width: 44,
                      height: 58,
                      borderRadius: 7,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: rarityColor(session.dare.rarity),
                    }}>
                    <Text style={{ fontSize: 10 }}>
                      {proofIcon(session.dare.proof_type)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: Colors.text, fontSize: 14, fontWeight: 800 }}>
                      {session.dare.title}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                      <Badge label={rarityLabel(session.dare.rarity)} color={rarityColor(session.dare.rarity)} />
                      <Badge label={`⏱ ${session.timer_minutes} min`} color={Colors.blue} />
                    </View>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: Colors.text, fontSize: 14, fontWeight: 800 }}>
                    {session.dare?.title ?? 'Custom challenge'}
                  </Text>
                  <Badge label={`⏱ ${session.timer_minutes} min`} color={Colors.blue} />
                </View>
              )}

              <Text style={{ color: Colors.text, fontSize: 15, lineHeight: 22 }}>
                {session.final_description}
              </Text>

              {session.rolled_variables && Object.keys(session.rolled_variables).length > 0 ? (
                <View style={{ gap: 6 }}>
                  <SectionTitle>Rolled slots</SectionTitle>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(session.rolled_variables).map(([k, v]) => (
                      <View
                        key={k}
                        style={{
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: 'rgba(147,184,154,0.5)',
                          backgroundColor: 'rgba(147,184,154,0.1)',
                          paddingVertical: 4,
                          paddingHorizontal: 10,
                        }}>
                        <Text style={{ color: Colors.green, fontSize: 12, fontWeight: 600 }}>
                          {k}: {v}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {session.stake_type && session.stake_type !== 'clout' ? (
                  <Badge label={`stake: ${session.stake_type}`} color={Colors.purple} />
                ) : null}
                {session.is_ante ? <Badge label="ante card" color={Colors.pink} /> : null}
                {session.proof_type ? (
                  <Badge label={`${proofIcon(session.proof_type)} ${session.proof_type}`} color={Colors.slate} />
                ) : null}
              </View>

              {session.custom_stake ? (
                <Text style={{ color: Colors.textMuted, fontSize: 12, lineHeight: 17 }}>
                  <Text style={{ color: Colors.text, fontWeight: 700 }}>Stake: </Text>
                  {session.custom_stake}
                </Text>
              ) : null}
              {session.custom_penalty ? (
                <Text style={{ color: Colors.textMuted, fontSize: 12, lineHeight: 17 }}>
                  <Text style={{ color: Colors.text, fontWeight: 700 }}>Penalty: </Text>
                  {session.custom_penalty}
                </Text>
              ) : null}
            </Card>

            {/* Participants */}
            <Card style={{ flexDirection: 'row', gap: Spacing.two }}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: Colors.textFaint, fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Challenger
                </Text>
                <Text style={{ color: Colors.text, fontSize: 13, fontWeight: 700, flexShrink: 1 }}>
                  {session.challenger?.username ?? `user #${session.challenger_id}`}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: Colors.textFaint, fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Recipient
                </Text>
                <Text style={{ color: session.recipient ? Colors.text : Colors.textFaint, fontSize: 13, fontWeight: 700, flexShrink: 1 }}>
                  {session.recipient?.username ?? (session.status === 'pending_acceptance' ? 'open to anyone' : '—')}
                </Text>
              </View>
            </Card>

            <ErrorText>{actionError}</ErrorText>

            {/* Actions */}
            {(canAccept || canRoll || canStartTimer) ? (
              <View style={{ gap: Spacing.one }}>
                {canAccept ? (
                  <>
                    <Button
                      label="Accept challenge"
                      onPress={() => runAction('accept', () => api.acceptSession(session.id, token!))}
                      loading={acting === 'accept'}
                    />
                    <Button
                      variant="danger"
                      label="Decline"
                      onPress={() => runAction('decline', () => api.declineSession(session.id, token!))}
                      loading={acting === 'decline'}
                    />
                  </>
                ) : null}
                {canRoll ? (
                  <Button
                    variant="subtle"
                    label="🎲 Roll variables"
                    onPress={() => runAction('roll', () => api.rollSession(session.id, token!))}
                    loading={acting === 'roll'}
                  />
                ) : null}
                {canStartTimer ? (
                  <Button
                    label="▶ Start timer"
                    onPress={() => runAction('timer', () => api.startTimer(session.id, token!))}
                    loading={acting === 'timer'}
                  />
                ) : null}
              </View>
            ) : (
              <Text style={{ color: Colors.textFaint, fontSize: 12, textAlign: 'center' }}>
                {isParticipant
                  ? 'No actions available for the current status.'
                  : 'Sign in as a participant to act on this challenge.'}
              </Text>
            )}

            {/* Share link */}
            {session.telegram_share_link ? (
              <Card style={{ gap: 6 }}>
                <SectionTitle>Share with a friend</SectionTitle>
                <Text style={{ color: Colors.textMuted, fontSize: 12, lineHeight: 18 }}>
                  {session.telegram_share_link}
                </Text>
              </Card>
            ) : null}

            <Button
              variant="ghost"
              label="← Back to home"
              onPress={() => router.navigate('/(tabs)')}
            />
          </>
        ) : null}
      </ScrollView>
    </>
  );
}
