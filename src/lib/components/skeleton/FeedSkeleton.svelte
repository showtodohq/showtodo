<script lang="ts">
	interface Props {
		count?: number;
	}

	let { count = 3 }: Props = $props();
</script>

<div class="space-y-1 sm:space-y-1.5" aria-busy="true" aria-label="Loading todos">
	{#each Array(count) as _, i (i)}
		<div
			class="flex items-start gap-3 sm:gap-3.5 py-3 px-3 sm:px-3.5 rounded-2xl animate-pulse"
		>
			<!-- 左侧：作者头像骨架 -->
			<div class="shrink-0 pt-0.5">
				<div class="w-8 h-8 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80"></div>
			</div>

			<!-- 中间主体：层次流骨架 -->
			<div class="flex-1 min-w-0 space-y-1.5 pt-0.5">
				<!-- 第一行：作者名与时间骨架 -->
				<div class="flex items-center gap-2">
					<div class="h-3.5 w-20 bg-zinc-200/80 dark:bg-zinc-800/80 rounded"></div>
					<div class="h-3 w-16 bg-zinc-200/50 dark:bg-zinc-800/50 rounded"></div>
				</div>

				<!-- 第二行：待办正文骨架 (15px 黄金字高) -->
				<div class="h-4.5 w-3/4 bg-zinc-200/70 dark:bg-zinc-800/70 rounded"></div>

				<!-- 第三行：分类徽标与时间小占位 -->
				<div class="flex items-center gap-2 pt-0.5">
					<div class="h-4 w-12 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60"></div>
					<div class="h-3 w-10 bg-zinc-200/40 dark:bg-zinc-800/40 rounded"></div>
					<div class="h-4 w-8 rounded-md bg-zinc-200/50 dark:bg-zinc-800/50"></div>
				</div>
			</div>

			<!-- 右侧：复选框骨架 -->
			<div class="shrink-0 self-center pl-1 sm:pl-2">
				<div class="w-6 h-6 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80"></div>
			</div>
		</div>
	{/each}
</div>
