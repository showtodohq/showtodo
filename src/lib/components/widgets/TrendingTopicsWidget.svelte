<script lang="ts">
	import { onMount } from 'svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { todoStore } from '$lib/stores/todo.svelte';
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
		todoStore.loadTrendingCards();
	});

	function handleJoin(card: DailyCard) {
		if (!userStore.email) {
			toast.info('请先点击右上角头像绑定邮箱后再加入');
			return;
		}

		if (onJoinTopic) {
			onJoinTopic(card.content, card.category);
		} else {
			todoStore.createTodo({
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
		<span class="text-[10px] text-zinc-400 font-mono">今日同行</span>
	</div>

	<!-- 列表内容 -->
	{#if todoStore.trendingLoading && todoStore.trendingCards.length === 0}
		<div class="flex justify-center py-4 text-zinc-400">
			<Spinner size="sm" />
		</div>
	{:else if todoStore.trendingCards.length === 0}
		<div class="py-3 text-center text-xs text-zinc-400">
			暂无热门多人目标，发布一个让大家一起参与吧！
		</div>
	{:else}
		<div class="space-y-2.5">
			{#each todoStore.trendingCards as card (card.topicHash)}
				{@const hasJoined =
					card.participants.some((p) => p.isMe || Boolean(userStore.id && p.user.id === userStore.id)) ||
					todoStore.isTopicJoined(card.content)}
				<div
					class="p-2.5 rounded-xl bg-zinc-50/90 dark:bg-zinc-900/50 hover:bg-zinc-100/90 dark:hover:bg-zinc-900/80 transition-all border border-zinc-200/50 dark:border-zinc-800/60 space-y-2 group/card"
				>
					<!-- 目标标题与分类 -->
					<div class="flex items-start justify-between gap-2">
						<div class="flex items-center gap-1.5 min-w-0 flex-1">
							<!-- 统一 CategoryBadge (dot 模式) -->
							<CategoryBadge category={card.category} mode="dot" />

							<span
								class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-snug"
							>
								{card.content}
							</span>
						</div>

						{#if hasJoined}
							<!-- 当前用户已加入：展示已同行状态徽标 -->
							<span
								class="shrink-0 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40 select-none"
							>
								已同行
							</span>
						{:else}
							<!-- 当前用户未加入：展示可点击的一起做按钮 -->
							<button
								type="button"
								onclick={() => handleJoin(card)}
								class="shrink-0 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-2 py-0.5 rounded-md hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
							>
								+ 一起做
							</button>
						{/if}
					</div>

					<!-- 底部：参与人数与头像微堆叠 -->
					<div class="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
						<div class="flex items-center gap-1">
							<span class="text-amber-500 font-semibold">{card.totalParticipants}</span>
							<span>人同行</span>
							<span>·</span>
							<span>{card.doneCount} 达成</span>
						</div>

						<!-- 头像微堆叠：悬停展开并支持 Tooltip 气泡 (统一组件) -->
						<div class="flex -space-x-1 hover:space-x-0.5 transition-all duration-200 items-center">
							{#each card.participants.slice(0, 3) as p (p.todoId)}
								<UserAvatarTooltip
									user={p.user}
									size="xs"
									isStack={true}
									align="right"
									isMe={p.isMe}
								/>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
