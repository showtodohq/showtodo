<script lang="ts">
	import { onMount } from 'svelte';
	import { statsStore } from '$lib/stores/stats.svelte';
	import { getCategoryConfig } from '$lib/constants/categories';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import CategoryBadge from '$lib/components/todo/CategoryBadge.svelte';
	import StatsSkeleton from '$lib/components/skeleton/StatsSkeleton.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import ActivityHeatmap from '$lib/components/stats/ActivityHeatmap.svelte';
	import CategoryDonutChart from '$lib/components/stats/CategoryDonutChart.svelte';
	import Icon from '@iconify/svelte';

	let hoveredTrendIndex = $state<number | null>(null);

	const trendMaxVal = $derived(
		statsStore.stats && statsStore.stats.trend.length > 0
			? Math.max(...statsStore.stats.trend.map((t) => Math.max(t.created, t.completed, 1)))
			: 1
	);

	onMount(() => {
		statsStore.load(false, 365);
	});

	function refresh() {
		statsStore.load(true, 365);
	}
</script>

<svelte:head>
	<title>Stats Dashboard · ShowTodo</title>
</svelte:head>

<div class="w-full space-y-6 sm:space-y-8">
	<!-- Page Title and Controls -->
	<div class="flex items-center justify-between gap-4 pb-2 border-b border-zinc-100 dark:border-zinc-800/60">
		<div class="flex items-center gap-2">
			<span class="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
				Stats Dashboard
			</span>
		</div>

		<div class="flex items-center gap-2 font-mono text-xs">
			<button
				type="button"
				onclick={refresh}
				disabled={statsStore.loading}
				class="px-2.5 py-1 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
				title="Fetch latest data"
			>
				<Icon icon="lucide:rotate-cw" class="h-3.5 w-3.5 {statsStore.loading ? 'animate-spin' : ''}" />
				<span>Refresh</span>
			</button>
		</div>
	</div>

	<!-- Main Content Area -->
	{#if !statsStore.loaded && statsStore.loading}
		<StatsSkeleton />
	{:else if statsStore.stats}
		{@const overview = statsStore.stats.overview}
		{@const categories = statsStore.stats.categories}
		{@const trend = statsStore.stats.trend}
		{@const heatmap = statsStore.stats.heatmap}
		{@const topTopics = statsStore.stats.topTopics}
		{@const topUsers = statsStore.stats.topUsers}

		<!-- 1. Core Metric Cards -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
			<!-- Total Public Todos -->
			<div
				class="p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xs space-y-1"
			>
				<div class="flex items-center justify-between text-xs text-zinc-400 font-medium">
					<span>Public Todos</span>
					<Icon icon="lucide:list-todo" class="h-4 w-4 text-blue-500 shrink-0" />
				</div>
				<div class="text-2xl sm:text-3xl font-black font-mono text-zinc-900 dark:text-zinc-100">
					{overview.totalTodos.toLocaleString()}
				</div>
				<div class="text-[11px] text-zinc-400">
					Today: <strong class="text-zinc-700 dark:text-zinc-300 font-semibold">{overview.todayCreated}</strong> new
				</div>
			</div>

			<!-- Completed Todos -->
			<div
				class="p-4 sm:p-5 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 backdrop-blur-xs space-y-1"
			>
				<div class="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
					<span>Completed Todos</span>
					<Icon icon="lucide:check-circle-2" class="h-4 w-4 text-emerald-500 shrink-0" />
				</div>
				<div class="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
					{overview.completedTodos.toLocaleString()}
				</div>
				<div class="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
					Today: <strong class="font-bold">{overview.todayCompleted}</strong> check-ins
				</div>
			</div>

			<!-- Completion Rate -->
			<div
				class="p-4 sm:p-5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 backdrop-blur-xs space-y-1"
			>
				<div class="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
					<span>Overall Completion</span>
					<Icon icon="lucide:zap" class="h-4 w-4 text-amber-500 shrink-0" />
				</div>
				<div class="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
					{overview.completionRate}%
				</div>
				<div class="text-[11px] text-amber-600/80 dark:text-amber-400/80">
					{overview.inProgressTodos} in progress
				</div>
			</div>

			<!-- People -->
			<div
				class="p-4 sm:p-5 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 backdrop-blur-xs space-y-1"
			>
				<div class="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-medium">
					<span>People</span>
					<Icon icon="lucide:users" class="h-4 w-4 text-blue-500 shrink-0" />
				</div>
				<div class="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
					{overview.totalUsers.toLocaleString()}
				</div>
				<div class="text-[11px] text-blue-600/80 dark:text-blue-400/80">
					Active today: <strong class="font-bold">{overview.todayActiveUsers}</strong>
				</div>
			</div>
		</div>

		<!-- 2. Activity Heatmap -->
		<div
			class="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-5 sm:p-7 backdrop-blur-md shadow-xs space-y-4"
		>
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
				<h2 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
					<Icon icon="lucide:calendar" class="h-4 w-4 text-emerald-500 shrink-0" />
					<span>Activity Heatmap</span>
				</h2>
				<div class="flex items-center gap-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
					<span>Total activities: <strong class="text-zinc-900 dark:text-zinc-100">{heatmap.totalActivities}</strong></span>
					<span>·</span>
					<span>Peak daily: <strong class="text-emerald-600 dark:text-emerald-400">{heatmap.maxDayCount}</strong></span>
				</div>
			</div>

			<ActivityHeatmap days={heatmap.days} />
		</div>

		<!-- 3. 14-Day Trend -->
		<div
			class="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-5 sm:p-7 backdrop-blur-md shadow-xs space-y-4"
		>
			<div class="flex items-center justify-between">
				<h2 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
					<Icon icon="lucide:trending-up" class="h-4 w-4 text-blue-500 shrink-0" />
					<span>14-Day Trend</span>
				</h2>
				<div class="flex items-center gap-3 text-xs">
					<div class="flex items-center gap-1.5">
						<span class="h-2 w-2 rounded-full bg-zinc-400"></span>
						<span class="text-zinc-500 dark:text-zinc-400">New</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
						<span class="text-zinc-500 dark:text-zinc-400">Completed</span>
					</div>
				</div>
			</div>

			{#if trend.length === 0}
				<EmptyState
					title="No trend data recorded"
					class="py-8 border-none bg-transparent"
				>
					{#snippet icon()}
						<Icon icon="lucide:trending-up" class="h-6 w-6 text-blue-500" />
					{/snippet}
				</EmptyState>
			{:else}
				<!-- Trend SVG Bar Chart -->
				<div class="relative pt-6 pb-2">
					<div class="grid grid-cols-14 gap-1 sm:gap-2 items-end h-32 w-full">
						{#each trend as item, i (item.date)}
							{@const createdH = Math.max(4, Math.round((item.created / trendMaxVal) * 100))}
							{@const completedH = Math.max(4, Math.round((item.completed / trendMaxVal) * 100))}
							<div
								role="group"
								aria-label={`${item.date}: created ${item.created}, completed ${item.completed}`}
								class="flex flex-col items-center gap-1 h-full justify-end group cursor-pointer"
								onmouseenter={() => (hoveredTrendIndex = i)}
								onmouseleave={() => (hoveredTrendIndex = null)}
							>
								<div class="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
									<!-- Created bar -->
									<div
										class="w-1.5 sm:w-2 rounded-t-xs bg-zinc-300 dark:bg-zinc-700 group-hover:bg-zinc-400 transition-all"
										style="height: {createdH}%;"
									></div>
									<!-- Completed bar -->
									<div
										class="w-1.5 sm:w-2 rounded-t-xs bg-emerald-500 dark:bg-emerald-400 group-hover:bg-emerald-400 transition-all shadow-xs"
										style="height: {completedH}%;"
									></div>
								</div>
								<div class="text-[9px] font-mono text-zinc-400 truncate w-full text-center">
									{item.date.slice(5)}
								</div>
							</div>
						{/each}
					</div>

					<!-- Hover popover -->
					{#if hoveredTrendIndex !== null}
						{@const hItem = trend[hoveredTrendIndex]}
						<div
							class="absolute top-0 right-4 px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 text-xs shadow-md backdrop-blur-xs flex items-center gap-3 animate-in fade-in duration-100 font-mono"
						>
							<span class="font-bold text-zinc-900 dark:text-zinc-100">{hItem.date}</span>
							<span class="text-zinc-500">New: <strong class="text-zinc-900 dark:text-zinc-100">{hItem.created}</strong></span>
							<span class="text-emerald-600 dark:text-emerald-400">Completed: <strong class="font-bold">{hItem.completed}</strong></span>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- 4. Category Insights -->
		<div
			class="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-5 sm:p-7 backdrop-blur-md shadow-xs space-y-4"
		>
			<h2 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
				<Icon icon="lucide:target" class="h-4 w-4 text-indigo-500 shrink-0" />
				<span>Category Insights</span>
			</h2>

			<CategoryDonutChart {categories} totalTodos={overview.totalTodos} />
		</div>

		<!-- 5. Top Leaderboards -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
			<!-- Top Trending Todos Top 5 -->
			<div
				class="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-5 sm:p-7 backdrop-blur-md shadow-xs space-y-4"
			>
					<div class="flex items-center justify-between">
						<h2 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
							<Icon icon="lucide:flame" class="h-4 w-4 text-orange-500 shrink-0" />
							<span>Top Trending Todos</span>
						</h2>
						<a
							href="/trending"
							class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
						>
							Explore Trending →
						</a>
					</div>

					{#if topTopics.length === 0}
						<EmptyState
							title="No trending todos yet"
							class="py-8 border-none bg-transparent"
						>
							{#snippet icon()}
								<Icon icon="lucide:flame" class="h-6 w-6 text-orange-500" />
							{/snippet}
						</EmptyState>
					{:else}
						<div class="space-y-1.5">
							{#each topTopics as topic (topic.topicHash)}
								<a
									href="/trending/{topic.topicHash}"
									class="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-all duration-150 group"
								>
									<div class="min-w-0 flex-1">
										<span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline truncate block">
											{topic.content}
										</span>
									</div>

									<div class="flex items-center gap-3 shrink-0 text-xs font-mono">
										<span class="text-zinc-500 dark:text-zinc-400">
											<strong class="text-zinc-900 dark:text-zinc-100">{topic.totalParticipants}</strong> people
										</span>
										<span class="text-emerald-600 dark:text-emerald-400">
											{topic.doneCount} completed
										</span>
									</div>
								</a>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Top Achievers Top 5 -->
				<div
					class="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-5 sm:p-7 backdrop-blur-md shadow-xs space-y-4"
				>
					<h2 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
						<Icon icon="lucide:trophy" class="h-4 w-4 text-amber-500 shrink-0" />
						<span>Top Achievers</span>
					</h2>

					{#if topUsers.length === 0}
						<EmptyState
							title="No achievers yet"
							class="py-8 border-none bg-transparent"
						>
							{#snippet icon()}
								<Icon icon="lucide:trophy" class="h-6 w-6 text-amber-500" />
							{/snippet}
						</EmptyState>
					{:else}
						<div class="space-y-1.5">
							{#each topUsers as user, idx (user.id)}
								<a
									href="/@{user.handle || user.id}"
									class="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-all duration-150 group"
								>
									<div class="flex items-center gap-3 min-w-0">
										<!-- Rank badge -->
										<div
											class="w-5 text-center font-mono font-bold text-xs {idx === 0
												? 'text-amber-500'
												: idx === 1
													? 'text-zinc-400'
													: idx === 2
														? 'text-amber-700'
														: 'text-zinc-500'}"
										>
											#{idx + 1}
										</div>

										<Avatar
											src={user.avatar}
											alt={user.nickname}
											size="sm"
										/>

										<div class="min-w-0">
											<div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline truncate">
												{user.nickname}
											</div>
											<div class="text-[10px] text-zinc-400 truncate font-mono">
												@{user.handle}
											</div>
										</div>
									</div>

									<div class="flex items-center gap-1 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
										<span>{user.completedCount} completed</span>
									</div>
								</a>
							{/each}
						</div>
					{/if}
			</div>
		</div>
	{/if}
</div>
