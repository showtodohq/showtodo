<script lang="ts">
	interface Props {
		rows?: number;
	}

	let { rows = 3 }: Props = $props();
</script>

<div class="space-y-1.5 animate-pulse" aria-busy="true">
	{#each Array(rows) as _, i (i)}
		<div class="flex items-center justify-between gap-3 py-2 px-2.5 rounded-xl">
			<div class="flex items-center gap-2 flex-1 min-w-0">
				<div class="w-3.5 h-3.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 shrink-0"></div>
				<div class="h-3.5 w-3/4 bg-zinc-200/70 dark:bg-zinc-800/70 rounded"></div>
			</div>
			<div class="w-4 h-4 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 shrink-0"></div>
		</div>
	{/each}
</div>
