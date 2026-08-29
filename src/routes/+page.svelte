<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/services/api';
	import type { DailyCard, CardParticipant, TodoStatus } from '$lib/types/todo';
	import { userStore } from '$lib/stores/user.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { optimisticAction } from '$lib/utils/mutation';
	import { getCategoryConfig } from '$lib/constants/categories';
	import { getStatusConfig } from '$lib/constants/status';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	let cards = $state<DailyCard[]>([]);
	let loading = $state(true);
	let expandedCards = $state<Record<string, boolean>>({});

	function getTodayString(): string {
		const now = new Date();
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, '0');
		const d = String(now.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	const today = getTodayString();

	async function loadDailyTodos() {
		loading = true;
		try {
			const res = await api.getDailyCards({
				date: today,
				currentUserId: userStore.id
			});
			cards = res.cards || [];
		} catch (error) {
			console.error('Failed to load daily cards:', error);
			toast.error('加载今日待办失败，请刷新重试');
		} finally {
			loading = false;
		}
	}

	function findMyParticipant(card: DailyCard): CardParticipant | undefined {
		if (!userStore.current) return undefined;
		return card.participants.find(
			(p) =>
				p.isMe ||
				(userStore.id && p.user.id === userStore.id) ||
				(userStore.handle && p.user.handle === userStore.handle)
		);
	}

	function toggleExpand(topicHash: string) {
		expandedCards[topicHash] = !expandedCards[topicHash];
	}

	// 当前用户快捷勾选/切换完成状态 (0ms 本地乐观更新)
	async function handleToggleMyStatus(card: DailyCard, myParticipant: CardParticipant) {
		if (!userStore.email) return;

		const prevStatus = myParticipant.status;
		const nextStatus: TodoStatus = prevStatus === 'done' ? 'pending' : 'done';
		const prevDoneCount = card.doneCount;

		try {
			await optimisticAction({
				apply: () => {
					myParticipant.status = nextStatus;
					if (nextStatus === 'done' && prevStatus !== 'done') {
						card.doneCount += 1;
					} else if (prevStatus === 'done' && nextStatus !== 'done') {
						card.doneCount = Math.max(0, card.doneCount - 1);
					}
				},
				rollback: () => {
					myParticipant.status = prevStatus;
					card.doneCount = prevDoneCount;
				},
				action: async () => {
					await api.updateTodo(myParticipant.todoId, {
						email: userStore.email!,
						status: nextStatus
					});
				},
				onError: (err) => {
					toast.error(`状态更新失败: ${(err as Error).message}`);
				}
			});
		} catch {
			// error handled by onError
		}
	}

	// 当前已登录用户加入多人 Todo「一起做」 (0ms 本地乐观更新)
	async function handleJoinTopic(card: DailyCard) {
		if (!userStore.email) {
			toast.info('请先点击右上角头像设置您的发布邮箱');
			return;
		}

		const email = userStore.email;
		const tempId = `temp-${Date.now()}`;
		const newParticipant: CardParticipant = {
			todoId: tempId,
			shortId: tempId,
			status: 'pending',
			createdAt: new Date().toISOString(),
			isMe: true,
			user: {
				id: userStore.id || '',
				nickname: userStore.nickname,
				handle: userStore.handle,
				avatar: userStore.avatar
			}
		};

		const prevParticipants = [...card.participants];
		const prevTotal = card.totalParticipants;
		const prevIsMulti = card.isMultiplayer;

		try {
			await optimisticAction({
				apply: () => {
					card.participants.unshift(newParticipant);
					card.totalParticipants += 1;
					card.isMultiplayer = true;
				},
				rollback: () => {
					card.participants = prevParticipants;
					card.totalParticipants = prevTotal;
					card.isMultiplayer = prevIsMulti;
				},
				action: async () => {
					const res = await api.createTodo({
						email,
						content: card.content,
						category: card.category,
						startDate: today
					});
					// 成功后静默更新服务端生成的真实 ID
					newParticipant.todoId = res.todo.id;
					newParticipant.shortId = res.todo.shortId;
					if (res.author) {
						userStore.updateUserFromProfile(res.author);
					}
				},
				onError: (err) => {
					toast.error(`加入失败: ${(err as Error).message}`);
				}
			});
			toast.success(`已加入「${card.content}」！`);
		} catch {
			// error handled by onError
		}
	}

	onMount(() => {
		loadDailyTodos();
	});
</script>

<div class="w-full">
	{#if loading}
		<div class="flex justify-center py-16 text-zinc-400">
			<Spinner size="md" />
		</div>
	{:else if cards.length === 0}
		<div class="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 py-16 text-center text-xs text-zinc-400">
			今日暂无待办
		</div>
	{:else}
		<!-- 今日待办列表 -->
		<div class="divide-y divide-zinc-100 dark:divide-zinc-800/80 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
			{#each cards as card (card.topicHash)}
				{@const myParticipant = findMyParticipant(card)}
				{@const isMultiplayer = card.isMultiplayer || card.totalParticipants > 1}
				{@const isExpanded = expandedCards[card.topicHash] ?? false}
				{@const isMyDone = myParticipant?.status === 'done'}
				{@const catConfig = getCategoryConfig(card.category)}

				<div class="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
					<!-- 主行 Item 主体 -->
					<div class="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
						<!-- 左侧：自己的复选框（如有） + 分类圆点 + 正文内容 -->
						<div class="flex items-center gap-3 min-w-0 flex-1">
							{#if myParticipant}
								<!-- 仅当前用户的 Todo 显示可操作复选框 -->
								<button
									type="button"
									onclick={() => handleToggleMyStatus(card, myParticipant)}
									class="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-all duration-150 cursor-pointer {isMyDone ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900' : 'border-zinc-300 hover:border-zinc-500 dark:border-zinc-600 dark:hover:border-zinc-400'}"
									aria-label={isMyDone ? '标记为未完成' : '标记为已完成'}
									title={isMyDone ? '标记为未完成' : '标记为已完成'}
								>
									{#if isMyDone}
										<svg class="h-2.5 w-2.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
										</svg>
									{/if}
								</button>
							{:else}
								<!-- 占位元素保持所有 Item 左侧内容与基准线绝对对齐 (invisible) -->
								<div class="h-4.5 w-4.5 shrink-0 invisible" aria-hidden="true"></div>
							{/if}

							<!-- 分类极淡微圆点 (如有分类) -->
							{#if catConfig}
								<span
									class="h-1.5 w-1.5 rounded-full shrink-0"
									style="background-color: {catConfig.color};"
									title="分类: {catConfig.name}"
								></span>
							{/if}

							<!-- Todo 正文 -->
							<span
								class="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed truncate {isMyDone ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}"
							>
								{card.content}
							</span>
						</div>

						<!-- 右侧：仅多人 Todo 显示同行者折叠展开区域，单人 Todo 绝对不显示任何内容 -->
						{#if isMultiplayer}
							<button
								type="button"
								onclick={() => toggleExpand(card.topicHash)}
								class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
								title="查看同行者"
							>
								<!-- 紧凑微型头像叠层 -->
								<div class="flex -space-x-1.5 overflow-hidden">
									{#each card.participants.slice(0, 3) as p (p.todoId)}
										<Avatar
											src={p.user.avatar}
											name={p.user.nickname}
											size="xs"
											class="h-4.5 w-4.5 ring-1 ring-white dark:ring-zinc-900"
										/>
									{/each}
								</div>

								<span class="text-[11px] font-mono text-zinc-400">
									{card.doneCount}/{card.totalParticipants}
								</span>

								<!-- 折叠小箭头 -->
								<svg
									class="h-3 w-3 text-zinc-400 transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
								</svg>
							</button>
						{/if}
					</div>

					<!-- 多人 Todo 展开区：行内展示同行者打卡记录与“一起做” -->
					{#if isMultiplayer && isExpanded}
						<div class="border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-3 sm:px-5 space-y-2.5 animate-in fade-in duration-150">
							<div class="flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
								<span>同行伙伴打卡 ({card.totalParticipants})</span>
								{#if !myParticipant}
									<button
										type="button"
										onclick={() => handleJoinTopic(card)}
										class="font-medium text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer"
									>
										+ 加入一起做
									</button>
								{/if}
							</div>

							<!-- 参与者条目列表 -->
							<div class="space-y-1.5">
								{#each card.participants as p (p.todoId)}
									{@const pStatus = getStatusConfig(p.status)}
									<div class="flex items-center justify-between text-xs py-0.5">
										<div class="flex items-center gap-2">
											<Avatar src={p.user.avatar} name={p.user.nickname} size="xs" />
											<span class="font-medium text-zinc-800 dark:text-zinc-200">
												{p.user.nickname}
												{#if p.isMe || (userStore.id && p.user.id === userStore.id)}
													<span class="ml-1 text-[10px] text-zinc-400 font-normal">(我)</span>
												{/if}
											</span>
										</div>

										<span class="text-[11px] {p.status === 'done' ? 'text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-400'}">
											{pStatus.label}
										</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
