// The shared leaderboard and profile live in the games launcher
// (games.app.haddow.me, its own repo). Its cookie is sent with these requests.

export const GAMES = 'https://games.app.haddow.me';
const GAME = 'stack';

export type Standing = {
	player: { name: string; colour: string } | null;
	me: { rank: number; value: number } | null;
};

export const boardUrl = `${GAMES}/boards/${GAME}`;

/** The launcher's profile page, coming back here after. */
export const pickNameUrl = (back: string) => `${GAMES}/profile?back=${encodeURIComponent(back)}`;

/**
 * Sends this device's best (the launcher keeps the higher of it and what it
 * has), or just asks, with no best yet. Null if the launcher can't be reached.
 */
export async function report(best: number): Promise<Standing | null> {
	try {
		const res = await fetch(`${GAMES}/api/scores/${GAME}`, {
			method: best > 0 ? 'POST' : 'GET',
			credentials: 'include',
			...(best > 0 && {
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ value: best })
			})
		});
		if (!res.ok) return null;
		const { player, me } = (await res.json()) as Standing;
		return { player, me };
	} catch {
		return null;
	}
}
