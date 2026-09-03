<script lang="ts">
	import { getEventTypeLabel } from '$lib/utils/event-labels';

	let { eventType }: { eventType: string } = $props();
</script>

<span
	class="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 ring-1 ring-inset ring-neutral-200"
>
	{getEventTypeLabel(eventType)}
</span>
