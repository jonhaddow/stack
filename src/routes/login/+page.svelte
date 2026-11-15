<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// A little tower for the sign-in page, offset like a real game's.
	const slabs = [0, 6, -4, 10, 4, -8, 2].map((dx, i) => ({
		dx,
		w: 70 - i * 5,
		hue: (12 + i * 9) % 360
	}));
</script>

<svelte:head><title>Sign in · Stack</title></svelte:head>

<main class="page login">
	<a class="back" href="/">← Play</a>
	<h1>Stack</h1>
	<p class="lede">Sign in to keep your scores and see who’s built the tallest tower.</p>

	<div class="tower" aria-hidden="true">
		{#each slabs.toReversed() as s, i (i)}
			<span style:width="{s.w}%" style:translate="{s.dx}% 0" style:background="hsl({s.hue} 80% 56%)"
			></span>
		{/each}
		<span class="footing"></span>
	</div>

	{#if data.error}<p class="error" role="alert">{data.error}</p>{/if}

	<div class="actions">
		<a class="slab" href="/auth/google?next={encodeURIComponent(data.next)}">Sign in with Google</a>
		{#each data.devUsers as u (u.email)}
			<form method="POST" action="?/dev">
				<input type="hidden" name="email" value={u.email} />
				<input type="hidden" name="next" value={data.next} />
				<button class="slab plain">Sign in as {u.name}</button>
			</form>
		{/each}
	</div>
</main>

<style>
	.login {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}
	h1 {
		font-size: 128px;
		color: var(--paper);
		text-shadow: 0 6px 0 var(--ink);
	}
	.lede {
		max-width: 260px;
		margin: 10px 0 0;
		font-weight: 600;
	}
	.tower {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: center;
		margin: 24px 0 0;
		min-height: 160px;
	}
	.tower span {
		display: block;
		height: 22px;
		box-shadow: inset 0 -5px 0 rgb(0 0 0 / 0.22);
	}
	.tower .footing {
		width: 80%;
		height: 40px;
		background: var(--ink);
		box-shadow: none;
	}
	.error {
		margin: 16px 0 0;
		padding: 12px;
		background: var(--paper);
		border-left: 6px solid var(--slab);
	}
	.actions {
		display: grid;
		gap: 16px;
		margin-top: 20px;
	}
</style>
