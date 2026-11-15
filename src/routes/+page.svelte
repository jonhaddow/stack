<script lang="ts">
	import Game from '#lib/components/Game.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Stack</title></svelte:head>

<Game best={data.best} signedIn={!!data.user} />
