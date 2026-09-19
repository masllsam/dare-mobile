/**
 * DARE mobile — design tokens.
 * Dark cyberpunk theme mirroring the DARE web SPA.
 * Background #0b0f14, surfaces #12181f/#1a222c, slate text, amber CTA,
 * neon accents + rarity color map.
 */

export const Colors = {
  bg: '#0b0f14',
  surface: '#12181f',
  surfaceAlt: '#1a222c',
  surfaceRaised: '#202b36',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',

  text: '#f1f5f9', // slate-100
  textMuted: '#5a6478',
  textFaint: '#3a4453',

  amber: '#fbbf24',
  amberSoft: 'rgba(251,191,36,0.14)',

  blue: '#6fa8b8',
  pink: '#e8b4b8',
  purple: '#b8a9d9',
  gold: '#c9a24b',
  green: '#93b89a',
  slate: '#94a3b8',
  red: '#e07a7a',

  danger: 'rgba(224,122,122,0.25)',
} as const;

export type ThemeColor = keyof typeof Colors;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/**
 * Live /dares returns MIXED-CASE rarity strings — always normalize with
 * toLowerCase() before looking up. Unknown values fall back to slate.
 */
const RARITY_COLOR_MAP: Record<string, string> = {
  common: Colors.slate,
  rare: Colors.blue,
  epic: Colors.purple,
  legendary: Colors.gold,
  supernova: Colors.pink,
  nova: Colors.pink,
  spark: Colors.green,
  flare: Colors.pink,
  mythic: Colors.purple,
  mythical: Colors.purple,
  singularity: Colors.gold,
  apex: Colors.gold,
};

export function rarityColor(raw: string | null | undefined): string {
  if (!raw) return Colors.slate;
  return RARITY_COLOR_MAP[raw.toLowerCase().trim()] ?? Colors.slate;
}

export function rarityLabel(raw: string | null | undefined): string {
  if (!raw) return 'Unknown';
  return raw.toLowerCase().trim().replace(/_/g, ' ');
}

/** Hex + 2-digit alpha helper for glow/border effects. */
export function withAlpha(hex: string, alpha: string): string {
  return hex.length === 7 ? `${hex}${alpha}` : hex;
}

export const Fonts = {
  sans: 'system-ui',
  mono: 'ui-monospace',
} as const;
