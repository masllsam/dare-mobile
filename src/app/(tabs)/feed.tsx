import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import * as api from '@/api';
import { assetUrl, errorMessage } from '@/api/client';
import type { ProofFeedItem } from '@/api/types';
import { proofIcon } from './browse';
import { Badge, Card, Screen, Spinner } from '@/components/ui';
import { Colors, Spacing, withAlpha, rarityColor, rarityLabel } from '@/theme';

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function FeedCard({ item }: { item: ProofFeedItem }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number | null>(item.upvotes ?? null);

  const isVideo = (item.media_type ?? item.proof_type ?? '').toLowerCase().includes('video');
  const mediaSrc = assetUrl(isVideo ? item.thumbnail_url : item.media_url) ?? assetUrl(item.media_url);
  const coverSrc = assetUrl(item.dare_cover_art_url);

  return (
    <Card style={{ gap: 10, padding: 10 }}>
      {/* Media block */}
      <View
        style={{
          height: isVideo ? 240 : mediaSrc ? 260 : 150,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: Colors.surfaceAlt,
          borderWidth: 1,
          borderColor: Colors.border,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {!isVideo && mediaSrc ? (
          <Image source={{ uri: mediaSrc }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
        ) : isVideo ? (
          <View style={{ gap: 10, alignItems: 'center', padding: 20 }}>
            {coverSrc ? (
              <Image
                source={{ uri: coverSrc }}
                style={{ width: 110, height: 150, borderRadius: 10, opacity: 0.55 }}
                contentFit="cover"
                transition={200}
              />
            ) : null}
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                borderWidth: 2,
                borderColor: Colors.amber,
                backgroundColor: 'rgba(251,191,36,0.15)',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text style={{ color: Colors.amber, fontSize: 20, fontWeight: 900 }}>▶</Text>
            </View>
            <Text style={{ color: Colors.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
              Proof video
            </Text>
          </View>
        ) : (
          <Text style={{ color: Colors.textFaint, fontSize: 13 }}>No media attached</Text>
        )}
      </View>

      {/* Creator row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {item.creator_avatar ? (
          <Image
            source={{ uri: item.creator_avatar }}
            style={{ width: 30, height: 30, borderRadius: 15 }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: Colors.surfaceRaised,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text style={{ fontSize: 13 }}>◉</Text>
          </View>
        )}
        <View style={{ flex: 1, gap: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={{ color: Colors.text, fontSize: 13, fontWeight: 800 }}>
              {item.creator_name ?? item.creator_username ?? 'Daredevil'}
            </Text>
            {item.is_verified ? <Text style={{ color: Colors.blue, fontSize: 11 }}>✔</Text> : null}
            {item.is_featured ? (
              <Badge label="featured" color={Colors.gold} />
            ) : null}
          </View>
          <Text style={{ color: Colors.textFaint, fontSize: 11 }}>
            {item.creator_rank ? `${item.creator_rank} · ` : ''}
            L{item.creator_level ?? 1} · {timeAgo(item.submitted_at ?? item.created_at)}
          </Text>
        </View>
      </View>

      {/* Dare context */}
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        <Badge label={item.dare_title ?? 'Custom challenge'} color={Colors.textMuted} />
        {item.dare_rarity ? (
          <Badge label={rarityLabel(item.dare_rarity)} color={rarityColor(item.dare_rarity)} />
        ) : null}
        {item.bounty_amount ? (
          <Text style={{ color: Colors.amber, fontSize: 11, fontWeight: 800 }}>
            {Math.round(item.bounty_amount).toLocaleString()} ⚡
          </Text>
        ) : null}
        {item.speedrun_seconds ? (
          <Text style={{ color: Colors.green, fontSize: 11, fontWeight: 700 }}>
            ⚡ {item.speedrun_seconds.toFixed(0)}s run
          </Text>
        ) : null}
      </View>

      {item.note ? (
        <Text style={{ color: Colors.text, fontSize: 13, lineHeight: 19 }}>{item.note}</Text>
      ) : null}

      {/* Actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable
          onPress={() => {
            setLiked((v) => !v);
            setLikeCount((c) => (c === null ? 1 : Math.max(0, c + (liked ? -1 : 1))));
          }}
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: liked ? withAlpha(Colors.amber, 'aa') : Colors.border,
              backgroundColor: liked ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.03)',
              paddingHorizontal: 14,
              paddingVertical: 7,
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          <Text style={{ fontSize: 13 }}>{liked ? '🔥' : '👍'}</Text>
          <Text style={{ color: liked ? Colors.amber : Colors.textMuted, fontSize: 12, fontWeight: 700 }}>
            {likeCount ?? 0}
          </Text>
        </Pressable>
        {item.downvotes !== null && item.downvotes !== undefined ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 12 }}>👎</Text>
            <Text style={{ color: Colors.textFaint, fontSize: 12, fontWeight: 700 }}>{item.downvotes}</Text>
          </View>
        ) : null}
        {item.hype_score ? (
          <Text style={{ color: Colors.textFaint, fontSize: 11, marginLeft: 'auto' }}>
            hype {item.hype_score}
          </Text>
        ) : null}
        {item.view_count ?? item.views_count ? (
          <Text style={{ color: Colors.textFaint, fontSize: 11 }}>
            {item.view_count ?? item.views_count} views
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

export default function FeedScreen() {
  const [items, setItems] = useState<ProofFeedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getProofFeed()
      .then((f) => !cancelled && setItems(f))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three }}
        showsVerticalScrollIndicator={false}>
        <View>
          <Text style={{ color: Colors.text, fontSize: 24, fontWeight: 900, letterSpacing: 2 }}>
            PROOF FEED
          </Text>
          <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 4 }}>
            Viral reels from completed dares
          </Text>
        </View>

        {error ? (
          <Card style={{ gap: 8 }}>
            <Text style={{ color: Colors.red, fontSize: 13 }}>{error}</Text>
          </Card>
        ) : null}

        {items === null && !error ? (
          <Spinner label="Loading the feed…" />
        ) : (
          items?.length === 0 ? (
            <Text style={{ color: Colors.textFaint, fontSize: 13, textAlign: 'center', paddingVertical: Spacing.four }}>
              No public proofs yet. Be the first — finish a dare and submit proof.
            </Text>
          ) : (
            items?.map((item) => <FeedCard key={item.id} item={item} />)
          )
        )}
      </ScrollView>
    </Screen>
  );
}
