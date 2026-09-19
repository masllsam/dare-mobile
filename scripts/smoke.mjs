// P0 live API smoke test — registers a throwaway user and exercises every
// endpoint the mobile app consumes. Run: node scripts/smoke.mjs
const BASE = 'https://antifatypes.com/dare/api/v1';
const stamp = Math.floor(Date.now() / 1000);
const username = `hermes_mobile_p0_${stamp}`;
const email = `${username}@example.com`;
const password = 'Hermes' + 'P0smoke' + '2026!';

const out = {};

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

const reg = await api('/auth/register', {
  method: 'POST',
  body: { username, email, password },
});
out.register = { status: reg.status, ok: !!reg.data?.access_token };
out.register.user = reg.data?.user ? {
  id: reg.data.user.id,
  username: reg.data.user.username,
  energy_balance: reg.data.user.energy_balance,
  rank_title: reg.data.user.rank_title,
  xp: reg.data.user.xp,
  level: reg.data.user.level,
  streak: reg.data.user.streak,
  usd_value: reg.data.user.usd_value,
  can_claim_daily: reg.data.user.can_claim_daily,
  dares_completed: reg.data.user.dares_completed,
  dares_created: reg.data.user.dares_created,
  total_bounties_won: reg.data.user.total_bounties_won,
  avatar_url: reg.data.user.avatar_url,
  is_verified: reg.data.user.is_verified,
  unlocked_decks: reg.data.user.unlocked_decks,
} : null;
const token = reg.data?.access_token;
if (!token) {
  console.error('REGISTER FAILED', JSON.stringify(reg.data));
  process.exit(1);
}

// login with the new account (validates email_or_username field)
const login = await api('/auth/login', {
  method: 'POST',
  body: { email_or_username: username, password },
});
out.login = { status: login.status, ok: !!login.data?.access_token };

const me = await api('/auth/me', { token });
out.me = { status: me.status, username: me.data?.username, energy: me.data?.energy_balance };

const bal = await api('/wallet/balance', { token });
out.wallet_balance = { status: bal.status, data: bal.data };

const dares = await api('/dares', { token });
const dareList = Array.isArray(dares.data) ? dares.data : [];
out.dares = {
  status: dares.status,
  count: dareList.length,
  rarities: [...new Set(dareList.map((d) => d.rarity))],
  sample: dareList.slice(0, 2).map((d) => ({
    id: d.id,
    title: d.title,
    rarity: d.rarity,
    category: d.category,
    deck_set: d.deck_set,
    default_bounty: d.default_bounty,
    timer_minutes: d.timer_minutes,
    proof_type: d.proof_type,
    image_url: d.image_url,
    variables: d.variables,
    spiciness_level: d.spiciness_level,
    embarrassment_level: d.embarrassment_level,
    danger_level: d.danger_level,
    is_owned: d.is_owned,
    description: (d.description || '').slice(0, 120),
  })),
};

const decks = await api('/decks', { token });
const deckList = Array.isArray(decks.data) ? decks.data : [];
out.decks = {
  status: decks.status,
  count: deckList.length,
  sample: deckList.slice(0, 3).map((d) => ({
    slug: d.slug, title: d.title, badge_text: d.badge_text, icon: d.icon, image_url: d.image_url,
  })),
};

const feed = await api('/proofs/feed', { token });
const feedList = Array.isArray(feed.data) ? feed.data : [];
out.proof_feed = {
  status: feed.status,
  count: feedList.length,
  sample: feedList.slice(0, 1).map((f) => ({
    keys: Object.keys(f),
    id: f.id,
    media_url: (f.media_url || '').slice(0, 120),
    proof_type: f.proof_type,
    upvotes: f.upvotes,
    creator_name: f.creator_name,
    dare_title: f.dare_title,
    is_featured: f.is_featured,
    is_verified: f.is_verified,
  })),
};

const packs = await api('/wallet/packs', { token });
out.wallet_packs = { status: packs.status, count: Array.isArray(packs.data) ? packs.data.length : -1 };

const tx = await api('/wallet/transactions', { token });
out.wallet_transactions = { status: tx.status, count: Array.isArray(tx.data) ? tx.data.length : -1, sample: (tx.data || []).slice(0, 2) };

const active = await api('/sessions/active', { token });
out.sessions_active = { status: active.status, count: Array.isArray(active.data) ? active.data.length : -1 };

// find an owned starter dare to test session create + roll
const owned = dareList.find((d) => d.is_owned);
out.owned_dare = owned ? { id: owned.id, title: owned.title } : null;
if (owned) {
  const roll = await api('/dares/roll', {
    method: 'POST',
    body: { dare_id: owned.id, template_description: owned.description || '', variables: owned.variables || {} },
    token,
  });
  out.roll = { status: roll.status, rolled: roll.data?.rolled_variables, final: (roll.data?.final_description || '').slice(0, 100) };

  const create = await api('/sessions', {
    method: 'POST',
    body: { dare_id: owned.id, bounty_amount: owned.default_bounty || 10 },
    token,
  });
  out.session_create = {
    status: create.status,
    error: create.data?.detail || null,
    session: create.data ? { id: create.data.id, status: create.data.status, bounty: create.data.bounty_amount, timer_minutes: create.data.timer_minutes, challenger_id: create.data.challenger_id, telegram_share_link: create.data.telegram_share_link, has_dare: !!create.data.dare, final_description: (create.data.final_description || '').slice(0, 80) } : null,
  };
  if (create.data?.id) {
    const sid = create.data.id;
    const get = await api(`/sessions/${sid}`, { token });
    out.session_get = { status: get.status, status_value: get.data?.status };
    const decline = await api(`/sessions/${sid}/decline`, { method: 'POST', token });
    out.session_decline = { status: decline.status, status_value: decline.data?.status, error: decline.data?.detail || null };
  }
}

const random = await api('/dares/random', { token });
out.random_dare = { status: random.status, id: random.data?.id, title: random.data?.title };

console.log(JSON.stringify(out, null, 2));
