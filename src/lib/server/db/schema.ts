import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Times are ISO timestamps.

/** People who can sign in (Google accounts). */
export const user = sqliteTable('user', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull().unique(),
	name: text('name').notNull()
});

export type User = typeof user.$inferSelect;

/** Signed-in sessions. The id is the SHA-256 of the cookie's token, never the token itself. */
export const session = sqliteTable(
	'session',
	{
		id: text('id').primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		expiresAt: text('expires_at').notNull()
	},
	(t) => [index('session_user_idx').on(t.userId)]
);

/** One finished game: how many blocks high the tower got, and how many were perfect drops. */
export const score = sqliteTable(
	'score',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: integer('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		height: integer('height').notNull(),
		perfects: integer('perfects').notNull(),
		at: text('at').notNull()
	},
	(t) => [index('score_height_idx').on(t.height), index('score_user_idx').on(t.userId, t.height)]
);
