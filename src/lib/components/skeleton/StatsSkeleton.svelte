<script lang="ts">
</script>

<div class="space-y-6 sm:space-y-8 animate-pulse" aria-busy="true">
	<!-- 顶部大卡片骨架 -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
		{#each Array(4) as _, i (i)}
			<div class="p-4 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40 space-y-3">
				<div class="h-3 w-16 bg-zinc-200/80 dark:bg-zinc-800/80 rounded"></div>
				<div class="h-7 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
				<div class="h-2.5 w-32 bg-zinc-200/60 dark:bg-zinc-800/60 rounded"></div>
			</div>
		{/each}
	</div>

	<!-- 中间热力图与趋势图骨架 -->
	<div class="p-5 sm:p-6 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40 space-y-4">
		<div class="h-4 w-36 bg-zinc-200/80 dark:bg-zinc-800/80 rounded"></div>
		<div class="h-36 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-xl"></div>
	</div>

	<!-- 底部双栏骨架 -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<div class="p-5 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40 space-y-4">
			<div class="h-4 w-28 bg-zinc-200/80 dark:bg-zinc-800/80 rounded"></div>
			<div class="space-y-3">
				{#each Array(4) as _, j (j)}
					<div class="h-10 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-lg"></div>
				{/each}
			</div>
		</div>

		<div class="p-5 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40 space-y-4">
			<div class="h-4 w-28 bg-zinc-200/80 dark:bg-zinc-800/80 rounded"></div>
			<div class="space-y-3">
				{#each Array(4) as _, k (k)}
					<div class="h-10 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-lg"></div>
				{/each}
			</div>
		</div>
	</div>
</div>
