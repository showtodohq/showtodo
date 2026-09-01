<script lang="ts">
	import type { ReactionEmoji } from '$lib/types/todo';
	import { REACTIONS } from '$lib/constants/reactions';

	interface Props {
		reactions?: Record<string, number>;
		myReactions?: (ReactionEmoji | string)[];
		onreact?: (emoji?: ReactionEmoji) => void;
		class?: string;
	}

	let { reactions = {}, myReactions = [], onreact, class: className = '' }: Props = $props();

	const totalReactionCount = $derived(
		Object.values(reactions || {}).reduce((sum, c) => sum + c, 0)
	);
	const hasMyReaction = $derived((myReactions?.length ?? 0) > 0);

	let isEmojiPopOpen = $state(false);
	let popCloseTimeout: ReturnType<typeof setTimeout> | null = null;

	function handleMouseEnter() {
		if (popCloseTimeout) {
			clearTimeout(popCloseTimeout);
			popCloseTimeout = null;
		}
		isEmojiPopOpen = true;
	}

	function handleMouseLeave() {
		popCloseTimeout = setTimeout(() => {
			isEmojiPopOpen = false;
		}, 250);
	}

	function handleSelectEmoji(emoji?: ReactionEmoji) {
		isEmojiPopOpen = false;
		onreact?.(emoji);
	}
</script>

<div
	class="relative inline-flex items-center {className}"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	role="group"
	aria-label="Reaction picker"
>
	<!-- 主互动按钮：爱心 SVG Icon + 反应总数 (点击触发一键全清或点赞爱心) -->
	<button
		type="button"
		onclick={() => handleSelectEmoji()}
		class="group/heart inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono transition-all cursor-pointer select-none {hasMyReaction
			? 'text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 font-semibold shadow-2xs'
			: 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-transparent'}"
		title={hasMyReaction
			? '已表态 (点击一键取消全部表态，悬停选择更多表情)'
			: '点赞 (悬停选择更多表情)'}
		aria-label="Reaction button"
	>
		{#if hasMyReaction}
			<!-- 已点赞：实心高亮爱心 Icon -->
			<svg
				class="h-3.5 w-3.5 text-rose-500 fill-rose-500 transition-transform active:scale-85 animate-in zoom-in-75 duration-150"
				viewBox="0 0 24 24"
			>
				<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
			</svg>
		{:else}
			<!-- 未点赞：极简描边空心爱心 Icon -->
			<svg
				class="h-3.5 w-3.5 stroke-[1.8] text-zinc-400 group-hover/heart:text-rose-500 group-hover/heart:scale-110 transition-all duration-150"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
			</svg>
		{/if}

		{#if totalReactionCount > 0}
			<span
				class="text-[11px] leading-none {hasMyReaction
					? 'text-rose-600 dark:text-rose-400 font-bold'
					: 'text-zinc-500 dark:text-zinc-400 font-medium'}"
			>
				{totalReactionCount}
			</span>
		{/if}
	</button>

	<!-- 悬浮弹出的完整 Emoji POP 浮层 (2 行 4 列网格，正上方居中，带各 Emoji 具体数值分布) -->
	{#if isEmojiPopOpen}
		<div
			class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-44 p-1.5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200/90 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150 select-none"
		>
			<div class="grid grid-cols-4 gap-1 place-items-center">
				{#each REACTIONS as item}
					{@const count = reactions?.[item.emoji] || 0}
					{@const isMyReaction = myReactions?.includes(item.emoji) ?? false}
					<button
						type="button"
						onclick={() => handleSelectEmoji(item.emoji)}
						class="relative flex flex-col items-center justify-center h-10 w-9 rounded-xl hover:scale-110 active:scale-95 transition-all duration-100 cursor-pointer {isMyReaction
							? 'bg-rose-50/90 dark:bg-rose-950/60 ring-1.5 ring-rose-400 dark:ring-rose-600 shadow-2xs'
							: 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
						title="{item.label}: {item.description} ({count} 票){isMyReaction ? ' - 已表态(点击取消)' : ''}"
					>
						<span class="text-base leading-tight">{item.emoji}</span>
						<span
							class="text-[10px] font-mono leading-none mt-0.5 {isMyReaction
								? 'text-rose-600 dark:text-rose-300 font-bold'
								: count > 0
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
