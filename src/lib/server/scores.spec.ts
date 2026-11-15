import { beforeEach, expect, it } from 'vitest';
import { testDb } from './test-db.ts';
import * as schema from './db/schema.ts';
import { bests, personalBest, saveScore, topScores } from './scores.ts';
import type { DB } from './db/index.ts';

let db: DB;
let alex: number;
let sam: number;

beforeEach(async () => {
	db = await testDb();
	const rows = await db
		.insert(schema.user)
		.values([
			{ email: 'alex@example.com', name: 'Alex' },
			{ email: 'sam@example.com', name: 'Sam' }
		])
		.returning();
	[alex, sam] = rows.map((r) => r.id);
});

it('keeps each player’s best', async () => {
	expect(await personalBest(db, alex)).toBe(0);
	expect(await saveScore(db, alex, 12, 3)).toBe(12);
	expect(await saveScore(db, alex, 7, 0)).toBe(12);
	expect(await saveScore(db, alex, 20, 9)).toBe(20);
});

it('ranks the tallest towers, earliest first on a tie', async () => {
	await saveScore(db, alex, 12, 3, new Date('2026-11-01'));
	await saveScore(db, sam, 30, 5, new Date('2026-11-02'));
	await saveScore(db, sam, 12, 1, new Date('2026-11-03'));
	expect((await topScores(db)).map((r) => [r.name, r.height])).toEqual([
		['Sam', 30],
		['Alex', 12],
		['Sam', 12]
	]);
	expect(await topScores(db, 1)).toHaveLength(1);
	expect(await bests(db)).toEqual([
		{ name: 'Sam', best: 30 },
		{ name: 'Alex', best: 12 }
	]);
});
