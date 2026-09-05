<script lang="ts">
	import FeedSkeleton from './FeedSkeleton.svelte';
</script>

<div class="space-y-6 sm:space-y-8 animate-pulse" aria-busy="true" aria-label="正在加载用户主页">
	<!-- 顶部返回导航占位 -->
	<div class="flex items-center justify-between">
		<div class="h-4 w-20 bg-zinc-200/70 dark:bg-zinc-800/70 rounded-md"></div>
	</div>

	<!-- 个人名片大卡片骨架 -->
	<div
		class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white/80 dark:bg-zinc-900/60 p-6 sm:p-7 backdrop-blur-xs"
	>
		<div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
			<div class="w-16 h-16 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 shrink-0"></div>
			<div class="space-y-2 flex-1">
				<div class="h-5 w-32 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-md"></div>
				<div class="h-3.5 w-24 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md"></div>
				<div class="h-3 w-40 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-md"></div>
			</div>
		</div>
	</div>

	<!-- 数据概览四宫格骨架 -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
		{#each Array(4) as _, i (i)}
			<div
				class="rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/30 p-4 space-y-2"
			>
				<div class="h-3 w-12 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md"></div>
				<div class="h-6 w-8 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-md"></div>
			</div>
		{/each}
	</div>

	<!-- 分类与状态筛选 Tab 占位 -->
	<div class="flex items-center gap-2 pt-2 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3">
		{#each Array(4) as _, i (i)}
			<div class="h-7 w-16 rounded-lg bg-zinc-200/70 dark:bg-zinc-800/70"></div>
		{/each}
	</div>

	<!-- 待办列表条目骨架 -->
	<FeedSkeleton count={2} />
</div>
