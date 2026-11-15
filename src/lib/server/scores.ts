import { desc, eq, max } from 'drizzle-orm';
import { score, user } from './db/schema.ts';
import type { DB } from './db/index.ts';

/** Taller than anyone could plausibly stack; anything above is refused. */
export const MAX_HEIGHT = 10_000;

/** Records a finished game; returns the player's best afterwards. */
export async function saveScore(
	db: DB,
	userId: number,
	height: number,
	perfects: number,
	now = new Date()
) {
	await db.insert(score).values({ userId, height, perfects, at: now.toISOString() });
	return personalBest(db, userId);
}

export async function personalBest(db: DB, userId: number) {
	const [row] = await db
		.select({ best: max(score.height) })
		.from(score)
		.where(eq(score.userId, userId));
	return row?.best ?? 0;
}

/** The tallest towers ever, with who built them. */
export function topScores(db: DB, limit = 10) {
	return db
		.select({ name: user.name, height: score.height, perfects: score.perfects, at: score.at })
		.from(score)
		.innerJoin(user, eq(score.userId, user.id))
		.orderBy(desc(score.height), score.at)
		.limit(limit);
}

/** Each player's best tower, tallest first. */
export function bests(db: DB) {
	return db
		.select({ name: user.name, best: max(score.height).mapWith(Number) })
		.from(score)
		.innerJoin(user, eq(score.userId, user.id))
		.groupBy(user.id)
		.orderBy(desc(max(score.height)));
}
