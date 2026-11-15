<script lang="ts">
	import type { Snippet } from 'svelte';
	import '@fontsource-variable/big-shoulders-stencil';
	import './app.css';

	let { children }: { children: Snippet } = $props();
</script>

{@render children()}
