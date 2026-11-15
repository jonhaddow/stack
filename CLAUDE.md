# Stack

A one-thumb tower-stacking game, at https://stack.app.haddow.me. Anyone can play `/`; signing in saves scores (`/api/scores`) and shows the leaderboard (`/scores`).

## Worth knowing

- `src/lib/stacker.ts` is the rules (slicing, perfect drops, speed, sky colours): pure and unit tested, keep it that way. `Game.svelte` draws it on a canvas and runs the loop.
- The canvas loop keeps its state in plain variables, not `$state`: it changes every frame. Only what the overlay shows (phase, height, streak) is reactive.
- Scores are trusted from the client: it's a household game, so the endpoint only checks they're sane.
- Signed out, the best score is kept in `localStorage`.
- The service worker caches `/` (network first), so the game opens offline.
- No Tailwind or shadcn: the app has only plain buttons and lists.
- Secrets: `GOOGLE_CLIENT_SECRET`.
