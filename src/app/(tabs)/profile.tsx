import { Link } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import * as api from '@/api';
import type { WalletBalance } from '@/api/types';
import { useAuth } from '@/context/AuthProvider';
import { Badge, Button, Card, Screen, Spinner } from '@/components/ui';
import { Colors, Spacing } from '@/theme';

function StatBox({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.surfaceAlt,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 12,
        gap: 3,
      }}>
      <Text style={{ color: accent ?? Colors.text, fontSize: 18, fontWeight: 900 }}>{value}</Text>
      <Text
        style={{
          color: Colors.textMuted,
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}>
        {label}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const loadBalance = useCallback(async () => {
    if (!token) return;
    try {
      setBalance(await api.getWalletBalance(token));
    } catch {
      // non-fatal
    }
  }, [token]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  if (!user) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Spinner label="Loading profile…" />
        </View>
      </Screen>
    );
  }

  async function onSignOut() {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
    }
  }

  const energy = balance?.energy_balance ?? user.energy_balance;
  const usd = balance?.usd_value ?? user.usd_value;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three }}
        showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <Card style={{ alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.four }}>
          {user.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: Colors.amber }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                backgroundColor: Colors.surfaceRaised,
                borderWidth: 2,
                borderColor: Colors.amber,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text style={{ fontSize: 32 }}>◉</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: Colors.text, fontSize: 22, fontWeight: 900, letterSpacing: 1 }}>
              {user.username}
            </Text>
            {user.is_verified ? (
              <Badge label="verified" color={Colors.blue} />
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Badge label={user.rank_title} color={Colors.amber} />
            <Badge label={`level ${user.level} · ${user.xp} xp`} color={Colors.textMuted} />
            {(user.streak ?? 0) > 0 ? <Badge label={`🔥 ${user.streak} streak`} color={Colors.pink} /> : null}
          </View>
        </Card>

        {/* Wallet summary */}
        <Card style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: Colors.text, fontSize: 15, fontWeight: 800 }}>⚡ Wallet</Text>
            <Text style={{ color: Colors.textMuted, fontSize: 11, fontWeight: 600 }}>
              ≈ ${usd.toFixed(2)} USD
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <StatBox label="Energy" value={energy.toLocaleString()} accent={Colors.amber} />
            <StatBox
              label="Escrow locked"
              value={(balance?.escrow_energy_locked ?? user.escrow_energy_locked ?? 0).toLocaleString()}
              accent={Colors.purple}
            />
            <StatBox
              label="Daily claim"
              value={user.can_claim_daily ? 'Ready' : 'Locked'}
              accent={user.can_claim_daily ? Colors.green : Colors.textFaint}
            />
          </View>
        </Card>

        {/* Stats */}
        <View style={{ gap: 8 }}>
          <Text
            style={{
              color: Colors.textMuted,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}>
            Track record
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <StatBox
              label="Bounties won"
              value={(balance?.total_bounties_won ?? user.total_bounties_won ?? 0).toLocaleString()}
              accent={Colors.gold}
            />
            <StatBox label="Dares completed" value={(user.dares_completed ?? 0).toLocaleString()} accent={Colors.green} />
            <StatBox label="Dares created" value={(user.dares_created ?? 0).toLocaleString()} accent={Colors.blue} />
          </View>
        </View>

        {/* Decks */}
        {user.unlocked_decks && user.unlocked_decks.length > 0 ? (
          <Card style={{ gap: 6 }}>
            <Text
              style={{
                color: Colors.textMuted,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 1.6,
                textTransform: 'uppercase',
              }}>
              Unlocked decks
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {user.unlocked_decks.map((d) => (
                <Badge key={d} label={d} color={Colors.textMuted} />
              ))}
            </View>
          </Card>
        ) : null}

        <Button
          variant="danger"
          label={signingOut ? 'Signing out…' : 'Sign out'}
          onPress={onSignOut}
          loading={signingOut}
        />

        <Link href="/(auth)/login" asChild>
          <Pressable style={{ alignItems: 'center', paddingVertical: 6 }}>
            <Text style={{ color: Colors.textFaint, fontSize: 12 }}>Switch account</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </Screen>
  );
}
