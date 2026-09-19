import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import * as api from '@/api';
import { assetUrl, errorMessage } from '@/api/client';
import type { Dare, Deck } from '@/api/types';
import { useAuth } from '@/context/AuthProvider';
import { Badge, Card, Chip, ErrorText, Screen, ScreenScroll, Spinner } from '@/components/ui';
import { Colors, Spacing, rarityColor, rarityLabel } from '@/theme';

const PROOF_ICON: Record<string, string> = {
  video: '🎬',
  picture: '📸',
  photo: '📸',
  audio: '🎙',
  any: '✦',
};

export function proofIcon(t: string | null | undefined): string {
  return PROOF_ICON[(t ?? '').toLowerCase()] ?? '✦';
}

export default function BrowseScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [dares, setDares] = useState<Dare[] | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deckSlug, setDeckSlug] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, dk] = await Promise.all([api.listDares(token ?? null), api.listDecks()]);
        if (cancelled) return;
        setDares(d);
        setDecks(dk);
      } catch (e) {
        if (!cancelled) setError(errorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const categories = useMemo(() => {
    if (!dares) return [];
    const set = new Map<string, number>();
    for (const d of dares) set.set(d.category, (set.get(d.category) ?? 0) + 1);
    return [...set.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }, [dares]);

  const filtered = useMemo(() => {
    if (!dares) return [];
    const q = query.trim().toLowerCase();
    return dares.filter((d) => {
      if (deckSlug && (d.deck_set ?? '').toLowerCase() !== deckSlug.toLowerCase()) return false;
      if (category && d.category !== category) return false;
      if (q && !d.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [dares, deckSlug, category, query]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.three, paddingBottom: Spacing.six }}
        showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: Spacing.three }}>
          <Text style={{ color: Colors.text, fontSize: 24, fontWeight: 900, letterSpacing: 2 }}>
            THE DECK
          </Text>
          <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 4 }}>
            {dares ? `${dares.length} cards · ${decks.length} decks` : 'Loading…'}
          </Text>
        </View>

        {/* Search */}
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search cards by title…"
          placeholderTextColor={Colors.textFaint}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 11,
            color: Colors.text,
            fontSize: 14,
            marginBottom: Spacing.three,
          }}
        />

        {/* Deck chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: Spacing.two }}>
          <Chip label="All decks" active={deckSlug === null} onPress={() => setDeckSlug(null)} />
          {decks.map((d) => (
            <Chip
              key={d.slug}
              label={d.title}
              active={deckSlug === d.slug}
              onPress={() => setDeckSlug(deckSlug === d.slug ? null : d.slug)}
            />
          ))}
        </ScrollView>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: Spacing.three }}>
          <Chip label="All categories" active={category === null} onPress={() => setCategory(null)} />
          {categories.map((c) => (
            <Chip
              key={c}
              label={c}
              active={category === c}
              onPress={() => setCategory(category === c ? null : c)}
            />
          ))}
        </ScrollView>

        <ErrorText>{error}</ErrorText>

        {dares === null && !error ? (
          <Spinner label="Loading the deck…" />
        ) : (
          <View style={{ gap: Spacing.one }}>
            {filtered.length === 0 ? (
              <Text style={{ color: Colors.textFaint, fontSize: 13, textAlign: 'center', paddingVertical: Spacing.four }}>
                No cards match those filters.
              </Text>
            ) : (
              filtered.map((d) => (
                <Pressable key={d.id} onPress={() => router.push(`/dareId?dareId=${d.id}`)}>
                  <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 }}>
                    <View
                      style={{
                        width: 52,
                        height: 68,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: rarityColor(d.rarity),
                        backgroundColor: Colors.surfaceAlt,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                      {d.image_url ? (
                        <Image
                          source={{ uri: assetUrl(d.image_url) ?? undefined }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                          transition={150}
                        />
                      ) : (
                        <Text style={{ fontSize: 18 }}>✦</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, gap: 5 }}>
                      <Text
                        style={{
                          color: Colors.text,
                          fontSize: 14,
                          fontWeight: 800,
                          flexShrink: 1,
                          letterSpacing: 0.3,
                        }}>
                        {d.title}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Badge label={rarityLabel(d.rarity)} color={rarityColor(d.rarity)} />
                        <Text style={{ color: Colors.textMuted, fontSize: 11 }}>
                          {proofIcon(d.proof_type)} {d.proof_type}
                        </Text>
                        <Text style={{ color: Colors.textFaint, fontSize: 11 }}>⏱ {d.timer_minutes}m</Text>
                      </View>
                    </View>
                    <Text style={{ color: Colors.amber, fontSize: 13, fontWeight: 800 }}>
                      {Math.round(d.default_bounty).toLocaleString()} ⚡
                    </Text>
                  </Card>
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
