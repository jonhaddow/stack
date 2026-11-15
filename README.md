# Stack

A one-thumb tower-stacking game for the phone. Tap to drop a sliding block on the tower. Whatever overhangs is sliced off, so each miss makes the next block narrower. Line one up exactly and it stays full width, and a streak of perfect drops grows it back. The sky darkens from day to night to space as the tower climbs.

Anyone can play. Signing in saves your scores to a shared leaderboard.

## Tech stack

- [SvelteKit](https://svelte.dev) (Svelte 5) and TypeScript, as an installable PWA. The game is drawn on a `<canvas>`
- [Cloudflare Workers](https://workers.cloudflare.com), with [D1](https://developers.cloudflare.com/d1/) (SQLite) through [Drizzle ORM](https://orm.drizzle.team)
- Google sign-in (OAuth with PKCE, shared code in [`auth`](https://github.com/jonhaddow/auth)) for an allowlist of users
- [Vitest](https://vitest.dev) and [Playwright](https://playwright.dev) for tests
- Deployed from `main` by Cloudflare Workers Builds

## Running locally

```sh
npm install
npm run db:migrate:local
npx wrangler d1 execute stack --local --command "INSERT INTO user (email, name) VALUES ('you@example.com', 'You')"
cp .dev.vars.example .dev.vars
npm run dev    # the login page has dev-only "Sign in as" buttons
```

Tests: `npm test` (unit), `npm run test:e2e` (Playwright), `npm run check` (types), `npm run lint`.
