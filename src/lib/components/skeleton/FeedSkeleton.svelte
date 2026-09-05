<script lang="ts">
	interface Props {
		count?: number;
	}

	let { count = 3 }: Props = $props();
</script>

<div class="space-y-3 sm:space-y-4" aria-busy="true" aria-label="正在加载待办列表">
	{#each Array(count) as _, i (i)}
		<div
			class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/40 p-4 sm:p-5 backdrop-blur-xs space-y-3.5 animate-pulse"
		>
			<!-- 头部信息骨架：作者、时间、分类胶囊 -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 shrink-0"></div>
					<div class="space-y-1.5">
						<div class="h-3.5 w-24 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-md"></div>
						<div class="h-2.5 w-16 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md"></div>
					</div>
				</div>

				<div class="h-5 w-14 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70"></div>
			</div>

			<!-- 中部主体骨架：复选框 + 标题行 -->
			<div class="flex items-start gap-3 pt-0.5">
				<div class="w-4.5 h-4.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80 shrink-0 mt-0.5"></div>
				<div class="flex-1 space-y-2">
					<div class="h-4 w-4/5 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-md"></div>
					<div class="h-3.5 w-2/5 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md"></div>
				</div>
			</div>

			<!-- 底部快捷表态与互动条骨架 -->
			<div class="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
				<div class="flex items-center gap-1.5">
					<div class="h-6 w-10 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60"></div>
					<div class="h-6 w-10 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60"></div>
				</div>
				<div class="h-3 w-12 rounded-md bg-zinc-200/50 dark:bg-zinc-800/50"></div>
			</div>
		</div>
	{/each}
</div>
