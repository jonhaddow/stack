import { error, json } from '@sveltejs/kit';
import { MAX_HEIGHT, saveScore } from '#lib/server/scores.ts';
import type { RequestHandler } from './$types';

/** Saves a finished game for the signed-in player (hooks.server.ts refuses anyone else). */
export const POST: RequestHandler = async ({ request, locals }) => {
	const { height, perfects } = (await request.json()) as { height?: unknown; perfects?: unknown };
	const whole = (n: unknown): n is number =>
		Number.isInteger(n) && (n as number) >= 0 && (n as number) <= MAX_HEIGHT;
	if (!whole(height) || !whole(perfects) || perfects > height) error(400, 'Bad score');
	return json({ best: await saveScore(locals.db, locals.user!.id, height, perfects) });
};
