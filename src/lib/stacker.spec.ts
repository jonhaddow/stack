import { describe, expect, it } from 'vitest';
import { START_WIDTH, bounds, drop, skyAt, slide, speedAt, starsAt } from './stacker.ts';

describe('drop', () => {
	const below = { x: 100, w: 150 };

	it('slices off what hangs over the right', () => {
		expect(drop(below, { x: 130, w: 150 })).toEqual({
			kind: 'placed',
			placed: { x: 130, w: 120 },
			offcut: { x: 250, w: 30 },
			perfect: false
		});
	});

	it('slices off what hangs over the left', () => {
		expect(drop(below, { x: 60, w: 150 })).toEqual({
			kind: 'placed',
			placed: { x: 100, w: 110 },
			offcut: { x: 60, w: 40 },
			perfect: false
		});
	});

	it('snaps a near-perfect drop into line', () => {
		expect(drop(below, { x: 104, w: 150 })).toEqual({
			kind: 'placed',
			placed: below,
			offcut: null,
			perfect: true
		});
	});

	it('grows the block back on a streak of perfect drops, up to the start width', () => {
		const grown = drop(below, { x: 100, w: 150 }, 2);
		expect(grown).toMatchObject({ placed: { x: 95, w: 160 } });
		const full = { x: 80, w: START_WIDTH };
		expect(drop(full, full, 5)).toMatchObject({ placed: full });
	});

	it('misses when nothing overlaps', () => {
		expect(drop(below, { x: 250, w: 150 })).toEqual({ kind: 'miss' });
		expect(drop(below, { x: -60, w: 150 })).toEqual({ kind: 'miss' });
	});
});

describe('slide', () => {
	it('moves at its speed', () => {
		expect(slide(0, 100, 1, 200, 0.5)).toEqual({ x: 100, dir: 1 });
	});

	it('turns at the edges', () => {
		const { max, min } = bounds(100);
		expect(slide(max - 10, 100, 1, 100, 0.3)).toEqual({ x: max - 20, dir: -1 });
		expect(slide(min + 10, 100, -1, 100, 0.3)).toEqual({ x: min + 20, dir: 1 });
	});
});

it('speeds up with height, to a limit', () => {
	expect(speedAt(10)).toBeGreaterThan(speedAt(0));
	expect(speedAt(1000)).toBe(520);
});

it('darkens the sky and brings out the stars as the tower climbs', () => {
	expect(skyAt(0).top).toBe('rgb(74 168 232)');
	expect(skyAt(10).top).not.toBe(skyAt(0).top);
	expect(skyAt(500).top).toBe('rgb(0 0 0)');
	expect(starsAt(0)).toBe(0);
	expect(starsAt(200)).toBe(1);
});
