import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import * as api from '@/api';
import { assetUrl, errorMessage } from '@/api/client';
import type { EnergyPack, SessionDetail, Transaction, WalletBalance } from '@/api/types';
import { useAuth } from '@/context/AuthProvider';
import {
  Badge,
  Button,
  Card,
  ErrorText,
  SectionTitle,
  Screen,
  ScreenScroll,
  Spinner,
} from '@/components/ui';
import { Colors, Spacing, rarityColor, rarityLabel } from '@/theme';

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
    default:
      return Colors.textMuted;
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'pending_acceptance':
      return 'Awaiting accept';
    case 'accepted':
      return 'Accepted';
    case 'active_timer_running':
      return 'Timer running';
    case 'pending_verification':
      return 'Verifying proof';
    default:
      return status.replaceAll('_', ' ');
  }
}

interface WalletData {
  balance: WalletBalance;
  packs: EnergyPack[];
  transactions: Transaction[];
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, token, refreshUser, setUser } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionDetail[] | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    if (!token) return;
    try {
      setWalletError(null);
      const [balance, packs, transactions] = await Promise.all([
        api.getWalletBalance(token),
        api.listPacks(),
        api.listTransactions(token),
      ]);
      setWallet({ balance, packs, transactions });
    } catch (e) {
      setWalletError(errorMessage(e));
    }
  }, [token]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    if (!token) return;
    api
      .getActiveSessions(token)
      .then(setSessions)
      .catch((e) => setSessions(null));
  }, [token, wallet]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  async function onClaimDaily() {
    if (!token || !user) return;
    setClaiming(true);
    try {
      const res = await api.claimDailyReward(token);
      const next: typeof user = { ...user };
      if (typeof res.new_energy_balance === 'number') next.energy_balance = res.new_energy_balance;
      if (typeof res.usd_value === 'number') next.usd_value = res.usd_value;
      if (typeof res.energy_reward === 'number') next.streak = (user.streak ?? 0) + 1;
      next.can_claim_daily = false;
      setUser(next);
      await Promise.all([loadWallet(), refreshUser()]);
      showToast(res.message || `+${res.energy_reward ?? 100} ⚡ claimed`);
    } catch (e) {
      showToast(errorMessage(e));
    } finally {
      setClaiming(false);
    }
  }

  async function onRandomDare() {
    try {
      const dare = await api.randomDare(token ?? null);
      router.push(`/dareId?dareId=${dare.id}`);
    } catch (e) {
      showToast(errorMessage(e));
    }
  }

  if (!user) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Spinner label="Connecting…" />
        </View>
      </Screen>
    );
  }

  const b = wallet?.balance ?? null;

  return (
    <ScreenScroll edges={['top', 'left', 'right']}>
      {/* Greeting */}
      <View style={{ marginBottom: Spacing.three, gap: 4 }}>
        <Text style={{ color: Colors.textMuted, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
          {user.rank_title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
          <Text style={{ color: Colors.text, fontSize: 26, fontWeight: 900, letterSpacing: 1 }}>
            {user.username}
          </Text>
          {(user.streak ?? 0) > 0 ? (
            <Text style={{ color: Colors.amber, fontSize: 13, fontWeight: 700 }}>
              🔥 {user.streak} streak
            </Text>
          ) : null}
        </View>
      </View>

      {/* Energy chip -> wallet */}
      <Pressable onPress={() => setWalletOpen((v) => !v)}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 22 }}>⚡</Text>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: Colors.text, fontSize: 18, fontWeight: 800 }}>
              {(b?.energy_balance ?? user.energy_balance).toLocaleString()} Energy
            </Text>
            <Text style={{ color: Colors.textMuted, fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>
              ≈ ${(b?.usd_value ?? user.usd_value).toFixed(2)} USD ·{' '}
              {(b?.escrow_energy_locked ?? 0).toLocaleString()} in escrow
            </Text>
          </View>
          <Text style={{ color: walletOpen ? Colors.amber : Colors.textMuted, fontSize: 14 }}>
            {walletOpen ? '▾' : '▸'}
          </Text>
        </Card>
      </Pressable>

      {/* Wallet section */}
      {walletOpen ? (
        <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
          <ErrorText>{walletError}</ErrorText>
          <Button
            variant={user.can_claim_daily ? 'primary' : 'subtle'}
            label={user.can_claim_daily ? 'Claim daily +100 ⚡' : 'Daily claim available tomorrow'}
            onPress={onClaimDaily}
            disabled={!user.can_claim_daily}
            loading={claiming}
          />

          <SectionTitle>Energy packs</SectionTitle>
          {wallet?.packs.length ? (
            <View style={{ gap: Spacing.one }}>
              {wallet.packs.map((p) => (
                <Card key={p.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <Text style={{ color: Colors.text, fontSize: 14, fontWeight: 700 }}>{p.name}</Text>
                      {p.badge ? (
                        <Badge label={p.badge} color={Colors.amber} />
                      ) : null}
                    </View>
                    <Text style={{ color: Colors.textMuted, fontSize: 12 }}>
                      {p.energy.toLocaleString()} ⚡ {p.description ? `· ${p.description}` : ''}
                    </Text>
                  </View>
                  <Text style={{ color: Colors.amber, fontSize: 14, fontWeight: 800 }}>
                    ${p.price_usd.toFixed(2)}
                  </Text>
                </Card>
              ))}
            </View>
          ) : (
            <Spinner label="Loading packs…" />
          )}

          <SectionTitle>Transactions</SectionTitle>
          {wallet?.transactions.length ? (
            <View style={{ gap: Spacing.one }}>
              {wallet.transactions.slice(0, 8).map((t) => (
                <Card key={t.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: Colors.text, fontSize: 13, fontWeight: 600, flexShrink: 1 }}>
                      {t.description ?? t.transaction_type}
                    </Text>
                    <Text style={{ color: Colors.textFaint, fontSize: 11 }}>
                      {new Date(t.created_at).toLocaleDateString()} · {t.transaction_type}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: t.amount >= 0 ? Colors.green : Colors.red,
                      fontSize: 13,
                      fontWeight: 800,
                      marginLeft: Spacing.two,
                    }}>
                    {t.amount >= 0 ? '+' : ''}
                    {t.amount.toLocaleString()} ⚡
                  </Text>
                </Card>
              ))}
            </View>
          ) : (
            <Text style={{ color: Colors.textFaint, fontSize: 12 }}>No transactions yet.</Text>
          )}
        </View>
      ) : null}

      {/* Random dare */}
      <View style={{ marginTop: Spacing.three, gap: Spacing.two }}>
        <SectionTitle>Feeling brave?</SectionTitle>
        <Button label="🎲 Random dare" onPress={onRandomDare} />
      </View>

      {/* Active challenges */}
      <View style={{ marginTop: Spacing.four, gap: Spacing.two }}>
        <SectionTitle>Active challenges</SectionTitle>
        {sessions === null ? (
          <Spinner label="Loading challenges…" />
        ) : sessions.length === 0 ? (
          <Text style={{ color: Colors.textFaint, fontSize: 13, lineHeight: 18 }}>
            No open challenges. Browse the deck and start one — your energy bounty gets locked in
            escrow until the dare is settled.
          </Text>
        ) : (
          <View style={{ gap: Spacing.one }}>
            {sessions.slice(0, 5).map((s) => {
              const title = s.dare?.title ?? 'Custom challenge';
              const rc = s.dare ? rarityColor(s.dare.rarity) : Colors.textMuted;
              return (
                <Pressable key={s.id} onPress={() => router.push(`/sessionId?sessionId=${s.id}`)}>
                  <Card style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                      <Text style={{ color: Colors.text, fontSize: 15, fontWeight: 800, flexShrink: 1 }}>
                        {title}
                      </Text>
                      <Text style={{ color: Colors.amber, fontSize: 13, fontWeight: 800 }}>
                        {Math.round(s.bounty_amount).toLocaleString()} ⚡
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Badge label={statusLabel(s.status)} color={statusTone(s.status)} />
                      {s.dare ? (
                        <Badge label={rarityLabel(s.dare.rarity)} color={rc} />
                      ) : null}
                      <Text style={{ color: Colors.textFaint, fontSize: 11, marginLeft: 'auto' }}>
                        {s.timer_minutes} min
                      </Text>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Toast */}
      {toast ? (
        <View
          style={{
            position: 'absolute',
            bottom: Spacing.four,
            alignSelf: 'center',
            backgroundColor: Colors.surfaceRaised,
            borderWidth: 1,
            borderColor: Colors.borderStrong,
            borderRadius: 999,
            paddingHorizontal: 18,
            paddingVertical: 10,
            maxWidth: '85%',
          }}>
          <Text style={{ color: Colors.text, fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
            {toast}
          </Text>
        </View>
      ) : null}
    </ScreenScroll>
  );
}
