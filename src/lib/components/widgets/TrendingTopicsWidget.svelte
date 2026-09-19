<script lang="ts">
	import { onMount } from 'svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { trendingStore, todayStore, todoMutations } from '$lib/stores/todo.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { getTodayString } from '$lib/utils/format';
	import type { DailyCard } from '$lib/types/todo';
	import UserAvatarTooltip from '$lib/components/user/UserAvatarTooltip.svelte';
	import DataView from '$lib/components/ui/DataView.svelte';
	import WidgetSkeleton from '$lib/components/skeleton/WidgetSkeleton.svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		onJoinTopic?: (content: string, category?: string | null) => void;
	}

	let { onJoinTopic }: Props = $props();

	onMount(() => {
		if (!trendingStore.loaded) {
			trendingStore.load();
		}
	});

	function handleJoin(card: DailyCard) {
		if (!userStore.email) {
			toast.info('Please link your email in the top-right menu before joining');
			return;
		}

		if (onJoinTopic) {
			onJoinTopic(card.content, card.category);
		} else {
			todoMutations.joinTopic({
				content: card.content,
				category: card.category
			});
		}
	}
</script>

<div
	class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white/60 dark:bg-zinc-950/60 p-4 backdrop-blur-xs space-y-3"
>
	<!-- Header bar: unified pattern with icon, full title, badge and action link -->
	<div class="flex items-center justify-between">
		<a
			href="/trending"
			class="flex items-center gap-2 font-semibold text-xs text-zinc-900 dark:text-zinc-100 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group/title"
			title="Go to trending todos"
		>
			<div class="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:orange-400 shrink-0">
				<Icon icon="lucide:flame" class="h-3.5 w-3.5" />
			</div>
			<span>Today's Trending Todos</span>
		</a>

		<div class="flex items-center gap-1.5 font-mono text-xs">
			<span class="text-[10px] text-zinc-400">TOP 5</span>
			<span class="text-[10px] text-zinc-300 dark:text-zinc-700">·</span>
			<a
				href="/trending"
				class="inline-flex items-center gap-0.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors group/link cursor-pointer font-sans"
				title="View all trending todos"
			>
				<span>View all</span>
				<Icon icon="lucide:arrow-right" class="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
			</a>
		</div>
	</div>

	<!-- List content -->
	<DataView
		loading={!trendingStore.loaded || trendingStore.loading}
		empty={trendingStore.cards.length === 0}
	>
		{#snippet skeleton()}
			<WidgetSkeleton rows={3} />
		{/snippet}

		{#snippet emptyView()}
			<div class="py-3 text-center text-xs text-zinc-400">
				No trending todos yet.
			</div>
		{/snippet}

		<div class="space-y-1.5">
			{#each trendingStore.cards as card (card.topicHash)}
				{@const isAllDone =
					(card.isMultiplayer || card.totalParticipants > 1) &&
					card.totalParticipants > 0 &&
					card.doneCount >= card.totalParticipants}
				{@const hasJoined =
					card.participants.some((p) => p.isMe || Boolean(userStore.id && p.user.id === userStore.id)) ||
					todayStore.isTopicJoined(card.content)}
				<div
					class="py-2 px-2.5 rounded-xl transition-all duration-150 space-y-1.5 group/card {isAllDone
						? 'border border-amber-300/60 dark:border-amber-500/50 bg-gradient-to-br from-amber-50/80 via-yellow-50/30 to-amber-50/80 dark:from-amber-950/25 dark:via-yellow-950/10 dark:to-amber-950/25 shadow-2xs'
						: 'hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60'}"
				>
					<!-- Title & actions -->
					<div class="flex items-center justify-between gap-2">
						<a
							href="/trending/{card.topicHash}?date={getTodayString()}"
							class="min-w-0 flex-1 group/title focus:outline-hidden"
							title="View trending details"
						>
							<span
								class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover/title:underline truncate block leading-snug {isAllDone ? 'text-amber-950 dark:text-amber-100' : ''}"
							>
								{card.content}
							</span>
						</a>

						<div class="flex items-center gap-1 shrink-0">
							{#if isAllDone}
								<span
									class="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 dark:text-amber-100 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 dark:from-amber-600 dark:via-yellow-600 dark:to-amber-500 px-2 py-0.5 rounded-md shadow-xs animate-in zoom-in-90 duration-150 select-none"
									title="Everyone has completed this todo"
								>
									<Icon icon="lucide:trophy" class="h-3 w-3 shrink-0" />
									<span>All Completed</span>
								</span>
							{/if}

							{#if hasJoined}
								<span
									class="text-[10px] font-medium {isAllDone
										? 'text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/40 border border-amber-300/60 dark:border-amber-700/50'
										: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40'} px-2 py-0.5 rounded-md select-none"
								>
									In my list
								</span>
							{:else}
								<button
									type="button"
									onclick={() => handleJoin(card)}
									class="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-2 py-0.5 rounded-md hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
								>
									+ Add to my list
								</button>
							{/if}
						</div>
					</div>

					<!-- Bottom: stats & avatars -->
					<div class="flex items-center justify-between text-[11px] font-mono {isAllDone ? 'text-amber-600/90 dark:text-amber-400/90 font-medium' : 'text-zinc-400'}">
						<a
							href="/trending/{card.topicHash}?date={getTodayString()}"
							class="flex items-center gap-1 hover:underline cursor-pointer"
							title="View trending details"
						>
							{#if isAllDone}
								<Icon icon="lucide:sparkles" class="h-3.5 w-3.5 text-amber-500 shrink-0" />
								<span class="font-semibold text-amber-600 dark:text-amber-400">All {card.totalParticipants} completed</span>
							{:else}
								<span class="text-amber-500 font-semibold">{card.totalParticipants}</span>
								<span>people</span>
								<span>·</span>
								<span>{card.doneCount} completed</span>
							{/if}
						</a>

						<!-- 头像微堆叠：悬停展开并支持 Tooltip 气泡 (统一组件) -->
						<div class="flex -space-x-1 hover:space-x-0.5 transition-all duration-200 items-center">
							{#each card.participants.slice(0, 3) as p (p.todoId)}
								<UserAvatarTooltip
									user={p.user}
									size="xs"
									isStack={true}
									align="right"
									isMe={p.isMe}
									goldBadge={isAllDone}
								/>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</DataView>
</div>
