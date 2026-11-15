# Stack

A one-thumb tower-stacking game for the phone. Tap to drop a sliding block on the tower. Whatever overhangs is sliced off, so each miss makes the next block narrower. Line one up exactly and it stays full width, and a streak of perfect drops grows it back. The sky darkens from day to night to space as the tower climbs.

Play it at https://stack.app.haddow.me. Scores go to a shared leaderboard in the [games launcher](https://github.com/jonhaddow/games), under a name you pick there (no sign-in).

## Tech stack

- [SvelteKit](https://svelte.dev) (Svelte 5) and TypeScript, as an installable PWA. The game is drawn on a `<canvas>`
- [Cloudflare Workers](https://workers.cloudflare.com)
- [Vitest](https://vitest.dev) and [Playwright](https://playwright.dev) for tests
- Deployed from `main` by Cloudflare Workers Builds

## Running locally

```sh
npm install
npm run dev
```

Tests: `npm test` (unit), `npm run test:e2e` (Playwright), `npm run check` (types), `npm run lint`.
