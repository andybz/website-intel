<script lang="ts">
	import { getEventTypeLabel } from '$lib/utils/event-labels';

	let { eventType }: { eventType: string } = $props();
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 ring-1 ring-inset ring-neutral-200"
>
	<span class="h-1.5 w-1.5 rounded-full" style="background-color: var(--color-brand-teal)"></span>
	{getEventTypeLabel(eventType)}
</span>
