<script lang="ts">
	import { onMount } from 'svelte';
	import { statsStore } from '$lib/stores/stats.svelte';
	import ActivityHeatmap from '$lib/components/stats/ActivityHeatmap.svelte';
	import WidgetSkeleton from '$lib/components/skeleton/WidgetSkeleton.svelte';
	import DataView from '$lib/components/ui/DataView.svelte';

	onMount(() => {
		statsStore.load();
	});
</script>

<div
	class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white/60 dark:bg-zinc-950/60 p-4 backdrop-blur-xs space-y-3.5"
>
	<!-- 顶部标题栏 -->
	<div class="flex items-center justify-between">
		<a
			href="/stats"
			class="flex items-center gap-1.5 font-semibold text-xs text-zinc-900 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group/title"
			title="进入全站数据大屏"
		>
			<span>📊 全站数据脉搏</span>
		</a>

		<div class="flex items-center gap-1.5">
			<a
				href="/stats"
				class="inline-flex items-center gap-0.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors group/link cursor-pointer"
				title="前往全站统计看板查看全部深度数据"
			>
				<span>深度看板</span>
				<span class="transition-transform group-hover/link:translate-x-0.5">→</span>
			</a>
		</div>
	</div>

	<!-- 标准 DataView 内容区：彻底避免时序竞争与未加载闪现暂无数据 -->
	<DataView
		loading={!statsStore.loaded || statsStore.loading}
		empty={!statsStore.stats}
	>
		{#snippet skeleton()}
			<WidgetSkeleton rows={3} />
		{/snippet}

		{#snippet emptyView()}
			<div class="py-3 text-center text-xs text-zinc-400">
				暂无全站统计数据
			</div>
		{/snippet}

		{#if statsStore.stats}
			{@const overview = statsStore.stats.overview}

			<!-- 4 宫格核心概览 -->
			<div class="grid grid-cols-2 gap-2">
				<div class="p-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/40 dark:border-zinc-800/40">
					<div class="text-[11px] text-zinc-400 font-medium">累计公开待办</div>
					<div class="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
						{(overview?.totalTodos ?? 0).toLocaleString()}
					</div>
				</div>

				<div class="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-800/30">
					<div class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">已完成</div>
					<div class="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
						{(overview?.completedTodos ?? 0).toLocaleString()}
					</div>
				</div>

				<div class="p-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/40 dark:border-zinc-800/40">
					<div class="text-[11px] text-zinc-400 font-medium">全站完成率</div>
					<div class="text-base font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
						{overview?.completionRate ?? 0}%
					</div>
				</div>

				<div class="p-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/40 dark:border-zinc-800/40">
					<div class="text-[11px] text-zinc-400 font-medium">今日活跃同行</div>
					<div class="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
						{overview?.todayActiveUsers ?? 0} 人
					</div>
				</div>
			</div>

			<!-- 社区整年行动足迹点阵 (支持横向平滑滚动查看，默认聚焦今天) -->
			{#if statsStore.stats.heatmap?.days && statsStore.stats.heatmap.days.length > 0}
				<div class="pt-1 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-1.5">
					<div class="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
						<span class="flex items-center gap-1">
							<span>社区近 1 年行动足迹</span>
							<span class="text-[9px] text-zinc-400/80 font-normal">（左右滑动查看）</span>
						</span>
						<span class="font-mono">{statsStore.stats.heatmap.totalActivities ?? 0} 次足迹</span>
					</div>
					<ActivityHeatmap days={statsStore.stats.heatmap.days} compact={true} />
				</div>
			{/if}

			<!-- 底部提示徽标与直达链接 -->
			<div class="pt-1 flex items-center justify-between text-[11px] text-zinc-400">
				<span>已产生 {overview?.totalReactions ?? 0} 次点赞鼓励 ✨</span>
				<a
					href="/stats"
					class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
				>
					<span>探索数据大屏</span>
					<span>↗</span>
				</a>
			</div>
		{/if}
	</DataView>
</div>
