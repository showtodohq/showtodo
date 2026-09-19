<script lang="ts">
	import { onMount } from 'svelte';
	import { statsStore } from '$lib/stores/stats.svelte';
	import ActivityHeatmap from '$lib/components/stats/ActivityHeatmap.svelte';
	import WidgetSkeleton from '$lib/components/skeleton/WidgetSkeleton.svelte';
	import DataView from '$lib/components/ui/DataView.svelte';
	import Icon from '@iconify/svelte';

	onMount(() => {
		if (!statsStore.loaded) {
			statsStore.load();
		}
	});
</script>

<div
	class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white/60 dark:bg-zinc-950/60 p-4 backdrop-blur-xs space-y-3.5"
>
	<!-- Header bar: unified pattern with icon, full title, real metric badge and action link -->
	<div class="flex items-center justify-between">
		<a
			href="/stats"
			class="flex items-center gap-2 font-semibold text-xs text-zinc-900 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group/title"
			title="Open full stats dashboard"
		>
			<div class="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
				<Icon icon="lucide:activity" class="h-3.5 w-3.5" />
			</div>
			<span>Site Pulse</span>
		</a>

		<div class="flex items-center gap-1.5 font-mono text-xs">
			{#if statsStore.stats?.overview}
				<span class="text-[10px] text-zinc-400">
					{statsStore.stats.overview.totalUsers} people
				</span>
				<span class="text-[10px] text-zinc-300 dark:text-zinc-700">·</span>
			{/if}
			<a
				href="/stats"
				class="inline-flex items-center gap-0.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors group/link cursor-pointer font-sans"
				title="View full statistics dashboard"
			>
				<span>View all</span>
				<Icon icon="lucide:arrow-right" class="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
			</a>
		</div>
	</div>

	<!-- DataView content -->
	<DataView
		loading={!statsStore.loaded || statsStore.loading}
		empty={!statsStore.stats}
	>
		{#snippet skeleton()}
			<WidgetSkeleton rows={3} />
		{/snippet}

		{#snippet emptyView()}
			<div class="py-3 text-center text-xs text-zinc-400">
				No statistics data yet
			</div>
		{/snippet}

		{#if statsStore.stats}
			{@const overview = statsStore.stats.overview}

			<!-- 4-grid stats -->
			<div class="grid grid-cols-2 gap-2">
				<div class="p-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/40 dark:border-zinc-800/40">
					<div class="text-[11px] text-zinc-400 font-medium">Public Todos</div>
					<div class="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
						{(overview?.totalTodos ?? 0).toLocaleString()}
					</div>
				</div>

				<div class="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-800/30">
					<div class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Completed</div>
					<div class="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
						{(overview?.completedTodos ?? 0).toLocaleString()}
					</div>
				</div>

				<div class="p-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/40 dark:border-zinc-800/40">
					<div class="text-[11px] text-zinc-400 font-medium">Overall Completion</div>
					<div class="text-base font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
						{overview?.completionRate ?? 0}%
					</div>
				</div>

				<div class="p-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/40 dark:border-zinc-800/40">
					<div class="text-[11px] text-zinc-400 font-medium">Active Today</div>
					<div class="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
						{overview?.todayActiveUsers ?? 0}
					</div>
				</div>
			</div>

			<!-- Heatmap -->
			{#if statsStore.stats.heatmap}
				<div class="pt-1 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-1.5">
					<div class="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
						<span>Past year activity</span>
						<span class="font-mono">{statsStore.stats.heatmap.totalActivities ?? 0} activities</span>
					</div>
					<ActivityHeatmap days={statsStore.stats.heatmap.days || []} compact={true} />
				</div>
			{/if}

			<!-- Bottom link -->
			<div class="pt-1 flex items-center justify-between text-[11px] text-zinc-400">
				<span>{overview?.totalReactions ?? 0} reactions given</span>
				<a
					href="/stats"
					class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
				>
					<span>Explore stats</span>
					<Icon icon="lucide:arrow-up-right" class="h-3.5 w-3.5" />
				</a>
			</div>
		{/if}
	</DataView>
</div>
