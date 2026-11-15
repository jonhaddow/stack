import { expect, test, type Page } from '@playwright/test';
import { open } from './helpers.ts';

const API = 'https://games.app.haddow.me/api/scores/stack';

/** Fakes the shared leaderboard; returns the bests it was sent. */
async function fakeBoard(page: Page, player: { name: string } | null) {
	const sent: number[] = [];
	await page.route(API, async (route) => {
		const body = route.request().postDataJSON() as { value: number } | null;
		if (body) sent.push(body.value);
		await route.fulfill({
			json: {
				player: player && { ...player, colour: '#3a86ff' },
				me: player && body ? { rank: 2, value: body.value } : null,
				rows: []
			}
		});
	});
	return sent;
}

async function playUntilOver(page: Page) {
	const game = page.locator('.game');
	await game.click();
	await expect(page.getByTestId('height')).toHaveText('0');
	// The first block starts off the left edge, so dropping at once still lands partly on.
	await game.click();
	await expect(page.getByTestId('height')).toHaveText('1');
	// Keep tapping until a block misses (each lands on less tower than the last).
	await expect(async () => {
		await game.click();
		await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible({ timeout: 200 });
	}).toPass({ timeout: 20_000 });
}

test('a finished game sends the best to the shared board', async ({ page }) => {
	const sent = await fakeBoard(page, { name: 'Alex' });
	await open(page, '/');
	await expect(page.getByText('Playing as Alex')).toBeVisible();
	await playUntilOver(page);
	await expect(page.getByText('Number 2 on the board')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Scores' })).toHaveAttribute(
		'href',
		'https://games.app.haddow.me/boards/stack'
	);
	expect(sent.length).toBe(1);
	expect(sent[0]).toBeGreaterThan(0);
	// Kept on the device too, and sent again next time.
	await open(page, '/');
	await expect(page.getByText(`Best ${sent[0]}`)).toBeVisible();
	await expect.poll(() => sent.length).toBe(2);
});

test('with no name yet, it offers to pick one', async ({ page }) => {
	await fakeBoard(page, null);
	await open(page, '/');
	await playUntilOver(page);
	const pick = page.getByRole('link', { name: 'Pick a name for the board' });
	await expect(pick).toHaveAttribute(
		'href',
		/^https:\/\/games\.app\.haddow\.me\/profile\?back=http/
	);
});

test('it still plays when the board can’t be reached', async ({ page }) => {
	await page.route(API, (route) => route.abort());
	await open(page, '/');
	await playUntilOver(page);
	await expect(page.getByRole('link', { name: 'Scores' })).toBeVisible();
});
