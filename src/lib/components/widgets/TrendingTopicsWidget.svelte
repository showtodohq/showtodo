<script lang="ts">
	import { onMount } from 'svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { trendingStore, todayStore, todoMutations } from '$lib/stores/todo.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { getTodayString } from '$lib/utils/format';
	import type { DailyCard } from '$lib/types/todo';
	import UserAvatarTooltip from '$lib/components/user/UserAvatarTooltip.svelte';
	import CategoryBadge from '$lib/components/todo/CategoryBadge.svelte';
	import DataView from '$lib/components/ui/DataView.svelte';
	import WidgetSkeleton from '$lib/components/skeleton/WidgetSkeleton.svelte';

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
		<a
			href="/topics"
			class="flex items-center gap-1.5 font-semibold text-xs text-zinc-900 dark:text-zinc-100 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group/title"
			title="前往多人 Todo 广场"
		>
			<span>🔥 热门多人 Todo</span>
		</a>

		<div class="flex items-center gap-1.5">
			<span class="text-[10px] text-zinc-400 font-mono">今日 TOP 5</span>
			<span class="text-[10px] text-zinc-300 dark:text-zinc-700">·</span>
			<a
				href="/topics"
				class="inline-flex items-center gap-0.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors group/link cursor-pointer"
				title="前往多人 Todo 广场查看全部"
			>
				<span>查看全部</span>
				<span class="transition-transform group-hover/link:translate-x-0.5">→</span>
			</a>
		</div>
	</div>

	<!-- 列表内容 -->
	<DataView
		loading={!trendingStore.loaded || trendingStore.loading}
		empty={trendingStore.cards.length === 0}
	>
		{#snippet skeleton()}
			<WidgetSkeleton rows={3} />
		{/snippet}

		{#snippet emptyView()}
			<div class="py-3 text-center text-xs text-zinc-400">
				暂无热门多人目标，发布一个让大家一起参与吧！
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
					<!-- 目标标题与分类 (点击直达多人 Todo 详情页) -->
					<div class="flex items-center justify-between gap-2">
						<a
							href="/topics/{card.topicHash}?date={getTodayString()}"
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
							href="/topics/{card.topicHash}?date={getTodayString()}"
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
	</DataView>
</div>
