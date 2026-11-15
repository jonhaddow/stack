// The rules of the game, kept free of drawing so they can be unit tested.
// Distances are world units: the play area is WORLD wide, whatever the screen.

export const WORLD = 360;
export const BLOCK_HEIGHT = 26;
export const START_WIDTH = 200;
/** A drop this close to the block below counts as perfect and snaps into line. */
export const PERFECT_SLACK = 5;
/** Perfect drops in a row before the block starts growing back. */
export const STREAK_TO_GROW = 3;
const GROW_BY = 10;

/** A block's left edge and width. */
export type Slab = { x: number; w: number };

export type Drop =
	{ kind: 'miss' } | { kind: 'placed'; placed: Slab; offcut: Slab | null; perfect: boolean };

/**
 * Drops `moving` onto `below`. Whatever hangs over the edge is sliced off as
 * the offcut. A perfect drop snaps into line, and on a streak grows back
 * towards the starting width.
 */
export function drop(below: Slab, moving: Slab, streak = 0): Drop {
	if (Math.abs(moving.x - below.x) <= PERFECT_SLACK) {
		const grow = streak + 1 >= STREAK_TO_GROW ? Math.min(GROW_BY, START_WIDTH - below.w) : 0;
		return {
			kind: 'placed',
			placed: { x: below.x - grow / 2, w: below.w + grow },
			offcut: null,
			perfect: true
		};
	}
	const left = Math.max(below.x, moving.x);
	const right = Math.min(below.x + below.w, moving.x + moving.w);
	if (right <= left) return { kind: 'miss' };
	const offcut =
		moving.x < below.x
			? { x: moving.x, w: left - moving.x }
			: { x: right, w: moving.x + moving.w - right };
	return { kind: 'placed', placed: { x: left, w: right - left }, offcut, perfect: false };
}

/** How fast the next block slides, in world units a second, by tower height. */
export function speedAt(height: number) {
	return Math.min(150 + height * 8, 520);
}

/** Where a block slides between: it starts off one side and turns at the other. */
export function bounds(w: number) {
	return { min: -w * 0.4, max: WORLD - w * 0.6 };
}

/**
 * Moves a sliding block on by `dt` seconds, turning at the edges. Returns its
 * new left edge and direction (1 rightwards, -1 leftwards).
 */
export function slide(x: number, w: number, dir: 1 | -1, speed: number, dt: number) {
	const { min, max } = bounds(w);
	let next = x + dir * speed * dt;
	let d = dir;
	if (next > max) [next, d] = [max - (next - max), -1];
	if (next < min) [next, d] = [min + (min - next), 1];
	return { x: Math.min(max, Math.max(min, next)), dir: d };
}

// The sky darkens as the tower climbs: day, dusk, night, then space.
const SKY: { at: number; top: string; bottom: string }[] = [
	{ at: 0, top: '#4aa8e8', bottom: '#cdeeff' },
	{ at: 20, top: '#3d5fb5', bottom: '#ffb37a' },
	{ at: 40, top: '#1b1f4d', bottom: '#d9577a' },
	{ at: 60, top: '#070a1f', bottom: '#27245e' },
	{ at: 85, top: '#000000', bottom: '#0a0b1c' }
];

function mix(a: string, b: string, t: number) {
	const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
	const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
	return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(' ')})`;
}

/** The sky's top and bottom colours at a (possibly fractional) tower height. */
export function skyAt(height: number) {
	const i = SKY.findIndex((s) => s.at > height);
	// Past either end, hold that end's colours.
	const a = SKY[i === -1 ? SKY.length - 1 : Math.max(0, i - 1)];
	const b = i > 0 ? SKY[i] : a;
	const t = b === a ? 0 : (height - a.at) / (b.at - a.at);
	return { top: mix(a.top, b.top, t), bottom: mix(a.bottom, b.bottom, t) };
}

/** How visible the stars are (0 to 1), by tower height. */
export function starsAt(height: number) {
	return Math.min(1, Math.max(0, (height - 40) / 30));
}

/** Each block's colour: the hue walks round the wheel as the tower grows. */
export function blockColour(index: number) {
	return `hsl(${(12 + index * 9) % 360} 80% 56%)`;
}
