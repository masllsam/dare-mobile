import { apiRequest } from './client';
import type {
  AuthResponse,
  DailyReward,
  Dare,
  Deck,
  EnergyPack,
  ProofFeedItem,
  RollResponse,
  Session,
  SessionDetail,
  Transaction,
  User,
  UserSessionsOverview,
  WalletBalance,
} from './types';

export interface DareFilters {
  category?: string;
  deck_set?: string;
  rarity?: string;
}

function query(params: Record<string, string | undefined>): string {
  const pairs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`);
  return pairs.length === 0 ? '' : `?${pairs.join('&')}`;
}

// ---------- Auth ----------

export function register(input: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: input });
}

export function login(input: { email_or_username: string; password: string }): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: input });
}

export function getMe(token: string): Promise<User> {
  return apiRequest<User>('/auth/me', { token });
}

// ---------- Dares ----------

export function listDares(token: string | null, filters?: DareFilters): Promise<Dare[]> {
  return apiRequest<Dare[]>(`/dares${query(filters as Record<string, string | undefined>)}`, {
    token: token ?? undefined,
  });
}

export function getDare(dareId: number, token?: string | null): Promise<Dare> {
  return apiRequest<Dare>(`/dares/${dareId}`, { token: token ?? undefined });
}

export function randomDare(token?: string | null): Promise<Dare> {
  return apiRequest<Dare>('/dares/random', { token: token ?? undefined });
}

export function rollDareVariables(
  dare: { description?: string | null; variables?: Record<string, unknown> | null },
  token?: string | null,
): Promise<RollResponse> {
  return apiRequest<RollResponse>('/dares/roll', {
    method: 'POST',
    token: token ?? undefined,
    body: {
      template_description: dare.description ?? '',
      variables: (dare.variables ?? {}) as Record<string, unknown>,
    },
  });
}

// ---------- Decks ----------

export function listDecks(): Promise<Deck[]> {
  return apiRequest<Deck[]>('/decks');
}

// ---------- Wallet ----------

export function getWalletBalance(token: string): Promise<WalletBalance> {
  return apiRequest<WalletBalance>('/wallet/balance', { token });
}

export function claimDailyReward(token: string): Promise<DailyReward> {
  return apiRequest<DailyReward>('/wallet/claim-daily', { method: 'POST', token });
}

export function listPacks(): Promise<EnergyPack[]> {
  return apiRequest<EnergyPack[]>('/wallet/packs');
}

export function listTransactions(token: string): Promise<Transaction[]> {
  return apiRequest<Transaction[]>('/wallet/transactions', { token });
}

// ---------- Sessions ----------

export function getActiveSessions(token: string): Promise<SessionDetail[]> {
  return apiRequest<SessionDetail[]>('/sessions/active', { token });
}

export function getUserSessionOverview(token: string): Promise<UserSessionsOverview> {
  return apiRequest<UserSessionsOverview>('/sessions/user-overview', { token });
}

export function getSession(sessionId: string, token?: string | null): Promise<SessionDetail> {
  return apiRequest<SessionDetail>(`/sessions/${sessionId}`, { token: token ?? undefined });
}

export interface CreateSessionInput {
  dare_id?: number | null;
  recipient_id?: number | null;
  bounty_amount?: number;
  timer_minutes?: number;
  custom_title?: string | null;
  custom_description?: string | null;
  initial_variables?: Record<string, string> | null;
  proof_type?: string | null;
  stake_type?: string | null;
}

/** Open (public) challenge: recipient_id omitted. */
export function createSession(input: CreateSessionInput, token: string): Promise<SessionDetail> {
  return apiRequest<SessionDetail>('/sessions', { method: 'POST', token, body: input });
}

export function acceptSession(sessionId: string, token: string): Promise<Session> {
  return apiRequest<Session>(`/sessions/${sessionId}/accept`, { method: 'POST', token });
}

export function declineSession(sessionId: string, token: string): Promise<Session> {
  return apiRequest<Session>(`/sessions/${sessionId}/decline`, { method: 'POST', token });
}

export function rollSession(sessionId: string, token: string): Promise<Session> {
  return apiRequest<Session>(`/sessions/${sessionId}/roll`, { method: 'POST', token });
}

export function startTimer(sessionId: string, token: string): Promise<Session> {
  return apiRequest<Session>(`/sessions/${sessionId}/start-timer`, { method: 'POST', token });
}

// ---------- Proofs ----------

export function getProofFeed(): Promise<ProofFeedItem[]> {
  return apiRequest<ProofFeedItem[]>('/proofs/feed');
}
