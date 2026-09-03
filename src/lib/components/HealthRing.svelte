<script lang="ts">
	import type { HealthGrade, HealthStatus } from '$lib/server/health';

	let {
		score,
		grade,
		status,
		size = 'md'
	}: { score: number; grade: HealthGrade; status: HealthStatus; size?: 'sm' | 'md' | 'lg' } = $props();

	const dims = { sm: 44, md: 72, lg: 120 };
	const strokes = { sm: 4, md: 6, lg: 9 };
	let dim = $derived(dims[size]);
	let stroke = $derived(strokes[size]);
	let radius = $derived(dim / 2 - stroke);
	let circumference = $derived(2 * Math.PI * radius);

	let offset = $derived(circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference);

	// Ring color leans on the brand gradient when healthy, and shifts toward
	// the semantic severity colors as things get worse - color still carries
	// meaning (README color philosophy), the ring shape carries the brand.
	const ringColors: Record<HealthStatus, { from: string; to: string }> = {
		healthy: { from: '#1677f2', to: '#25c4c8' },
		needs_attention: { from: '#f59e0b', to: '#f97316' },
		critical: { from: '#ef4444', to: '#f97316' }
	};
	let colors = $derived(ringColors[status]);
	let gradientId = `health-ring-${Math.random().toString(36).slice(2)}`;
</script>

<div class="relative inline-flex items-center justify-center" style="width:{dim}px;height:{dim}px">
	<svg width={dim} height={dim} viewBox="0 0 {dim} {dim}" class="-rotate-90">
		<defs>
			<linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color={colors.from} />
				<stop offset="1" stop-color={colors.to} />
			</linearGradient>
		</defs>
		<circle cx={dim / 2} cy={dim / 2} r={radius} fill="none" stroke="currentColor" class="text-neutral-100" stroke-width={stroke} />
		<circle
			cx={dim / 2}
			cy={dim / 2}
			r={radius}
			fill="none"
			stroke="url(#{gradientId})"
			stroke-width={stroke}
			stroke-linecap="round"
			stroke-dasharray={circumference}
			stroke-dashoffset={offset}
			style="transition: stroke-dashoffset 0.4s ease"
		/>
	</svg>
	<div class="absolute flex flex-col items-center justify-center leading-none">
		<span class={size === 'sm' ? 'text-xs font-bold text-neutral-900' : size === 'lg' ? 'text-3xl font-bold text-neutral-900' : 'text-lg font-bold text-neutral-900'}>
			{score}
		</span>
		{#if size !== 'sm'}
			<span class="mt-0.5 text-[10px] font-medium tracking-wide text-neutral-400 uppercase">{grade}</span>
		{/if}
	</div>
</div>
