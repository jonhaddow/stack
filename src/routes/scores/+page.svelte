<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
</script>

<svelte:head><title>Scores · Stack</title></svelte:head>

<main class="page">
	<a class="back" href="/">← Play</a>
	<h1>Scores</h1>

	<section>
		<h2>Tallest towers</h2>
		{#if data.top.length}
			<ol class="board">
				{#each data.top as row, i (i)}
					<li>
						<span class="rank">{i + 1}</span>
						<span class="who">
							{row.name}
							<small
								>{day.format(new Date(row.at))}{row.perfects
									? ` · ${row.perfects} perfect`
									: ''}</small
							>
						</span>
						<span class="score">{row.height}</span>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="empty">No towers yet. Go and build one.</p>
		{/if}
	</section>

	{#if data.bests.length}
		<section>
			<h2>Everyone’s best</h2>
			<ul class="bests">
				{#each data.bests as row (row.name)}
					<li style:--bar="{(row.best / data.bests[0].best) * 100}%">
						<span>{row.name}</span>
						<span class="score">{row.best}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<form method="POST" action="/logout">
		<button class="signout">Sign out {data.user?.name}</button>
	</form>
</main>

<style>
	h1 {
		font-size: 88px;
		color: var(--paper);
		text-shadow: 0 5px 0 var(--ink);
	}
	section {
		margin-top: 28px;
	}
	h2 {
		font-size: 30px;
		margin-bottom: 10px;
	}
	ol,
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 6px;
	}
	.board li {
		display: grid;
		grid-template-columns: 44px 1fr auto;
		align-items: center;
		background: var(--paper);
		box-shadow: 0 4px 0 #9db4d4;
	}
	.board li:first-child {
		background: var(--slab);
		color: var(--paper);
		box-shadow: 0 4px 0 var(--slab-edge);
	}
	.board li:first-child small {
		color: inherit;
	}
	.rank {
		align-self: stretch;
		display: grid;
		place-items: center;
		background: var(--ink);
		color: var(--paper);
		font: 900 24px/1 var(--display);
	}
	.who {
		padding: 10px 12px;
		font-weight: 700;
	}
	.who small {
		display: block;
		font-weight: 400;
		color: var(--muted);
		font-size: 13px;
	}
	.score {
		padding: 0 14px;
		font: 900 34px/1 var(--display);
	}
	.bests li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0 8px 12px;
		font-weight: 700;
		background: linear-gradient(90deg, var(--paper) var(--bar), rgb(255 255 255 / 0.35) var(--bar));
	}
	.bests .score {
		font-size: 28px;
	}
	form {
		margin-top: 36px;
		text-align: center;
	}
	.signout {
		border: 0;
		background: none;
		color: var(--muted);
		font: inherit;
		text-decoration: underline;
		cursor: pointer;
	}
</style>
