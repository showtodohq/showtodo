<script lang="ts">
	import type { ReactionEmoji, ReactionDetail } from '$lib/types/todo';
	import { REACTIONS } from '$lib/constants/reactions';
	import { api } from '$lib/services/api';
	import ReactionButton from '$lib/components/todo/ReactionButton.svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		todoId: string;
		reactions?: Record<string, number>;
		myReactions?: (ReactionEmoji | string)[];
		isMine?: boolean;
		onreact?: (emoji?: ReactionEmoji) => void;
		onedit?: () => void;
		class?: string;
	}

	let {
		todoId,
		reactions = {},
		myReactions = [],
		isMine = false,
		onreact,
		onedit,
		class: className = ''
	}: Props = $props();

	let bouncingEmoji = $state<string | null>(null);

	// 详细表态用户名单（按需懒加载与缓存）
	let reactionDetails = $state<ReactionDetail[] | null>(null);
	let isLoadingDetails = $state(false);
	let hoveredEmoji = $state<string | null>(null);

	// 计算当前已有票数（> 0）的表情项
	const activeReactions = $derived(
		REACTIONS.map((item) => ({
			...item,
			count: reactions?.[item.emoji] || 0,
			isMyReaction: myReactions?.includes(item.emoji) ?? false
		})).filter((item) => item.count > 0)
	);

	// 悬停在某个表情胶囊上时，懒加载用户名单
	async function handlePillMouseEnter(emoji: string) {
		hoveredEmoji = emoji;
		if (reactionDetails !== null || isLoadingDetails || !todoId || todoId.startsWith('temp-')) {
			return;
		}

		isLoadingDetails = true;
		try {
			const res = await api.getReactions(todoId);
			reactionDetails = res.reactions;
		} catch {
			// 静默忽略网络异常
		} finally {
			isLoadingDetails = false;
		}
	}

	function handlePillMouseLeave() {
		hoveredEmoji = null;
	}

	function getHoveredUsersText(emoji: string): string | null {
		if (!reactionDetails) return null;
		const group = reactionDetails.find((r) => r.emoji === emoji);
		if (!group || !group.users || group.users.length === 0) return null;

		const names = group.users.slice(0, 3).map((u) => u.nickname || 'User');
		if (group.users.length > 3) {
			return `${names.join(', ')} and ${group.count - names.length} others`;
		}
		return `${names.join(', ')} (${group.count})`;
	}

	function triggerReact(emoji?: ReactionEmoji) {
		if (emoji) {
			bouncingEmoji = emoji;
			setTimeout(() => {
				if (bouncingEmoji === emoji) {
					bouncingEmoji = null;
				}
			}, 400);
		}
		onreact?.(emoji);
	}
</script>

<div class="flex items-center justify-between flex-wrap gap-3 {className}">
	<!-- Active Reactions Area -->
	<div class="flex items-center flex-wrap gap-1.5 min-w-0">
		{#if activeReactions.length > 0}
			{#each activeReactions as item (item.emoji)}
				{@const userTooltip = getHoveredUsersText(item.emoji)}
				<div class="relative inline-flex">
					<button
						type="button"
						onclick={() => triggerReact(item.emoji)}
						onmouseenter={() => handlePillMouseEnter(item.emoji)}
						onmouseleave={handlePillMouseLeave}
						class="group/pill inline-flex items-center gap-1.5 px-3 py-1 min-h-[32px] rounded-full text-xs sm:text-sm font-mono transition-all duration-150 cursor-pointer select-none active:scale-90 {item.isMyReaction
							? 'bg-rose-50/90 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300/90 dark:border-rose-700/80 font-semibold shadow-2xs ring-1 ring-rose-400/20'
							: 'bg-zinc-100/90 hover:bg-zinc-200/80 dark:bg-zinc-800/70 dark:hover:bg-zinc-700/70 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60'}"
						title="{item.label}: {item.description} ({item.count} votes){item.isMyReaction ? ' · Reacted (click to undo)' : ' · Click to react'}"
						aria-label="{item.label} reaction"
					>
						<span
							class="text-sm sm:text-base leading-none transition-transform duration-150 {bouncingEmoji === item.emoji
								? 'scale-125 animate-heart-bounce'
								: 'group-hover/pill:scale-110'}"
						>
							{item.emoji}
						</span>
						<span class="text-xs leading-none {item.isMyReaction ? 'font-bold text-rose-600 dark:text-rose-400' : 'font-medium'}">
							{item.count}
						</span>
					</button>

					<!-- Reaction user list popup -->
					{#if hoveredEmoji === item.emoji && userTooltip}
						<div
							class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-40 px-2.5 py-1 rounded-lg bg-zinc-900/95 dark:bg-zinc-100/95 text-zinc-100 dark:text-zinc-900 text-[11px] shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-100"
						>
							<span>{userTooltip}</span>
							<div
								class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-zinc-900/95 dark:bg-zinc-100/95"
							></div>
						</div>
					{/if}
				</div>
			{/each}
		{:else}
			<div class="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 py-1 select-none">
				<Icon icon="lucide:sparkles" class="h-3.5 w-3.5 text-zinc-400" />
				<span>Be the first to cheer!</span>
			</div>
		{/if}
	</div>

	<!-- Actions Area -->
	<div class="flex items-center gap-2 shrink-0">
		<ReactionButton
			{reactions}
			{myReactions}
			size="md"
			onreact={onreact}
		/>

		{#if isMine && onedit}
			<button
				type="button"
				onclick={onedit}
				class="inline-flex items-center justify-center h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all duration-150 cursor-pointer select-none active:scale-90"
				title="Edit todo content"
				aria-label="Edit todo content"
			>
				<svg
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1.8"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
					/>
				</svg>
			</button>
		{/if}
	</div>
</div>

<style>
	@keyframes heart-elastic {
		0% {
			transform: scale(1);
		}
		25% {
			transform: scale(0.75);
		}
		50% {
			transform: scale(1.35);
		}
		75% {
			transform: scale(0.95);
		}
		100% {
			transform: scale(1);
		}
	}

	:global(.animate-heart-bounce) {
		animation: heart-elastic 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}
</style>
