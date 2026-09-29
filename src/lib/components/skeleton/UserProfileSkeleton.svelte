<script lang="ts">
	import FeedSkeleton from './FeedSkeleton.svelte';
</script>

<div class="space-y-6 sm:space-y-8 animate-pulse" aria-busy="true" aria-label="Loading user profile">
	<!-- 顶部返回导航占位 -->
	<div class="flex items-center justify-between">
		<div class="h-4 w-20 bg-zinc-200/70 dark:bg-zinc-800/70 rounded-md"></div>
	</div>

	<!-- 个人资料概览骨架 (无边框无背景，向设置页看齐) -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div class="flex items-center gap-4">
			<div class="w-12 h-12 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 shrink-0"></div>
			<div class="space-y-2">
				<div class="h-5 w-32 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-md"></div>
				<div class="h-3.5 w-24 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md"></div>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<div class="h-8 w-24 rounded-lg bg-zinc-200/70 dark:bg-zinc-800/70"></div>
			<div class="h-8 w-24 rounded-lg bg-zinc-200/70 dark:bg-zinc-800/70"></div>
		</div>
	</div>

	<!-- 数据概览四宫格骨架 (无边框无背景，上边框微弱分割) -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-t border-zinc-100 dark:border-zinc-800/60 pt-6">
		{#each Array(4) as _, i (i)}
			<div class="space-y-2">
				<div class="h-7 w-12 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-md mx-auto"></div>
				<div class="h-3 w-16 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md mx-auto"></div>
			</div>
		{/each}
	</div>

	<!-- 分类与状态筛选 Tab 占位 -->
	<div class="flex items-center gap-2 pt-2 pb-1">
		{#each Array(4) as _, i (i)}
			<div class="h-7 w-16 rounded-lg bg-zinc-200/70 dark:bg-zinc-800/70"></div>
		{/each}
	</div>

	<!-- 待办列表条目骨架 -->
	<FeedSkeleton count={2} />
</div>
