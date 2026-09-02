<script lang="ts">
	import type { HealthGrade, HealthStatus } from '$lib/server/health';

	let { status, score, grade }: { status: HealthStatus; score: number; grade: HealthGrade } = $props();

	const styles: Record<HealthStatus, string> = {
		healthy: 'bg-emerald-50 text-emerald-700',
		needs_attention: 'bg-amber-50 text-amber-700',
		critical: 'bg-red-50 text-red-700'
	};

	const labels: Record<HealthStatus, string> = {
		healthy: 'Healthy',
		needs_attention: 'Needs Attention',
		critical: 'Critical'
	};

	const dots: Record<HealthStatus, string> = {
		healthy: '🟢',
		needs_attention: '🟡',
		critical: '🔴'
	};
</script>

<span
	class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium {styles[status]}"
>
	{dots[status]}
	{labels[status]} · {score} ({grade})
</span>
