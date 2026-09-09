<script lang="ts">
	import { onMount } from 'svelte';
	import { statsStore } from '$lib/stores/stats.svelte';
	import { getCategoryConfig } from '$lib/constants/categories';
	import BackToSquare from '$lib/components/ui/BackToSquare.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import CategoryBadge from '$lib/components/todo/CategoryBadge.svelte';
	import StatsSkeleton from '$lib/components/skeleton/StatsSkeleton.svelte';
	import ActivityHeatmap from '$lib/components/stats/ActivityHeatmap.svelte';
	import CategoryDonutChart from '$lib/components/stats/CategoryDonutChart.svelte';

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
	<title>全站数据看板 - Public Todo</title>
</svelte:head>

<div class="w-full space-y-6 sm:space-y-8">
	<!-- 顶部返回 -->
	<BackToSquare />

	<!-- 页面头部看板 Banner -->
	<div
		class="relative overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md shadow-xs space-y-4"
	>
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div class="space-y-1.5">
				<div class="flex items-center gap-2.5">
					<span class="text-2xl sm:text-3xl">📊</span>
					<h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
						全站数据看板
					</h1>
				</div>
				<p class="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
					全网公开待办实时生态 · 见证每一个小目标的达成与坚持
				</p>
			</div>

			<div class="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
				<button
					type="button"
					onclick={refresh}
					disabled={statsStore.loading}
					class="px-3.5 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
					title="重新拉取最新数据"
				>
					<span class="{statsStore.loading ? 'animate-spin' : ''}">↻</span>
					<span>刷新数据</span>
				</button>
			</div>
		</div>
	</div>

	<!-- 主体内容区 -->
	{#if !statsStore.loaded && statsStore.loading}
		<StatsSkeleton />
	{:else if statsStore.stats}
		{@const overview = statsStore.stats.overview}
		{@const categories = statsStore.stats.categories}
		{@const trend = statsStore.stats.trend}
		{@const heatmap = statsStore.stats.heatmap}
		{@const topTopics = statsStore.stats.topTopics}
		{@const topUsers = statsStore.stats.topUsers}

		<!-- 1. 核心大指标卡片群 -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
			<!-- 累计待办 -->
			<div
				class="p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xs space-y-1"
			>
				<div class="flex items-center justify-between text-xs text-zinc-400 font-medium">
					<span>累计公开待办</span>
					<span class="text-sm">📝</span>
				</div>
				<div class="text-2xl sm:text-3xl font-black font-mono text-zinc-900 dark:text-zinc-100">
					{overview.totalTodos.toLocaleString()}
				</div>
				<div class="text-[11px] text-zinc-400">
					今日新增 <strong class="text-zinc-700 dark:text-zinc-300 font-semibold">{overview.todayCreated}</strong> 条
				</div>
			</div>

			<!-- 达成目标 -->
			<div
				class="p-4 sm:p-5 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 backdrop-blur-xs space-y-1"
			>
				<div class="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
					<span>达成目标总数</span>
					<span class="text-sm">✅</span>
				</div>
				<div class="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
					{overview.completedTodos.toLocaleString()}
				</div>
				<div class="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
					今日达成 <strong class="font-bold">{overview.todayCompleted}</strong> 项目标
				</div>
			</div>

			<!-- 整体完成率 -->
			<div
				class="p-4 sm:p-5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 backdrop-blur-xs space-y-1"
			>
				<div class="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
					<span>全网执行达成率</span>
					<span class="text-sm">⚡</span>
				</div>
				<div class="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
					{overview.completionRate}%
				</div>
				<div class="text-[11px] text-amber-600/80 dark:text-amber-400/80">
					正在进行中 {overview.inProgressTodos} 条
				</div>
			</div>

			<!-- 公开参与者 -->
			<div
				class="p-4 sm:p-5 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 backdrop-blur-xs space-y-1"
			>
				<div class="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-medium">
					<span>同行探索者</span>
					<span class="text-sm">👥</span>
				</div>
				<div class="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
					{overview.totalUsers.toLocaleString()}
				</div>
				<div class="text-[11px] text-blue-600/80 dark:text-blue-400/80">
					今日活跃同行 <strong class="font-bold">{overview.todayActiveUsers}</strong> 人
				</div>
			</div>
		</div>

		<!-- 2. 全站打卡贡献热力图 (GitHub 风格，最近一年 365 天) -->
		<div
			class="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-5 sm:p-7 backdrop-blur-md shadow-xs space-y-4"
		>
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
				<div class="space-y-0.5">
					<h2 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
						<span>🟩</span>
						<span>全站行动热力心跳 (Activity Heatmap)</span>
					</h2>
					<p class="text-xs text-zinc-400">
						记录全网每一天的目标发布、进展打卡与冲线达成
					</p>
				</div>
				<div class="flex items-center gap-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
					<span>累计行动 <strong class="text-zinc-900 dark:text-zinc-100">{heatmap.totalActivities}</strong> 次</span>
					<span>·</span>
					<span>单日峰值 <strong class="text-emerald-600 dark:text-emerald-400">{heatmap.maxDayCount}</strong> 次</span>
				</div>
			</div>

			<ActivityHeatmap days={heatmap.days} />
		</div>

		<!-- 3. 近 14 天待办与达成趋势对比 (Activity Trend) -->
		<div
			class="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-5 sm:p-7 backdrop-blur-md shadow-xs space-y-4"
		>
			<div class="flex items-center justify-between">
				<div class="space-y-0.5">
					<h2 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
						<span>📈</span>
						<span>近 14 天行动节奏走势 (14-Day Trend)</span>
					</h2>
					<p class="text-xs text-zinc-400">对比每日公开待办的创建与达成节奏</p>
				</div>
				<div class="flex items-center gap-3 text-xs">
					<div class="flex items-center gap-1.5">
						<span class="h-2 w-2 rounded-full bg-zinc-400"></span>
						<span class="text-zinc-500 dark:text-zinc-400">新建</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
						<span class="text-zinc-500 dark:text-zinc-400">达成</span>
					</div>
				</div>
			</div>

			<!-- 趋势图表区 (原生 SVG 柱状图对比) -->
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
								<!-- 新建条 -->
								<div
									class="w-1.5 sm:w-2 rounded-t-xs bg-zinc-300 dark:bg-zinc-700 group-hover:bg-zinc-400 transition-all"
									style="height: {createdH}%;"
								></div>
								<!-- 达成条 -->
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

				<!-- 悬浮数据浮层 -->
				{#if hoveredTrendIndex !== null}
					{@const hItem = trend[hoveredTrendIndex]}
					<div
						class="absolute top-0 right-4 px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 text-xs shadow-md backdrop-blur-xs flex items-center gap-3 animate-in fade-in duration-100 font-mono"
					>
						<span class="font-bold text-zinc-900 dark:text-zinc-100">{hItem.date}</span>
						<span class="text-zinc-500">新建: <strong class="text-zinc-900 dark:text-zinc-100">{hItem.created}</strong></span>
						<span class="text-emerald-600 dark:text-emerald-400">达成: <strong class="font-bold">{hItem.completed}</strong></span>
					</div>
				{/if}
			</div>
		</div>

		<!-- 4. 领域分类全景 (独立全幅大卡片) -->
		<div
			class="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-5 sm:p-7 backdrop-blur-md shadow-xs space-y-4"
		>
			<div class="space-y-0.5">
				<h2 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
					<span>🎯</span>
					<span>领域分类全景 (Category Insights)</span>
				</h2>
				<p class="text-xs text-zinc-400">各类别待办总数、占比及目标完成率</p>
			</div>

			<CategoryDonutChart {categories} totalTodos={overview.totalTodos} />
		</div>

		<!-- 5. 社区风云双榜 (热门多人协同 Top 5 与 达成先锋榜 Top 5 左右对称并排) -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
			<!-- 热门多人协同 Top 5 -->
			<div
				class="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-5 sm:p-7 backdrop-blur-md shadow-xs space-y-4"
			>
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<h2 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
								<span>🔥</span>
								<span>最具号召力多人协同</span>
							</h2>
							<p class="text-xs text-zinc-400">同行人数最多的共同挑战目标</p>
						</div>
						<a
							href="/topics"
							class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
						>
							进入广场 →
						</a>
					</div>

					<div class="space-y-2.5">
						{#each topTopics as topic (topic.topicHash)}
							<a
								href="/topics/{topic.topicHash}"
								class="flex items-center justify-between p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-all group"
							>
								<div class="flex items-center gap-2.5 min-w-0 flex-1">
									<CategoryBadge category={topic.category} mode="dot" />
									<span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline truncate">
										{topic.content}
									</span>
								</div>

								<div class="flex items-center gap-3 shrink-0 text-xs font-mono">
									<span class="text-zinc-500 dark:text-zinc-400">
										<strong class="text-zinc-900 dark:text-zinc-100">{topic.totalParticipants}</strong> 人同行
									</span>
									<span class="text-emerald-600 dark:text-emerald-400">
										{topic.doneCount} 达成
									</span>
								</div>
							</a>
						{/each}
					</div>
				</div>

				<!-- 达成先锋达人榜 Top 5 -->
				<div
					class="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-5 sm:p-7 backdrop-blur-md shadow-xs space-y-4"
				>
					<div class="space-y-0.5">
						<h2 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
							<span>🏆</span>
							<span>目标达成先锋榜</span>
						</h2>
						<p class="text-xs text-zinc-400">全平台累计达成完成待办最多的活跃伙伴</p>
					</div>

					<div class="space-y-2.5">
						{#each topUsers as user, idx (user.id)}
							<a
								href="/users/{user.id}"
								class="flex items-center justify-between p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-all group"
							>
								<div class="flex items-center gap-3 min-w-0">
									<!-- 排名徽章 -->
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
									<span>{user.completedCount} 项达成</span>
								</div>
							</a>
						{/each}
					</div>
			</div>
		</div>
	{/if}
</div>
