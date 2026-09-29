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

<div class="space-y-3.5">
	<!-- Header bar: unified pattern with icon, full title, real metric badge and action link -->
	<div class="flex items-center justify-between gap-2 flex-wrap">
		<a
			href="/stats"
			class="flex items-center gap-2.5 font-bold text-sm text-zinc-900 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group/title"
			title="Open full stats dashboard"
		>
			<div class="p-1.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
				<Icon icon="lucide:activity" class="h-4 w-4" />
			</div>
			<span>Site Pulse</span>
		</a>

		<div class="flex items-center gap-1.5 font-mono text-xs">
			{#if statsStore.stats?.overview}
				<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100/70 dark:bg-zinc-800/50">
					{statsStore.stats.overview.totalUsers} people
				</span>
			{/if}
			<a
				href="/stats"
				class="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors group/link cursor-pointer font-sans"
				title="View full statistics dashboard"
			>
				<span>View all</span>
				<Icon icon="lucide:arrow-right" class="h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 group-hover/link:translate-x-0.5" />
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

			<!-- 4-grid stats (无边框轻底色，向设置页看齐) -->
			<div class="grid grid-cols-2 gap-2">
				<div class="p-2.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/50">
					<div class="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Public Todos</div>
					<div class="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
						{(overview?.totalTodos ?? 0).toLocaleString()}
					</div>
				</div>

				<div class="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
					<div class="text-[11px] font-medium opacity-90">Completed</div>
					<div class="text-base font-bold font-mono mt-0.5">
						{(overview?.completedTodos ?? 0).toLocaleString()}
					</div>
				</div>

				<div class="p-2.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/50">
					<div class="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Overall Completion</div>
					<div class="text-base font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
						{overview?.completionRate ?? 0}%
					</div>
				</div>

				<div class="p-2.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/50">
					<div class="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Active Today</div>
					<div class="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
						{overview?.todayActiveUsers ?? 0}
					</div>
				</div>
			</div>

			<!-- Heatmap -->
			{#if statsStore.stats.heatmap}
				<div class="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 space-y-1.5">
					<div class="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
						<span>Past year activity</span>
						<span class="font-mono">{statsStore.stats.heatmap.totalActivities ?? 0} activities</span>
					</div>
					<ActivityHeatmap days={statsStore.stats.heatmap.days || []} compact={true} />
				</div>
			{/if}

			<!-- Bottom link -->
			<div class="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
				<span>{overview?.totalReactions ?? 0} reactions given</span>
				<a
					href="/stats"
					class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 group/explore"
				>
					<span>Explore stats</span>
					<Icon icon="lucide:arrow-up-right" class="h-3.5 w-3.5 transition-transform duration-200 group-hover/explore:translate-x-0.5 group-hover/explore:-translate-y-0.5" />
				</a>
			</div>
		{/if}
	</DataView>
</div>
