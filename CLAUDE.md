# Stack

A one-thumb tower-stacking game, at https://stack.app.haddow.me. No sign-in and no database: scores go to the shared leaderboard in the games launcher (`~/code/games`). The launcher hands over the player's id as `#profile=<id>` in its links, kept in `localStorage` (`games-profile`).

## Worth knowing

- `src/lib/stacker.ts` is the rules (slicing, perfect drops, speed, sky colours): pure and unit tested, keep it that way. `Game.svelte` draws it on a canvas and runs the loop.
- The canvas loop keeps its state in plain variables, not `$state`: it changes every frame. Only what the overlay shows (phase, height, streak) is reactive.
- The best is kept in `localStorage` (`stack-best`) and sent to the launcher (`board.ts`) on load and after each game, so it counts once a name is picked. If the launcher can't be reached, the game still plays.
- e2e fakes the launcher with `page.route`.
- The service worker caches `/` (network first), so the game opens offline.
- No Tailwind or shadcn: the app has only plain buttons and lists.
- No secrets.
