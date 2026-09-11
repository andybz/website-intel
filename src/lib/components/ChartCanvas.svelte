<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Chart, type ChartConfiguration } from 'chart.js/auto';

	let { config }: { config: ChartConfiguration } = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | undefined;

	$effect(() => {
		// Re-read config on every change and rebuild - simplest correct approach
		// for the small, infrequently-updated datasets this app renders (chart
		// history is fetched once per page load, not live-streamed).
		chart?.destroy();
		chart = new Chart(canvas, config);

		return () => chart?.destroy();
	});

	onDestroy(() => chart?.destroy());
</script>

<canvas bind:this={canvas}></canvas>
