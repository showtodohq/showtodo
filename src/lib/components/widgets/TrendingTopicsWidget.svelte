<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/services/api';
	import type { DailyCard } from '$lib/types/todo';
	import { userStore } from '$lib/stores/user.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { getCategoryConfig } from '$lib/constants/categories';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	interface Props {
		onJoinTopic?: (content: string, category?: string | null) => void;
	}

	let { onJoinTopic }: Props = $props();

	let trendingCards = $state<DailyCard[]>([]);
	let loading = $state(true);

	function getTodayString(): string {
		const now = new Date();
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, '0');
		const d = String(now.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	export async function loadTrending() {
		loading = true;
		try {
			const res = await api.getDailyCards({
				date: getTodayString(),
				currentUserId: userStore.id,
				limit: 50
			});

			const allCards = res.cards || [];
			// 优先选出多人参与的目标 (totalParticipants > 1)，按同行人数降序
			const multi = allCards
				.filter((c) => c.totalParticipants > 1)
				.sort((a, b) => b.totalParticipants - a.totalParticipants);

			if (multi.length >= 3) {
				trendingCards = multi.slice(0, 5);
			} else {
				// 若多人较少，补充按同行人数/完成人数排列的 Top 目标
				const sorted = [...allCards].sort((a, b) => b.totalParticipants - a.totalParticipants);
				trendingCards = sorted.slice(0, 5);
			}
		} catch (e) {
			console.error('Failed to load trending topics:', e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadTrending();
	});

	function handleJoin(card: DailyCard) {
		if (!userStore.email) {
			toast.info('请先点击右上角头像绑定邮箱后再加入');
			return;
		}
		onJoinTopic?.(card.content, card.category);
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
		<span class="text-[10px] text-zinc-400 font-mono">今日共建</span>
	</div>

	<!-- 列表内容 -->
	{#if loading && trendingCards.length === 0}
		<div class="flex justify-center py-4 text-zinc-400">
			<Spinner size="sm" />
		</div>
	{:else if trendingCards.length === 0}
		<div class="py-3 text-center text-xs text-zinc-400">
			暂无热门多人目标，发布一个让大家一起参与吧！
		</div>
	{:else}
		<div class="space-y-2.5">
			{#each trendingCards as card (card.topicHash)}
				{@const catConfig = getCategoryConfig(card.category)}
				<div
					class="p-2.5 rounded-xl bg-zinc-50/90 dark:bg-zinc-900/50 hover:bg-zinc-100/90 dark:hover:bg-zinc-900/80 transition-all border border-zinc-200/50 dark:border-zinc-800/60 space-y-2 group/card"
				>
					<!-- 目标标题与分类 -->
					<div class="flex items-start justify-between gap-2">
						<div class="flex items-center gap-1.5 min-w-0 flex-1">
							{#if catConfig}
								<span
									class="h-1.5 w-1.5 rounded-full shrink-0"
									style="background-color: {catConfig.color};"
								></span>
							{/if}
							<span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-snug">
								{card.content}
							</span>
						</div>

						<button
							type="button"
							onclick={() => handleJoin(card)}
							class="shrink-0 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-2 py-0.5 rounded-md hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
						>
							+ 一起做
						</button>
					</div>

					<!-- 底部：参与人数与头像微堆叠 -->
					<div class="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
						<div class="flex items-center gap-1">
							<span class="text-amber-500 font-semibold">{card.totalParticipants}</span>
							<span>人同行</span>
							<span>·</span>
							<span>{card.doneCount} 达成</span>
						</div>

						<!-- 头像微堆叠：悬停展开并支持 Tooltip 气泡 -->
						<div class="flex -space-x-1 hover:space-x-0.5 transition-all duration-200 items-center">
							{#each card.participants.slice(0, 3) as p (p.todoId)}
								<div class="relative group/avatar flex items-center shrink-0">
									<Avatar
										src={p.user.avatar}
										name={p.user.nickname}
										size="xs"
										class="h-4.5 w-4.5 cursor-pointer ring-1.5 ring-white dark:ring-zinc-900 group-hover/avatar:scale-115 group-hover/avatar:z-20 transition-transform"
									/>

									<!-- 悬停微型 Tooltip 气泡 -->
									<div
										class="pointer-events-none absolute bottom-full right-0 mb-1.5 hidden group-hover/avatar:flex flex-col items-end z-30 animate-in fade-in zoom-in-95 duration-100"
									>
										<div
											class="rounded-md bg-zinc-900 px-2 py-1 text-[11px] text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900 whitespace-nowrap"
										>
											<span class="font-semibold">{p.user.nickname}</span>
											{#if p.user.handle}
												<span class="opacity-60 text-[10px] ml-1 font-mono">@{p.user.handle}</span>
											{/if}
											{#if p.isMe}
												<span class="ml-1 text-[10px] text-amber-300 dark:text-amber-600 font-semibold">(我)</span>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
