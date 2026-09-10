<div class="space-y-6 sm:space-y-8 animate-pulse" aria-busy="true" aria-label="正在加载多人同行详情">
	<!-- 顶部返回导航占位 -->
	<div class="flex items-center justify-between">
		<div class="h-4 w-20 bg-zinc-200/70 dark:bg-zinc-800/70 rounded-md"></div>
	</div>

	<!-- 头部多人同行大卡片骨架 -->
	<div
		class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white/80 dark:bg-zinc-900/60 p-5 sm:p-7 backdrop-blur-xs space-y-4"
	>
		<div class="flex items-center justify-between">
			<div class="h-5 w-20 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70"></div>
			<div class="h-4 w-24 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md"></div>
		</div>

		<!-- 话题大标题 -->
		<div class="space-y-2 py-1">
			<div class="h-6 w-3/4 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-md"></div>
			<div class="h-4 w-1/3 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md"></div>
		</div>

		<!-- 进度条占位 -->
		<div class="space-y-2 pt-2">
			<div class="h-2 w-full rounded-full bg-zinc-200/70 dark:bg-zinc-800/70"></div>
			<div class="flex justify-between">
				<div class="h-3 w-16 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md"></div>
				<div class="h-3 w-12 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md"></div>
			</div>
		</div>
	</div>

	<!-- 下方同行伙伴列表骨架 (与 TopicParticipantList 1:1 对齐) -->
	<div class="space-y-4">
		<div class="flex items-center justify-between px-1">
			<div class="h-3.5 w-24 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-md"></div>
		</div>

		<div class="space-y-1 sm:space-y-1.5">
			{#each Array(3) as _, i (i)}
				<div class="py-3 px-3 sm:px-3.5 rounded-2xl flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 shrink-0"></div>
						<div class="space-y-1.5">
							<div class="h-3.5 w-24 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-md"></div>
							<div class="h-2.5 w-32 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md"></div>
						</div>
					</div>
					<div class="w-6 h-6 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70"></div>
				</div>
			{/each}
		</div>
	</div>
</div>
