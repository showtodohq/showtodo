<div class="space-y-6 sm:space-y-8 animate-pulse" aria-busy="true" aria-label="正在加载待办详情">
	<!-- 顶部返回导航占位 -->
	<div class="flex items-center justify-between">
		<div class="h-4 w-20 bg-zinc-200/70 dark:bg-zinc-800/70 rounded-md"></div>
	</div>

	<!-- 待办主卡片骨架 -->
	<div
		class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white/80 dark:bg-zinc-900/60 p-5 sm:p-7 backdrop-blur-xs space-y-5 sm:space-y-6"
	>
		<!-- 卡片头部：作者大头像 + 昵称 + 操作位 -->
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 shrink-0"></div>
				<div class="space-y-1.5">
					<div class="h-4 w-28 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-md"></div>
					<div class="h-3 w-36 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md"></div>
				</div>
			</div>
			<div class="h-6 w-16 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70"></div>
		</div>

		<!-- 待办核心内容行：大号复选框 + 标题 -->
		<div class="flex items-start gap-3.5 py-1">
			<div class="w-5.5 h-5.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80 shrink-0 mt-0.5"></div>
			<div class="flex-1 space-y-2.5">
				<div class="h-5.5 w-4/5 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-md"></div>
				<div class="h-4 w-1/2 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md"></div>
			</div>
		</div>

		<!-- 专属详细笔记占位 -->
		<div class="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800/70 p-4 space-y-2">
			<div class="h-3.5 w-full bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md"></div>
			<div class="h-3.5 w-3/4 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-md"></div>
		</div>

		<!-- 底部表态与分享工具条骨架 -->
		<div class="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
			<div class="flex items-center gap-2">
				<div class="h-7 w-12 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70"></div>
				<div class="h-7 w-12 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70"></div>
				<div class="h-7 w-12 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70"></div>
			</div>
			<div class="h-7 w-20 rounded-lg bg-zinc-200/60 dark:bg-zinc-800/60"></div>
		</div>
	</div>

	<!-- 下方打卡记录与时间线卡片骨架 -->
	<div
		class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white/60 dark:bg-zinc-950/60 p-5 backdrop-blur-xs space-y-4"
	>
		<div class="h-4 w-28 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-md"></div>
		<div class="space-y-3 pl-2">
			<div class="flex items-center gap-3">
				<div class="w-2.5 h-2.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80"></div>
				<div class="h-3 w-48 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md"></div>
			</div>
			<div class="flex items-center gap-3">
				<div class="w-2.5 h-2.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80"></div>
				<div class="h-3 w-64 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md"></div>
			</div>
		</div>
	</div>
</div>
