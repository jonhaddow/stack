import { defineConfig, devices } from '@playwright/test';

// End-to-end tests drive the real app in a phone-sized Chromium. The shared
// leaderboard (games.app.haddow.me) is faked per test with page.route.
// Each app has its own port, so sessions can run several suites at once.
const PORT = 5189;

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false,
	workers: 1,
	forbidOnly: !!process.env.CI,
	reporter: [['list']],
	use: {
		baseURL: `http://localhost:${PORT}`,
		...devices['Pixel 7'],
		trace: 'retain-on-failure'
	},
	webServer: {
		command: `npx vite dev --port ${PORT} --strictPort`,
		url: `http://localhost:${PORT}/`,
		reuseExistingServer: !!process.env.E2E_REUSE,
		timeout: 120_000
	}
});
