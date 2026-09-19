# DARE Mobile

Cyberpunk social trading-card game client for **DARE** — the third client of the
DARE FastAPI backend (alongside the web SPA and the Telegram bot).

P0 scope: auth, wallet, card browsing, card detail with variable rolls, open
challenge creation, session view with live timer + actions, proof feed, profile.

## API

Base: `https://antifatypes.com/dare/api/v1` (Bearer JWT auth, configured in
`src/api/client.ts`).

## Stack

- Expo SDK 57, TypeScript (strict), expo-router v57 (typed routes)
- react-native-web (web export, static SPA output)
- expo-secure-store for the JWT (localStorage fallback on web)
- expo-image, expo-splash-screen, expo-status-bar, expo-system-ui

No other runtime dependencies were added for P0.

## Setup

```bash
npm install
npm start          # expo start (press i / a / w for ios / android / web)
```

## Scripts

| Command                  | What it does                                      |
| ------------------------ | ------------------------------------------------- |
| `npm start`              | Start the Expo dev server                         |
| `npm run web`            | Start on web                                      |
| `npx tsc --noEmit`       | Typecheck (must be clean)                         |
| `npx expo export --platform web` | Production web bundle → `dist/`            |
| `node scripts/smoke.mjs` | Live API smoke test (registers a throwaway user)  |

## Structure

```
src/
  app/
    _layout.tsx            # root: AuthProvider, dark ThemeProvider, auth redirect
    (auth)/login.tsx       # email_or_username + password
    (auth)/register.tsx    # username + email + password
    (tabs)/index.tsx       # Home: greeting, wallet, active challenges, random dare
    (tabs)/browse.tsx      # deck/category filters + search over /dares
    (tabs)/feed.tsx        # GET /proofs/feed viral reels
    (tabs)/profile.tsx     # /auth/me stats + wallet summary + sign out
    [dareId].tsx           # card detail, roll variables, start open challenge
    [sessionId].tsx        # session status, countdown, accept/decline/roll/timer
  api/                     # typed client for every backend endpoint
  context/AuthProvider.tsx # JWT + user session (secure store, web fallback)
  theme/                   # design tokens + rarity color map
  components/ui.tsx        # Card, Button, Badge, Meter, Chip, ...
```

## Notes

- Rarity values from the live API come back **mixed case** (`Epic`, `common`,
  `flare`, `spark`, `mythic`, …) — always normalize with `toLowerCase()` before
  mapping colors (see `src/theme/index.ts`).
- Card `image_url` values are relative; prefix with `https://antifatypes.com`
  via `assetUrl()`.
- Starting a challenge from the app creates a **public/open** session
  (`POST /sessions` without `recipient_id`), staking the card's default bounty
  in escrow. Named-opponent matching arrives in P1.
