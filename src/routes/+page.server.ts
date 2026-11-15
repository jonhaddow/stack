import { personalBest } from '#lib/server/scores.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({
	best: locals.user ? await personalBest(locals.db, locals.user.id) : null
});
