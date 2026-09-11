# GameTracker

A personal game library tracker — what you own, what you're playing, and
what runs well on Steam Deck, across every store.

See [DESIGN.md](./DESIGN.md) for the portfolio's shared design language —
read that before styling a change here.

## Features

- Track games across any store (Steam, Epic, GOG, Ubisoft Connect, EA App, Xbox/Game Pass, or other)
- Backlog / playing / finished / dropped status per game
- Install status and install path
- Playtime, last played date, your own 1–10 rating, and free-text notes
- Steam Deck compatibility rating (Verified / Playable / Unsupported / Unknown)
- Supabase Auth, one library per account (row-level security — you only ever see your own games)

## Data

Tables live in a dedicated `gametracker` schema on the shared `master_db`
Supabase project — not `public` — following this portfolio's per-app-schema
convention (see `supabase/migrations/`). Every Supabase client in this repo
is created with `db: { schema: "gametracker" }`; don't drop that when adding
a new client instantiation.

## Getting Started

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Copy the environment file and fill in real values from the Supabase dashboard (Project Settings → API):

```bash
cp .env.example .env.local
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing

`npm run test` runs the Jest unit tests. `npm run test:e2e` runs the
Playwright smoke suite (see `e2e/smoke.spec.ts`) — every public page, plus
`/dashboard`, `/settings`, and `/games` while authenticated if
`E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD` are set in `.env.local` (a dedicated
test account, not your own). Runs in CI on every push to `master`.

## Deploy on Vercel

Deployed via Vercel's GitHub integration — pushes to `master` deploy
automatically. Set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (master_db's project URL/anon key) in the
Vercel project's Environment Variables.
