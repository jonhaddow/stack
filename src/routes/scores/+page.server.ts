import { bests, topScores } from '#lib/server/scores.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({
	top: await topScores(locals.db),
	bests: await bests(locals.db)
});
