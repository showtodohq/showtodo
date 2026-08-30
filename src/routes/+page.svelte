<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { api } from '$lib/services/api';
	import type { DailyCard, CardParticipant, TodoStatus } from '$lib/types/todo';
	import { userStore } from '$lib/stores/user.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { optimisticAction } from '$lib/utils/mutation';
	import { confetti } from '$lib/utils/confetti';
	import { getCategoryConfig } from '$lib/constants/categories';
	import { getStatusConfig } from '$lib/constants/status';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	const VIEW_FILTER_KEY = 'public_todo_view_filter';

	// ---------------------------------------------------------------------------
	// 日期状态与工具
	// ---------------------------------------------------------------------------
	function getTodayString(): string {
		const now = new Date();
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, '0');
		const d = String(now.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	const todayString = getTodayString();
	let selectedDate = $state(getTodayString());
	let dateInputRef = $state<HTMLInputElement | null>(null);

	// ---------------------------------------------------------------------------
	// 视角过滤：'all' (全网) | 'mine' (我的)，支持 localStorage 自动持久化记忆
	// ---------------------------------------------------------------------------
	let viewFilter = $state<'all' | 'mine'>('all');

	function setViewFilter(filter: 'all' | 'mine') {
		viewFilter = filter;
		if (browser) {
			try {
				localStorage.setItem(VIEW_FILTER_KEY, filter);
			} catch (e) {
				console.error('Failed to save view filter:', e);
			}
		}
	}

	function shiftDate(offsetDays: number) {
		const [y, m, d] = selectedDate.split('-').map(Number);
		const cur = new Date(y, m - 1, d);
		cur.setDate(cur.getDate() + offsetDays);
		const ny = cur.getFullYear();
		const nm = String(cur.getMonth() + 1).padStart(2, '0');
		const nd = String(cur.getDate()).padStart(2, '0');
		selectedDate = `${ny}-${nm}-${nd}`;
		loadDailyTodos();
	}

	function goToToday() {
		if (selectedDate === todayString) return;
		selectedDate = todayString;
		loadDailyTodos();
	}

	// ---------------------------------------------------------------------------
	// 列表数据与加载状态
	// ---------------------------------------------------------------------------
	let cards = $state<DailyCard[]>([]);
	let loading = $state(true);
	let expandedCards = $state<Record<string, boolean>>({});

	async function loadDailyTodos() {
		loading = true;
		try {
			const res = await api.getDailyCards({
				date: selectedDate,
				currentUserId: userStore.id,
				limit: 1000
			});
			cards = res.cards || [];
		} catch (error) {
			console.error('Failed to load daily cards:', error);
			toast.error('加载待办失败，请重试');
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

	// ---------------------------------------------------------------------------
	// 人次打卡口径统计 (Svelte 5 $derived 细粒度推导)
	// ---------------------------------------------------------------------------
	// 全网人次统计
	const globalTotal = $derived(
		cards.reduce((sum, c) => sum + (c.totalParticipants || 0), 0)
	);
	const globalDone = $derived(
		cards.reduce((sum, c) => sum + (c.doneCount || 0), 0)
	);

	// 个人打卡统计
	const myParticipatedCards = $derived(
		cards.filter((c) => Boolean(findMyParticipant(c)))
	);
	const myTotal = $derived(myParticipatedCards.length);
	const myDone = $derived(
		myParticipatedCards.filter((c) => findMyParticipant(c)?.status === 'done').length
	);

	// 实际渲染呈现的列表 (受 viewFilter 过滤)
	const displayedCards = $derived(
		viewFilter === 'mine' ? myParticipatedCards : cards
	);

	// ---------------------------------------------------------------------------
	// 状态变更与本地变异 + 全屏灵动庆祝动效 (0ms 即时响应)
	// ---------------------------------------------------------------------------
	async function handleToggleMyStatus(card: DailyCard, myParticipant: CardParticipant, event?: MouseEvent) {
		if (!userStore.email) return;

		const prevStatus = myParticipant.status;
		const nextStatus: TodoStatus = prevStatus === 'done' ? 'pending' : 'done';
		const prevDoneCount = card.doneCount;

		// 触发全屏庆祝动效
		if (nextStatus === 'done') {
			// 1. 单次轻盈全屏撒花（以点击位置为发射源）
			if (event) {
				confetti.burst(event.clientX, event.clientY, 40);
			} else {
				confetti.burst(undefined, undefined, 40);
			}
		}

		try {
			await optimisticAction({
				apply: () => {
					myParticipant.status = nextStatus;
					if (nextStatus === 'done' && prevStatus !== 'done') {
						card.doneCount += 1;
					} else if (prevStatus === 'done' && nextStatus !== 'done') {
						card.doneCount = Math.max(0, card.doneCount - 1);
					}

					// 2. 检查当天待办是否全部搞定（触发三次全屏超级大撒花）
					if (nextStatus === 'done') {
						// 计算当前最新的个人完成情况
						const currentMyCards = cards.filter((c) => Boolean(findMyParticipant(c)));
						const allMyDone = currentMyCards.length > 0 && currentMyCards.every((c) => findMyParticipant(c)?.status === 'done');
						if (allMyDone) {
							confetti.tripleCelebration();
							toast.success('🎉 太棒了！今日全部待办已全部达成！');
						}
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
						startDate: selectedDate
					});
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
		if (browser) {
			const savedFilter = localStorage.getItem(VIEW_FILTER_KEY) as 'all' | 'mine' | null;
			if (savedFilter === 'all' || savedFilter === 'mine') {
				viewFilter = savedFilter;
			}
		}
		loadDailyTodos();
	});
</script>

<div class="w-full space-y-4">
	<!-- 顶部单行状态栏：日期导航 + 个人/全网打卡统计 (可点击切换，激活态呈现下划线) -->
	<div class="flex items-center justify-between text-xs py-1 px-0.5 text-zinc-600 dark:text-zinc-400 select-none">
		<!-- 左侧：日期导航控制器 -->
		<div class="flex items-center gap-1.5 font-medium">
			<!-- 上一天 -->
			<button
				type="button"
				onclick={() => shiftDate(-1)}
				class="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-all duration-100 active:scale-90 cursor-pointer"
				title="上一天"
				aria-label="Previous day"
			>
				<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>

			<!-- 当前日期与原生隐藏日期选择器 -->
			<div class="relative flex items-center">
				<button
					type="button"
					onclick={() => dateInputRef?.showPicker?.() || dateInputRef?.focus()}
					class="px-2 py-1 font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all duration-100 active:scale-95 cursor-pointer"
					title="点击选择日期"
				>
					{selectedDate}
				</button>
				<!-- 原生 DatePicker -->
				<input
					type="date"
					bind:this={dateInputRef}
					bind:value={selectedDate}
					onchange={() => loadDailyTodos()}
					class="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
					tabindex="-1"
					aria-label="Select date"
				/>
			</div>

			<!-- 回到今天按钮 (仅当选中的不是今天时显示) -->
			{#if selectedDate !== todayString}
				<button
					type="button"
					onclick={goToToday}
					class="rounded-md bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-all duration-100 active:scale-90 cursor-pointer shadow-xs"
					title="回到今天"
				>
					今天
				</button>
			{/if}

			<!-- 下一天 -->
			<button
				type="button"
				onclick={() => shiftDate(1)}
				class="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-all duration-100 active:scale-90 cursor-pointer"
				title="下一天"
				aria-label="Next day"
			>
				<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>

		<!-- 右侧：方案 1【个人 + 全网双重视角】人次打卡统计，激活态呈现下划线，未激活态保持原样 -->
		<div class="flex items-center gap-1.5 font-mono text-xs text-zinc-400 dark:text-zinc-500">
			{#if myTotal > 0}
				<button
					type="button"
					onclick={() => setViewFilter('mine')}
					class="transition-colors cursor-pointer {viewFilter === 'mine' ? 'underline underline-offset-4 decoration-zinc-900 dark:decoration-zinc-100 text-zinc-900 dark:text-zinc-100' : 'hover:text-zinc-700 dark:hover:text-zinc-300'}"
					title="点击只看我参与的待办"
				>
					我的: <strong class="font-semibold text-zinc-800 dark:text-zinc-200">{myDone}/{myTotal}</strong>
				</button>
				<span>·</span>
			{/if}

			<button
				type="button"
				onclick={() => setViewFilter('all')}
				class="transition-colors cursor-pointer {viewFilter === 'all' ? 'underline underline-offset-4 decoration-zinc-900 dark:decoration-zinc-100 text-zinc-900 dark:text-zinc-100' : 'hover:text-zinc-700 dark:hover:text-zinc-300'}"
				title="点击查看全网广场待办"
			>
				全网: <strong class="font-semibold text-zinc-800 dark:text-zinc-200">{globalDone}/{globalTotal}</strong>
			</button>
		</div>
	</div>

	{#snippet userAvatarTooltip(user: { id?: string; nickname: string; handle: string; avatar?: string | null }, isStack = false)}
		<div class="relative group/avatar flex items-center shrink-0">
			<Avatar
				src={user.avatar}
				name={user.nickname}
				size="xs"
				class="h-4.5 w-4.5 cursor-pointer transition-all duration-150 {isStack ? 'ring-1.5 ring-white dark:ring-zinc-900 group-hover/avatar:scale-115 group-hover/avatar:z-20 group-hover/avatar:ring-zinc-400 dark:group-hover/avatar:ring-zinc-600' : 'ring-1 ring-transparent group-hover/avatar:ring-zinc-300 dark:group-hover/avatar:ring-zinc-700'}"
			/>

			<!-- 悬停精致微型 Tooltip -->
			<div class="pointer-events-none absolute bottom-full right-0 mb-1.5 hidden group-hover/avatar:flex flex-col items-end z-30 animate-in fade-in zoom-in-95 duration-100">
				<div class="rounded-md bg-zinc-900 px-2 py-1 text-[11px] text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900 whitespace-nowrap">
					<span class="font-semibold">{user.nickname}</span>
					<span class="opacity-60 text-[10px] ml-1 font-mono">@{user.handle}</span>
				</div>
			</div>
		</div>
	{/snippet}

	<!-- 待办内容区 -->
	{#if loading}
		<div class="flex justify-center py-16 text-zinc-400">
			<Spinner size="md" />
		</div>
	{:else if displayedCards.length === 0}
		<div class="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 py-16 text-center text-xs text-zinc-400">
			{#if viewFilter === 'mine'}
				当前日期您暂无参与的待办
				<button
					type="button"
					onclick={() => setViewFilter('all')}
					class="ml-2 font-medium text-zinc-900 dark:text-zinc-100 underline cursor-pointer"
				>
					查看全网广场
				</button>
			{:else}
				{selectedDate === todayString ? '今日暂无待办' : `${selectedDate} 暂无待办`}
			{/if}
		</div>
	{:else}
		<!-- 今日待办列表：允许浮层向上溢出 (避免 overflow-hidden 裁切第一行的 Tooltip) -->
		<div class="divide-y divide-zinc-100 dark:divide-zinc-800/80 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
			{#each displayedCards as card (card.topicHash)}
				{@const myParticipant = findMyParticipant(card)}
				{@const isMultiplayer = card.isMultiplayer || card.totalParticipants > 1}
				{@const isExpanded = expandedCards[card.topicHash] ?? false}
				{@const isSoloDone = !isMultiplayer && card.participants[0]?.status === 'done'}
				{@const isAllDone = isMultiplayer && card.doneCount === card.totalParticipants && card.totalParticipants > 0}
				{@const isCompletedVisual = (myParticipant && myParticipant.status === 'done') || isSoloDone || isAllDone}
				{@const catConfig = getCategoryConfig(card.category)}

				<div class="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 first:rounded-t-xl last:rounded-b-xl relative hover:z-20">
					<!-- 主行 Item 主体 -->
					<div class="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
						<!-- 左侧：统一待办勾选框（当前用户可操作，他人只读清晰区分） + 分类圆点 + 正文内容 -->
						<div class="flex items-center gap-3 min-w-0 flex-1">
							{#if myParticipant}
								<!-- 当前用户自己的待办：1px 边框与他人一致，边框色同他人勾选色 (zinc-600/300)，带灵动 hover 弹簧微动效 -->
								{@const isMyDone = myParticipant.status === 'done'}
								<button
									type="button"
									onclick={(e) => handleToggleMyStatus(card, myParticipant, e)}
									class="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-all duration-150 active:scale-85 cursor-pointer {isMyDone ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-xs' : 'border-zinc-600 dark:border-zinc-300 hover:scale-110 hover:border-zinc-900 dark:hover:border-white hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
									aria-label={isMyDone ? '标记为未完成' : '标记为已完成'}
									title={isMyDone ? '点击标记为未完成' : '点击标记为已完成（我参与的）'}
								>
									{#if isMyDone}
										<svg class="h-2.5 w-2.5 stroke-[3] animate-in zoom-in-50 duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
										</svg>
									{/if}
								</button>
							{:else if isSoloDone || isAllDone}
								<!-- 他人待办：已达成状态（清晰浅灰底 + 深灰实心勾，对比度适中易辨识） -->
								<div
									class="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-600 bg-zinc-150 bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-default select-none shadow-2xs"
									title={isAllDone ? '全员已达成（他人）' : '作者已完成（他人）'}
								>
									<svg class="h-2.5 w-2.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
									</svg>
								</div>
							{:else}
								<!-- 他人待办：未完成状态（微底色+清晰点边框，与当前用户交互环形成鲜明区分） -->
								<div
									class="h-4.5 w-4.5 shrink-0 rounded-full border border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50/80 dark:bg-zinc-800/40 cursor-default select-none"
									title="待办中（他人待办，只读）"
								></div>
							{/if}

							<!-- 分类极淡微圆点 (如有分类) -->
							{#if catConfig}
								<span
									class="h-1.5 w-1.5 rounded-full shrink-0"
									style="background-color: {catConfig.color};"
									title="分类: {catConfig.name}"
								></span>
							{/if}

							<!-- Todo 正文：已完成状态提升至 zinc-500/400 保证清晰易读与舒适降噪 -->
							<span
								class="text-sm font-medium leading-relaxed truncate {isCompletedVisual ? 'line-through decoration-zinc-400 dark:decoration-zinc-500 text-zinc-500 dark:text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}"
							>
								{card.content}
							</span>
						</div>

						<!-- 右侧：单人展示统一作者头像+Tooltip，多人展示同行者叠层+每个独立Tooltip与展开按钮 -->
						{#if isMultiplayer}
							<div class="flex items-center gap-1.5 shrink-0">
								<!-- 紧凑微型头像叠层：每个头像独立支持悬停 Tooltip，悬停时轻柔展开 -->
								<div class="flex -space-x-1.5 hover:space-x-0.5 transition-all duration-200 items-center">
									{#each card.participants.slice(0, 3) as p (p.todoId)}
										{@render userAvatarTooltip(p.user, true)}
									{/each}
								</div>

								<!-- 展开/折叠按钮与完成比例 -->
								<button
									type="button"
									onclick={() => toggleExpand(card.topicHash)}
									class="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
									title="展开同行者"
								>
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
							</div>
						{:else if card.participants[0]}
							<!-- 单人 Todo：右侧展示统一作者头像与悬停 Tooltip -->
							{@const author = card.participants[0].user}
							<div class="pr-1">
								{@render userAvatarTooltip(author, false)}
							</div>
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
											{@render userAvatarTooltip(p.user, false)}
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
