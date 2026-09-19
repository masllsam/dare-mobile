/**
 * DARE API type definitions.
 * Field optionality is defensive: feed/proof objects in particular are
 * rendered from "whatever fields exist".
 */

export interface User {
  id: number;
  username: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  energy_balance: number;
  escrow_energy_locked?: number;
  xp: number;
  level: number;
  streak: number;
  rank_title: string;
  usd_value: number;
  can_claim_daily?: boolean;
  next_daily_claim_at?: string | null;
  unlocked_decks?: string[] | null;
  cash_balance?: number;
  escrow_locked_balance?: number;
  total_bounties_won?: number;
  dares_completed?: number;
  dares_created?: number;
  is_verified?: boolean;
  is_adult?: boolean;
  is_admin?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type DareVariableOptions = string[] | string;

export interface Dare {
  id: number;
  title: string;
  description: string;
  category: string;
  rarity: string;
  timer_minutes: number;
  proof_type: string;
  default_bounty: number;
  is_public?: boolean;
  variables?: Record<string, DareVariableOptions> | null;
  image_url?: string | null;
  deck_set?: string | null;
  spiciness_level?: number | null;
  embarrassment_level?: number | null;
  danger_level?: number | null;
  action_prompt?: string | null;
  is_owned?: boolean;
  owned_count?: number;
  is_starter?: boolean;
  clout_price?: number;
  creator_username?: string | null;
  play_count?: number;
}

export interface RollResponse {
  rolled_variables: Record<string, string>;
  final_description: string;
}

export interface Deck {
  slug: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  badge_text?: string | null;
  script_tag?: string | null;
  icon?: string | null;
  sort_order?: number;
  price_energy?: number;
  is_premium?: boolean;
}

export interface WalletBalance {
  user_id?: number | null;
  energy_balance: number;
  escrow_energy_locked?: number;
  total_available_energy?: number | null;
  total_bounties_won?: number;
  usd_value: number;
  can_claim_daily?: boolean;
  next_daily_claim_at?: string | null;
  cash_balance?: number;
  escrow_locked_balance?: number;
}

export interface DailyReward {
  success: boolean;
  energy_reward?: number;
  new_energy_balance?: number;
  usd_value?: number;
  message?: string;
  next_claim_at?: string | null;
}

export interface EnergyPack {
  id: string;
  name: string;
  energy: number;
  price_usd: number;
  badge?: string | null;
  description?: string | null;
}

export interface Transaction {
  id: number;
  user_id: number;
  session_id?: string | null;
  amount: number;
  transaction_type: string;
  status: string;
  description?: string | null;
  created_at: string;
}

export interface ProofSummary {
  id: number;
  proof_type?: string;
  media_url?: string | null;
  status?: string;
  upvotes?: number;
  note?: string | null;
}

export interface Session {
  id: string;
  dare_id?: number | null;
  challenger_id: number;
  recipient_id?: number | null;
  bounty_amount: number;
  status: string;
  rolled_variables?: Record<string, string> | null;
  final_description: string;
  timer_minutes: number;
  timer_started_at?: string | null;
  expires_at?: string | null;
  created_at?: string;
  proof_type?: string | null;
  is_ante?: boolean;
  stake_type?: string;
  custom_stake?: string | null;
  penalty_type?: string;
  custom_penalty?: string | null;
  consent_notice?: string | null;
  time_remaining_seconds?: number | null;
}

export interface SessionDetail extends Session {
  dare?: Dare | null;
  challenger?: User | null;
  recipient?: User | null;
  proofs?: ProofSummary[] | null;
  telegram_share_link?: string | null;
}

export interface UserSessionsOverview {
  active: SessionDetail[];
  sent: SessionDetail[];
  finished_successful: SessionDetail[];
  finished_unsuccessful: SessionDetail[];
}

/** Viral proof-reel feed item — all fields optional, render defensively. */
export interface ProofFeedItem {
  id: number;
  session_id?: string | null;
  dare_id?: number | null;
  dare_title?: string | null;
  dare_category?: string | null;
  dare_rarity?: string | null;
  dare_cover_art_url?: string | null;
  deck_set?: string | null;
  action_prompt?: string | null;
  rolled_variables?: Record<string, string> | null;
  creator_id?: number | null;
  creator_name?: string | null;
  creator_username?: string | null;
  creator_avatar?: string | null;
  creator_rank?: string | null;
  creator_level?: number | null;
  media_url?: string | null;
  file_path?: string | null;
  proof_type?: string | null;
  media_type?: string | null;
  thumbnail_url?: string | null;
  note?: string | null;
  bounty_amount?: number | null;
  speedrun_seconds?: number | null;
  hype_score?: number | null;
  upvotes?: number | null;
  downvotes?: number | null;
  is_verified?: boolean | null;
  views_count?: number | null;
  view_count?: number | null;
  total_tips?: number | null;
  reactions_count?: Record<string, number> | null;
  is_featured?: boolean | null;
  submitted_at?: string | null;
  created_at?: string | null;
}
