<script lang="ts">
	import {
		BLOCK_HEIGHT,
		START_WIDTH,
		WORLD,
		blockColour,
		bounds,
		drop,
		skyAt,
		slide,
		speedAt,
		starsAt,
		type Slab
	} from '#lib/stacker.ts';

	type Props = {
		/** The player's best so far, or null when signed out (then it's kept on this device). */
		best: number | null;
		signedIn: boolean;
	};
	let { best: serverBest, signedIn }: Props = $props();

	const LOCAL_BEST = 'stack-best';

	let phase = $state<'ready' | 'playing' | 'over'>('ready');
	let height = $state(0);
	let perfects = $state(0);
	let streak = $state(0);
	let flash = $state(0);
	let best = $derived(serverBest ?? 0);
	let newBest = $state(false);
	let saving = $state(false);
	let saveFailed = $state(false);

	// Signed out, the best is kept on this device.
	$effect(() => {
		if (!signedIn) best = Number(localStorage.getItem(LOCAL_BEST) ?? 0);
	});

	// Everything the canvas draws; plain objects, not state, as it changes every frame.
	type Offcut = Slab & {
		y: number;
		vx: number;
		vy: number;
		rot: number;
		vr: number;
		colour: string;
	};
	const base: Slab = { x: (WORLD - START_WIDTH) / 2, w: START_WIDTH };
	let tower: Slab[] = [base];
	let moving = { x: 0, w: START_WIDTH, dir: 1 as 1 | -1 };
	let offcuts: Offcut[] = [];
	let rings: { slab: Slab; y: number; t: number }[] = [];
	let cam = 0;
	let zoom = 1;
	const stars = Array.from({ length: 90 }, () => ({
		x: Math.random(),
		y: Math.random(),
		r: Math.random() * 1.4 + 0.4
	}));

	function nextBlock() {
		const top = tower[tower.length - 1];
		// Alternate sides, so you can't learn one rhythm.
		const fromLeft = tower.length % 2 === 0;
		const { min, max } = bounds(top.w);
		moving = { x: fromLeft ? min : max, w: top.w, dir: fromLeft ? 1 : -1 };
	}

	function start() {
		tower = [base];
		offcuts = [];
		rings = [];
		height = 0;
		perfects = 0;
		streak = 0;
		newBest = false;
		saveFailed = false;
		nextBlock();
		phase = 'playing';
	}

	function tap() {
		if (phase === 'ready') return start();
		if (phase !== 'playing') return;
		const top = tower[tower.length - 1];
		const y = tower.length * BLOCK_HEIGHT;
		const colour = blockColour(tower.length);
		const result = drop(top, moving, streak);
		if (result.kind === 'miss') {
			offcuts.push({
				...moving,
				y,
				vx: moving.dir * 60,
				vy: 0,
				rot: 0,
				vr: moving.dir * 2,
				colour
			});
			void gameOver();
			return;
		}
		tower.push(result.placed);
		height = tower.length - 1;
		if (result.perfect) {
			perfects++;
			streak++;
			flash++;
			rings.push({ slab: result.placed, y, t: 0 });
			navigator.vibrate?.(12);
		} else {
			streak = 0;
		}
		if (result.offcut) {
			const side = result.offcut.x < result.placed.x ? -1 : 1;
			offcuts.push({ ...result.offcut, y, vx: side * 40, vy: 0, rot: 0, vr: side * 1.5, colour });
		}
		nextBlock();
	}

	async function gameOver() {
		phase = 'over';
		const before = best;
		if (height > before) {
			best = height;
			newBest = true;
		}
		if (!signedIn) {
			localStorage.setItem(LOCAL_BEST, String(best));
			return;
		}
		if (height === 0) return;
		saving = true;
		try {
			const res = await fetch('/api/scores', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ height, perfects })
			});
			if (!res.ok) throw new Error(String(res.status));
			best = ((await res.json()) as { best: number }).best;
		} catch {
			saveFailed = true;
		} finally {
			saving = false;
		}
	}

	function onKey(e: KeyboardEvent) {
		if (e.code !== 'Space' && e.code !== 'Enter') return;
		if (phase === 'over') return;
		e.preventDefault();
		tap();
	}

	/** Runs the game's drawing loop on the canvas for as long as it's on the page. */
	function loop(canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext('2d')!;
		let w = 0;
		let h = 0;
		let dpr = 1;
		const resize = new ResizeObserver(() => {
			dpr = Math.min(window.devicePixelRatio || 1, 3);
			w = canvas.clientWidth;
			h = canvas.clientHeight;
			canvas.width = Math.round(w * dpr);
			canvas.height = Math.round(h * dpr);
		});
		resize.observe(canvas);

		let last = performance.now();
		let frame = requestAnimationFrame(function tick(now) {
			const dt = Math.min((now - last) / 1000, 1 / 20);
			last = now;
			// Nothing to place things against until the canvas has a size.
			if (w && h) {
				step(dt);
				draw();
			}
			frame = requestAnimationFrame(tick);
		});

		function step(dt: number) {
			if (phase === 'playing') {
				const next = slide(moving.x, moving.w, moving.dir, speedAt(height), dt);
				moving.x = next.x;
				moving.dir = next.dir;
			}
			for (const o of offcuts) {
				o.vy -= 1400 * dt;
				o.x += o.vx * dt;
				o.y += o.vy * dt;
				o.rot += o.vr * dt;
			}
			offcuts = offcuts.filter((o) => o.y > cam - 1200);
			for (const r of rings) r.t += dt;
			rings = rings.filter((r) => r.t < 0.5);

			// Keep the top of the tower a little above the middle of the screen; on
			// game over, pull back to show the whole thing.
			const scale = Math.min(w, 480) / WORLD;
			const viewWorld = h / scale;
			const towerTop = (tower.length + 1) * BLOCK_HEIGHT;
			const targetZoom =
				phase === 'over' ? Math.min(1, (viewWorld * 0.6) / (towerTop + BLOCK_HEIGHT * 4)) : 1;
			const targetCam = phase === 'over' ? 0 : Math.max(0, towerTop - viewWorld * 0.55);
			const ease = 1 - Math.exp(-dt * 6);
			zoom += (targetZoom - zoom) * ease;
			cam += (targetCam - cam) * ease;
		}

		function draw() {
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			const level = phase === 'over' ? height : cam / BLOCK_HEIGHT;
			const sky = skyAt(level);
			const grad = ctx.createLinearGradient(0, 0, 0, h);
			grad.addColorStop(0, sky.top);
			grad.addColorStop(1, sky.bottom);
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, w, h);

			const starAlpha = starsAt(level);
			if (starAlpha > 0) {
				ctx.fillStyle = `rgb(255 255 255 / ${starAlpha})`;
				for (const s of stars) {
					ctx.beginPath();
					ctx.arc(s.x * w, s.y * h * 0.85, s.r, 0, Math.PI * 2);
					ctx.fill();
				}
			}

			const s = (Math.min(w, 480) / WORLD) * zoom;
			const cx = w / 2;
			const ground = h - 90;
			const sx = (x: number) => cx + (x - WORLD / 2) * s;
			// World y is the bottom of a block, upwards from the ground.
			const sy = (y: number) => ground - (y - cam * zoom) * s;
			const bh = BLOCK_HEIGHT * s;

			// The base runs down off the bottom of the screen, like a building's footing.
			ctx.fillStyle = '#0b1a3a';
			ctx.fillRect(sx(base.x), sy(BLOCK_HEIGHT), base.w * s, h - sy(BLOCK_HEIGHT) + 4);

			const slab = (b: Slab, y: number, colour: string) => {
				const top = sy(y + BLOCK_HEIGHT);
				ctx.fillStyle = colour;
				ctx.fillRect(sx(b.x), top, b.w * s, bh);
				// A darker band along the bottom edge gives each slab some weight.
				ctx.fillStyle = 'rgb(0 0 0 / 0.22)';
				ctx.fillRect(sx(b.x), top + bh * 0.78, b.w * s, bh * 0.22);
			};

			for (let i = 1; i < tower.length; i++) {
				const y = i * BLOCK_HEIGHT;
				if (sy(y) < -bh || sy(y + BLOCK_HEIGHT) > h + bh) continue;
				slab(tower[i], y, blockColour(i));
			}
			if (phase === 'playing') slab(moving, tower.length * BLOCK_HEIGHT, blockColour(tower.length));

			for (const o of offcuts) {
				ctx.save();
				ctx.translate(sx(o.x + o.w / 2), sy(o.y + BLOCK_HEIGHT / 2));
				ctx.rotate(o.rot);
				ctx.fillStyle = o.colour;
				ctx.fillRect((-o.w / 2) * s, -bh / 2, o.w * s, bh);
				ctx.restore();
			}

			for (const r of rings) {
				const grow = r.t * 40 * s;
				ctx.strokeStyle = `rgb(255 255 255 / ${1 - r.t / 0.5})`;
				ctx.lineWidth = 3;
				ctx.strokeRect(
					sx(r.slab.x) - grow,
					sy(r.y + BLOCK_HEIGHT) - grow,
					r.slab.w * s + grow * 2,
					bh + grow * 2
				);
			}
		}

		return () => {
			cancelAnimationFrame(frame);
			resize.disconnect();
		};
	}
</script>

<svelte:window onkeydown={onKey} />

<!-- Tapping anywhere drops the block (the overlay's buttons stop their own taps).
     Space or Enter does the same, from the window. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="game" onpointerdown={tap} data-phase={phase}>
	<canvas {@attach loop} aria-label="The tower"></canvas>

	{#if phase === 'playing'}
		<div class="hud" aria-live="polite">
			<span class="height" data-testid="height">{height}</span>
			{#key flash}
				{#if flash && streak > 0}
					<span class="perfect">Perfect{streak > 1 ? ` ×${streak}` : ''}</span>
				{/if}
			{/key}
		</div>
	{:else if phase === 'ready'}
		<div class="title">
			<h1>Stack</h1>
			<p>Tap to drop. Line them up.</p>
			{#if best}<p class="best">Best {best}</p>{/if}
		</div>
		<nav class="corner" onpointerdown={(e) => e.stopPropagation()}>
			<a href="/scores">Scores</a>
		</nav>
		<p class="hint">Tap to start</p>
	{:else}
		<div class="over" onpointerdown={(e) => e.stopPropagation()}>
			<h2>{height}</h2>
			<p class="label">{height === 1 ? 'block' : 'blocks'} high</p>
			<p class="best">
				{#if newBest && height > 0}New best!{:else}Best {best}{/if}
				{#if perfects}· {perfects} perfect{/if}
			</p>
			{#if saving}<p class="note">Saving…</p>{/if}
			{#if saveFailed}<p class="note">Couldn’t save that one.</p>{/if}
			<button class="slab" onclick={start}>Play again</button>
			{#if signedIn}
				<a class="slab plain" href="/scores">Scores</a>
			{:else}
				<a class="slab plain" href="/login">Sign in to save scores</a>
			{/if}
		</div>
	{/if}
</div>

<style>
	.game {
		position: fixed;
		inset: 0;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		overflow: hidden;
		color: #fff;
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
	.hud,
	.title {
		position: absolute;
		top: calc(var(--safe-top) + 24px);
		left: 0;
		right: 0;
		text-align: center;
		pointer-events: none;
	}
	.height {
		display: block;
		font: 900 96px/1 var(--display);
		text-shadow: 0 4px 0 rgb(0 0 0 / 0.18);
	}
	.perfect {
		display: inline-block;
		margin-top: 6px;
		padding: 4px 10px;
		background: #fff;
		color: var(--ink);
		font: 800 22px/1 var(--display);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		animation: pop 0.7s ease-out forwards;
	}
	@keyframes pop {
		0% {
			transform: scale(1.4);
			opacity: 1;
		}
		70% {
			transform: scale(1);
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
	.title {
		top: calc(var(--safe-top) + 72px);
	}
	.title h1 {
		font-size: 120px;
		color: var(--ink);
	}
	.title p {
		margin: 8px 0 0;
		color: var(--ink);
		font-weight: 600;
	}
	.title .best {
		font: 800 28px/1 var(--display);
		text-transform: uppercase;
	}
	.corner {
		position: absolute;
		top: calc(var(--safe-top) + 16px);
		right: 16px;
	}
	.corner a {
		display: block;
		padding: 8px 12px;
		background: var(--ink);
		color: #fff;
		font: 800 20px/1 var(--display);
		text-transform: uppercase;
		text-decoration: none;
	}
	.hint {
		position: absolute;
		top: 52%;
		left: 0;
		right: 0;
		margin: 0;
		text-align: center;
		font: 800 26px/1 var(--display);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--ink);
		animation: blink 1.4s steps(2, jump-none) infinite;
		pointer-events: none;
	}
	@keyframes blink {
		50% {
			opacity: 0.2;
		}
	}
	.over {
		position: absolute;
		left: 50%;
		top: calc(var(--safe-top) + 24px);
		transform: translateX(-50%);
		width: min(340px, calc(100% - 40px));
		display: grid;
		gap: 14px;
		text-align: center;
	}
	.over h2 {
		font-size: 140px;
		text-shadow: 0 5px 0 rgb(0 0 0 / 0.2);
	}
	.over p {
		margin: 0;
	}
	.over .label {
		margin-top: -10px;
		font: 800 26px/1 var(--display);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.over .best {
		font: 700 22px/1 var(--display);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 10px;
	}
	.note {
		font-size: 14px;
	}
</style>
