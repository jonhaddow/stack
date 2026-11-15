import type { Handle } from '@sveltejs/kit/hooks';

/** Sent with every page (the CSP itself is configured in vite.config.ts). */
const SECURITY_HEADERS = {
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
	// Pages name this build's files, which the next deploy deletes. Without this,
	// iOS reopens the home-screen app from a cached page whose CSS and JS are gone.
	if (response.headers.get('content-type')?.startsWith('text/html'))
		response.headers.set('Cache-Control', 'no-store');
	return response;
};
