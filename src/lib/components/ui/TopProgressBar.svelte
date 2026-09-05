<script lang="ts">
	import { progressStore } from '$lib/stores/progress.svelte';
</script>

{#if progressStore.visible}
	<div
		class="fixed top-0 left-0 right-0 h-[2px] z-[9999] pointer-events-none overflow-hidden"
		role="progressbar"
		aria-valuemin="0"
		aria-valuemax="100"
		aria-valuenow={Math.round(progressStore.progress)}
	>
		<div
			class="h-full bg-zinc-900 dark:bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)] dark:shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-[width] duration-200 ease-out will-change-[width]"
			style="width: {progressStore.progress}%;"
		></div>
	</div>
{/if}
