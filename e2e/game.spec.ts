import { expect, test } from '@playwright/test';
import { open } from './helpers.ts';

test('a game ends on a miss and saves the score', async ({ page }) => {
	await open(page, '/');
	await expect(page.getByText('Best 17')).toBeVisible();
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
	await expect(page.getByText(/blocks? high/)).toBeVisible();
	await expect(page.getByText('Saving…')).toBeHidden();
	await expect(page.getByText('Couldn’t save that one.')).toBeHidden();

	await page.getByRole('link', { name: 'Scores' }).click();
	await expect(page.getByRole('heading', { name: 'Tallest towers' })).toBeVisible();
	await expect(page.locator('.board li')).toHaveCount(3);
	await expect(page.locator('.board li').first()).toContainText('Sam');
});

test('signed out, anyone can play but scores need sign-in', async ({ browser }) => {
	const page = await browser.newPage({ storageState: { cookies: [], origins: [] } });
	await open(page, '/');
	await expect(page.getByRole('heading', { name: 'Stack' })).toBeVisible();
	await open(page, '/scores');
	await expect(page).toHaveURL(/\/login\?next=%2Fscores/);
	await page.close();
});

test('the score endpoint refuses nonsense', async ({ request }) => {
	const res = await request.post('/api/scores', { data: { height: 3, perfects: 9 } });
	expect(res.status()).toBe(400);
});
