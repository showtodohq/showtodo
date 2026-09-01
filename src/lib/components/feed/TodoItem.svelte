<script lang="ts">
	import type { Todo, ReactionEmoji } from '$lib/types/todo';
	import { getCategoryConfig } from '$lib/constants/categories';
	import { REACTIONS } from '$lib/constants/reactions';
	import { formatRelativeTime, formatScheduleRange } from '$lib/utils/format';
	import Avatar from '$lib/components/ui/Avatar.svelte';

	interface Props {
		todo: Todo;
		isMine?: boolean;
		ontoggle?: (todo: Todo, e?: MouseEvent) => void;
		onreaction?: (todo: Todo, emoji: ReactionEmoji) => void;
	}

	let { todo, isMine = false, ontoggle, onreaction }: Props = $props();

	const catConfig = $derived(getCategoryConfig(todo.category));
	const scheduleText = $derived(formatScheduleRange(todo.startDate, todo.dueDate));
	const relativeTime = $derived(formatRelativeTime(todo.createdAt));
	const isDone = $derived(todo.status === 'done');

	// 计算已存在的 Reaction 列表
	const activeReactions = $derived.by(() => {
		if (!todo.reactions) return [];
		return Object.entries(todo.reactions)
			.filter(([_, count]) => count > 0)
			.map(([emoji, count]) => ({ emoji: emoji as ReactionEmoji, count }));
	});

	let isEmojiPopOpen = $state(false);
	let popCloseTimeout: ReturnType<typeof setTimeout> | null = null;

	function handleMouseEnterEmoji() {
		if (popCloseTimeout) {
			clearTimeout(popCloseTimeout);
			popCloseTimeout = null;
		}
		isEmojiPopOpen = true;
	}

	function handleMouseLeaveEmoji() {
		popCloseTimeout = setTimeout(() => {
			isEmojiPopOpen = false;
		}, 250);
	}

	function handleSelectEmoji(emoji: ReactionEmoji) {
		isEmojiPopOpen = false;
		onreaction?.(todo, emoji);
	}
</script>

<div
	class="group/item relative flex items-start gap-3 sm:gap-3.5 py-3 px-3 sm:px-3.5 rounded-2xl transition-all duration-150 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60"
>
	<!-- 左侧：作者头像锚点与悬停 Tooltip -->
	<div class="relative group/avatar shrink-0 pt-0.5">
		<Avatar
			src={todo.author?.avatar}
			name={todo.author?.nickname || '匿名'}
			size="sm"
			class="h-8 w-8 ring-1 ring-zinc-200/80 dark:ring-zinc-800 transition-transform duration-150 group-hover/avatar:scale-105"
		/>

		<!-- 头像悬停浮动气泡 Tooltip -->
		<div
			class="pointer-events-none absolute bottom-full left-0 mb-1.5 hidden group-hover/avatar:flex flex-col items-start z-30 animate-in fade-in zoom-in-95 duration-100"
		>
			<div
				class="rounded-md bg-zinc-900 px-2 py-1 text-[11px] text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900 whitespace-nowrap"
			>
				<span class="font-semibold">{todo.author?.nickname || '匿名用户'}</span>
				{#if todo.author?.handle}
					<span class="opacity-60 text-[10px] ml-1 font-mono">@{todo.author.handle}</span>
				{/if}
				{#if isMine}
					<span class="ml-1 text-[10px] text-amber-300 dark:text-amber-600 font-semibold">(我)</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- 中间主体：3~4 行层次化流排版 -->
	<div class="flex-1 min-w-0 space-y-1">
		<!-- 第一行：排期时间 (如有) 与作者信息 -->
		<div class="flex items-center justify-between gap-2">
			<div class="flex items-center gap-1.5 min-w-0">
				<span class="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
					{todo.author?.nickname || '匿名'}
				</span>
				{#if todo.author?.handle}
					<span class="text-[11px] text-zinc-400 font-mono hidden sm:inline truncate">
						@{todo.author.handle}
					</span>
				{/if}

				{#if scheduleText}
					<span class="text-zinc-300 dark:text-zinc-700 text-xs">·</span>
					<div
						class="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded"
						title="排期: {scheduleText}"
					>
						<svg class="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<span>{scheduleText}</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- 第二行：正文内容 -->
		<div class="pt-0.5">
			<p
				class="text-sm font-medium leading-relaxed break-words {isDone
					? 'line-through decoration-zinc-400 dark:decoration-zinc-500 text-zinc-400 dark:text-zinc-500'
					: 'text-zinc-900 dark:text-zinc-100'}"
			>
				{todo.content}
			</p>
		</div>

		<!-- 第三行：手账式详细备注 (仅在有公开备注时展示) -->
		{#if todo.note && todo.isNotePublic}
			<div
				class="rounded-xl bg-zinc-100/70 dark:bg-zinc-900/60 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed break-words border border-zinc-200/40 dark:border-zinc-800/50 mt-1"
			>
				<p class="whitespace-pre-wrap">{todo.note}</p>
			</div>
		{/if}

		<!-- 第四行：元信息栏 (分类标签 + 相对发布时间 + 悬停 Emoji Pop 表态) -->
		<div class="flex items-center flex-wrap gap-2 pt-1 text-xs text-zinc-400 select-none">
			<!-- 分类胶囊/圆点 -->
			{#if catConfig}
				<div class="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100/80 dark:bg-zinc-800/70 px-2 py-0.5 rounded-full">
					<span class="h-1.5 w-1.5 rounded-full" style="background-color: {catConfig.color};"></span>
					<span>{catConfig.name}</span>
				</div>
			{/if}

			<!-- 发布相对时间 -->
			<span class="text-[11px] text-zinc-400 font-mono">{relativeTime}</span>

			<span>·</span>

			<!-- 悬停 Emoji Pop 表态互动组件 (整组区域触发与正上方居中锚定) -->
			<div
				class="relative inline-flex items-center gap-1.5"
				onmouseenter={handleMouseEnterEmoji}
				onmouseleave={handleMouseLeaveEmoji}
				role="group"
				aria-label="Reaction picker"
			>
				<!-- 1. 若已有表态：响应式展示 Emoji 徽标列表 (移动端最多 1 个，桌面端最多 3 个，超出显示 +m) -->
				{#if activeReactions.length > 0}
					{#each activeReactions as r, idx}
						<button
							type="button"
							onclick={() => handleSelectEmoji(r.emoji)}
							class="items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-mono bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer {idx === 0 ? 'inline-flex' : idx < 3 ? 'hidden sm:inline-flex' : 'hidden'}"
							title="点击表态 {r.emoji}"
						>
							<span>{r.emoji}</span>
							<span class="text-[10px] font-semibold">{r.count}</span>
						</button>
					{/each}

					<!-- 移动端多余徽标 +m 提示 (超出 1 个时展示) -->
					{#if activeReactions.length > 1}
						<span
							class="sm:hidden inline-flex items-center px-1 py-0.5 rounded text-[10px] font-mono font-medium text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800/80 cursor-default"
							title="还有 {activeReactions.length - 1} 种表情表态"
						>
							+{activeReactions.length - 1}
						</span>
					{/if}

					<!-- 桌面端多余徽标 +m 提示 (超出 3 个时展示) -->
					{#if activeReactions.length > 3}
						<span
							class="hidden sm:inline-flex items-center px-1 py-0.5 rounded text-[10px] font-mono font-medium text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800/80 cursor-default"
							title="还有 {activeReactions.length - 3} 种表情表态"
						>
							+{activeReactions.length - 3}
						</span>
					{/if}
				{:else}
					<!-- 2. 若无反应：展示默认代表 Emoji (❤️)，点击直接点赞爱心，悬停可呼出完整 8 格选择器 -->
					<button
						type="button"
						onclick={() => handleSelectEmoji('❤️')}
						class="inline-flex items-center justify-center h-5 w-5 rounded-full text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-zinc-800 active:scale-90 transition-all cursor-pointer select-none"
						title="点赞爱心 (悬停可选择更多表情)"
						aria-label="Add heart reaction"
					>
						<span class="text-xs leading-none">❤️</span>
					</button>
				{/if}

				<!-- 悬浮弹出的完整 Emoji POP 浮层 (2 行 4 列网格，正上方居中，带具体数值显示) -->
				{#if isEmojiPopOpen}
					<div
						class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-44 p-1.5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200/90 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150 select-none"
					>
						<div class="grid grid-cols-4 gap-1 place-items-center">
							{#each REACTIONS as item}
								{@const count = todo.reactions?.[item.emoji] || 0}
								<button
									type="button"
									onclick={() => handleSelectEmoji(item.emoji)}
									class="flex flex-col items-center justify-center h-10 w-9 rounded-xl hover:scale-110 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all duration-100 cursor-pointer"
									title="{item.label}: {item.description} ({count} 票)"
								>
									<span class="text-base leading-tight">{item.emoji}</span>
									<span
										class="text-[10px] font-mono leading-none mt-0.5 {count > 0
											? 'text-zinc-700 dark:text-zinc-200 font-semibold'
											: 'text-zinc-300 dark:text-zinc-600 font-normal'}"
									>
										{count}
									</span>
								</button>
							{/each}
						</div>
						<!-- 底部居中小箭头 -->
						<div
							class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-white dark:bg-zinc-900 border-r border-b border-zinc-200/90 dark:border-zinc-800"
						></div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- 右侧：果冻打勾复选框 (本人) 或 只读状态徽标 (他人) - 垂直居中对齐 -->
	<div class="shrink-0 self-center pl-1 sm:pl-2">
		{#if isMine}
			<!-- 当前用户本人待办：果冻弹性打勾框 -->
			<button
				type="button"
				onclick={(e) => ontoggle?.(todo, e)}
				class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-150 active:scale-85 cursor-pointer {isDone
					? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
					: 'border-zinc-600 dark:border-zinc-300 hover:scale-110 hover:border-zinc-900 dark:hover:border-white hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
				aria-label={isDone ? '标记为未完成' : '标记为已完成'}
				title={isDone ? '点击标记为未完成' : '点击完成待办（我发布的）'}
			>
				{#if isDone}
					<svg class="h-3 w-3 stroke-[3] animate-in zoom-in-50 duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				{/if}
			</button>
		{:else if isDone}
			<!-- 他人待办：已完成状态 (只读浅灰底+深灰勾) -->
			<div
				class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-600 bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-default select-none shadow-2xs"
				title="已完成（他人待办）"
			>
				<svg class="h-2.5 w-2.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			</div>
		{:else}
			<!-- 他人待办：未完成状态 (只读细虚线环) -->
			<div
				class="h-5 w-5 shrink-0 rounded-full border border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50/80 dark:bg-zinc-800/40 cursor-default select-none"
				title="待办中（他人发布）"
			></div>
		{/if}
	</div>
</div>
