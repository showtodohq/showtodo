<script lang="ts">
	interface Props {
		count?: number;
	}

	let { count = 4 }: Props = $props();
</script>

<div class="space-y-2.5 sm:space-y-3" aria-busy="true" aria-label="Loading topics">
	{#each Array(count) as _, i (i)}
		<div
			class="rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 p-4 sm:p-5 space-y-3 animate-pulse"
		>
			<!-- 头部信息骨架：立项时间、操作按钮 -->
			<div class="flex items-center justify-between">
				<div class="h-3.5 w-24 rounded-md bg-zinc-200/50 dark:bg-zinc-800/50"></div>
				<div class="h-7 w-16 rounded-lg bg-zinc-200/70 dark:bg-zinc-800/70"></div>
			</div>

			<!-- 标题骨架 -->
			<div class="py-0.5">
				<div class="h-5 w-3/4 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80"></div>
			</div>

			<!-- 进度条骨架 -->
			<div class="space-y-1.5">
				<div class="flex items-center justify-between">
					<div class="h-3.5 w-28 rounded-md bg-zinc-200/60 dark:bg-zinc-800/60"></div>
					<div class="h-3.5 w-10 rounded-md bg-zinc-200/60 dark:bg-zinc-800/60"></div>
				</div>
				<div class="h-1.5 w-full rounded-full bg-zinc-200/60 dark:bg-zinc-800/60"></div>
			</div>

			<!-- 底部头像与链接骨架 -->
			<div class="flex items-center justify-between pt-0.5">
				<div class="flex -space-x-1">
					<div class="w-6 h-6 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80"></div>
					<div class="w-6 h-6 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70"></div>
					<div class="w-6 h-6 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60"></div>
				</div>
				<div class="h-3.5 w-14 rounded-md bg-zinc-200/50 dark:bg-zinc-800/50"></div>
			</div>
		</div>
	{/each}
</div>
