<script lang="ts">
	import { onMount } from 'svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { trendingStore, todayStore, todoMutations } from '$lib/stores/todo.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import type { DailyCard } from '$lib/types/todo';
	import UserAvatarTooltip from '$lib/components/user/UserAvatarTooltip.svelte';
	import CategoryBadge from '$lib/components/todo/CategoryBadge.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	interface Props {
		onJoinTopic?: (content: string, category?: string | null) => void;
	}

	let { onJoinTopic }: Props = $props();

	onMount(() => {
		trendingStore.load();
	});

	function handleJoin(card: DailyCard) {
		if (!userStore.email) {
			toast.info('请先点击右上角头像绑定邮箱后再加入');
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
	<!-- 标题栏 -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-1.5 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
			<span>🔥 热门多人 Todo</span>
		</div>
		<span class="text-[10px] text-zinc-400 font-mono">今日 TOP 5</span>
	</div>

	<!-- 列表内容 -->
	{#if (!trendingStore.loaded || trendingStore.loading) && trendingStore.cards.length === 0}
		<div class="flex justify-center py-4 text-zinc-400">
			<Spinner size="sm" />
		</div>
	{:else if trendingStore.cards.length === 0}
		<div class="py-3 text-center text-xs text-zinc-400">
			暂无热门多人目标，发布一个让大家一起参与吧！
		</div>
	{:else}
		<div class="space-y-2.5">
			{#each trendingStore.cards as card (card.topicHash)}
				{@const isAllDone =
					(card.isMultiplayer || card.totalParticipants > 1) &&
					card.totalParticipants > 0 &&
					card.doneCount >= card.totalParticipants}
				{@const hasJoined =
					card.participants.some((p) => p.isMe || Boolean(userStore.id && p.user.id === userStore.id)) ||
					todayStore.isTopicJoined(card.content)}
				<div
					class="p-2.5 rounded-xl transition-all space-y-2 group/card border {isAllDone
						? 'border-amber-300/80 dark:border-amber-500/60 bg-gradient-to-br from-amber-50/90 via-yellow-50/40 to-amber-50/90 dark:from-amber-950/30 dark:via-yellow-950/15 dark:to-amber-950/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
						: 'border-zinc-200/50 dark:border-zinc-800/60 bg-zinc-50/90 dark:bg-zinc-900/50 hover:bg-zinc-100/90 dark:hover:bg-zinc-900/80'}"
				>
					<!-- 目标标题与分类 (点击直达多人 Todo 详情页) -->
					<div class="flex items-start justify-between gap-2">
						<a
							href="/topics/{card.topicHash}"
							class="flex items-center gap-1.5 min-w-0 flex-1 group/title focus:outline-hidden"
							title="查看多人 Todo 详情"
						>
							<!-- 统一 CategoryBadge (dot 模式) -->
							<CategoryBadge category={card.category} mode="dot" />

							<span
								class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover/title:underline truncate leading-snug {isAllDone ? 'text-amber-950 dark:text-amber-100' : ''}"
							>
								{card.content}
							</span>
						</a>

						<div class="flex items-center gap-1 shrink-0">
							{#if isAllDone}
								<!-- 全员达成专属金色勋章 -->
								<span
									class="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 dark:text-amber-100 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 dark:from-amber-600 dark:via-yellow-600 dark:to-amber-500 px-2 py-0.5 rounded-md shadow-xs animate-in zoom-in-90 duration-150 select-none"
									title="所有同行伙伴已全部完成"
								>
									<span>🏆</span>
									<span>全员达成</span>
								</span>
							{/if}

							{#if hasJoined}
								<!-- 当前用户已加入：展示已同行状态徽标 -->
								<span
									class="text-[10px] font-medium {isAllDone
										? 'text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/40 border border-amber-300/60 dark:border-amber-700/50'
										: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40'} px-2 py-0.5 rounded-md select-none"
								>
									已同行
								</span>
							{:else}
								<!-- 当前用户未加入：展示可点击的一起做按钮 -->
								<button
									type="button"
									onclick={() => handleJoin(card)}
									class="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-2 py-0.5 rounded-md hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
								>
									+ 一起做
								</button>
							{/if}
						</div>
					</div>

					<!-- 底部：参与人数与头像微堆叠 -->
					<div class="flex items-center justify-between text-[11px] font-mono {isAllDone ? 'text-amber-600/90 dark:text-amber-400/90 font-medium' : 'text-zinc-400'}">
						<a
							href="/topics/{card.topicHash}"
							class="flex items-center gap-1 hover:underline cursor-pointer"
							title="查看多人 Todo 详情"
						>
							{#if isAllDone}
								<span class="text-amber-500">✨</span>
								<span class="font-semibold text-amber-600 dark:text-amber-400">{card.totalParticipants} 人同行全部达成</span>
							{:else}
								<span class="text-amber-500 font-semibold">{card.totalParticipants}</span>
								<span>人同行</span>
								<span>·</span>
								<span>{card.doneCount} 达成</span>
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
	{/if}
</div>
