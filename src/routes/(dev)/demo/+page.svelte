<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import type { DailyCard, CardParticipant, TodoStatus } from '$lib/types/todo';
	import { api } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import { getLocalDayAsUtcRange } from '$lib/utils/format';
	import {
		TODO_STATUS,
		ALL_TODO_STATUSES,
		TODO_STATUSES,
		getStatusConfig,
		ALLOWED_STATUS_TRANSITIONS,
		isStatusDone,
		isStatusInProgress,
		isStatusAbandoned
	} from '$lib/constants/status';

	// ---------------------------------------------------------------------------
	// 预设测试账号池（便于在单页面快速切换多重身份体验协同与隔离）
	// ---------------------------------------------------------------------------
	const PRESET_USERS = [
		{ email: 'alex@example.com', nickname: 'Alex', handle: 'alex_dev' },
		{ email: 'sarah@example.com', nickname: 'Sarah', handle: 'sarah_design' },
		{ email: 'chen@example.com', nickname: 'Chen', handle: 'chen_runner' },
		{ email: 'lin@example.com', nickname: 'Lin', handle: 'lin_study' }
	];

	// ---------------------------------------------------------------------------
	// 响应式状态 (Svelte 5 Runes)
	// ---------------------------------------------------------------------------
	let selectedDate = $state(getTodayString());
	let selectedCategory = $state<string>('all');
	let onlyMine = $state(false);
	let loading = $state(false);
	let cards = $state<DailyCard[]>([]);
	let totalCards = $state(0);

	// 自定义身份输入
	let customEmailInput = $state('');
	let isSyncingUser = $state(false);

	// 新建待办表单
	let newContent = $state('');
	let newCategory = $state('study');
	let newNote = $state('');
	let isNotePublic = $state(true);
	let isSubmitting = $state(false);
	let showCreateDrawer = $state(false);

	// 编辑详情弹窗
	let activeEditModal = $state<{
		card: DailyCard;
		todo: CardParticipant;
		// 编辑表单字段
		content: string;
		category: string;
		status: TodoStatus;
		note: string;
		isNotePublic: boolean;
		startDate: string;
		dueDate: string;
		participantCount: number;
	} | null>(null);
	let isSavingEdit = $state(false);

	// 展开详情的卡片 ID
	let expandedTopicHashes = $state<Record<string, boolean>>({});

	// 状态切换下拉菜单打开状态
	let openStatusMenuTodoId = $state<string | null>(null);

	// 提示消息
	let toastMessage = $state<string | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

	function showToast(msg: string) {
		if (toastTimer) clearTimeout(toastTimer);
		toastMessage = msg;
		toastTimer = setTimeout(() => {
			toastMessage = null;
		}, 3000);
	}

	// ---------------------------------------------------------------------------
	// 日期与分类辅助
	// ---------------------------------------------------------------------------
	function getTodayString(): string {
		const now = new Date();
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, '0');
		const d = String(now.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	function shiftDate(offsetDays: number) {
		const [y, m, d] = selectedDate.split('-').map(Number);
		const cur = new Date(y, m - 1, d);
		cur.setDate(cur.getDate() + offsetDays);
		const ny = cur.getFullYear();
		const nm = String(cur.getMonth() + 1).padStart(2, '0');
		const nd = String(cur.getDate()).padStart(2, '0');
		selectedDate = `${ny}-${nm}-${nd}`;
		loadData();
	}

	const CATEGORY_TABS = [
		{ id: 'all', label: 'All' },
		{ id: 'study', label: 'Study' },
		{ id: 'fitness', label: 'Fitness' },
		{ id: 'dev', label: 'Dev' },
		{ id: 'finance', label: 'Finance' },
		{ id: 'life', label: 'Life' },
		{ id: 'other', label: 'Other' }
	];

	// ---------------------------------------------------------------------------
	// 用户登录与身份同步（核心修复：获取真正的数据库 UUID）
	// ---------------------------------------------------------------------------
	async function switchUserByEmail(email: string) {
		const cleanEmail = email.trim().toLowerCase();
		if (!cleanEmail) return;

		isSyncingUser = true;
		try {
			// 从后端注册/获取真实用户资料与真实 UUID
			const { user } = await api.syncUser(cleanEmail);
			userStore.updateUserFromProfile(user);
			showToast(`Switched identity to: ${user.nickname} (@${user.handle})`);
			await loadData();
		} catch (e) {
			console.error('Failed to sync user profile:', e);
			// 兜底本地设置
			userStore.setSession({
				email: cleanEmail,
				nickname: cleanEmail.split('@')[0],
				handle: cleanEmail.split('@')[0]
			});
			await loadData();
		} finally {
			isSyncingUser = false;
		}
	}

	// ---------------------------------------------------------------------------
	// 数据加载（支持 onlyMine 过滤与当前用户置顶）
	// ---------------------------------------------------------------------------
	async function loadData() {
		loading = true;
		openStatusMenuTodoId = null;

		try {
			// 确保有当前用户 UUID 传入
			const { startDateFrom, startDateTo } = getLocalDayAsUtcRange(selectedDate);
			const res = await api.getDailyCards({
				date: selectedDate,
				startDateFrom,
				startDateTo,
				category: selectedCategory === 'all' ? undefined : selectedCategory,
				onlyMine,
				currentUserId: userStore.id
			});
			cards = res.cards;
			totalCards = res.totalCards;
		} catch (e) {
			console.error('Failed to load daily cards:', e);
			if (cards.length === 0) {
				cards = [];
				totalCards = 0;
			}
		} finally {
			loading = false;
		}
	}

	// 判断某个参与者是否为当前登录用户
	function isCurrentParticipant(p: CardParticipant): boolean {
		if (p.isMe) return true;
		if (userStore.id && p.user.id === userStore.id) return true;
		if (userStore.handle && p.user.handle === userStore.handle) return true;
		return false;
	}

	// ---------------------------------------------------------------------------
	// 交互动作：创建待办（纯乐观更新，不重新拉取全量列表）
	// ---------------------------------------------------------------------------
	async function handleCreateTodo(e: SubmitEvent) {
		e.preventDefault();
		if (!newContent.trim() || isSubmitting) return;

		const email = userStore.email || PRESET_USERS[0].email;
		const content = newContent.trim();
		const category = newCategory;
		const note = newNote.trim() || undefined;
		const notePub = isNotePublic;
		const date = selectedDate;

		isSubmitting = true;

		try {
			const res = await api.createTodo({
				email,
				content,
				category,
				note,
				isNotePublic: notePub,
				startDate: date
			});

			if (res.author) {
				userStore.updateUserFromProfile(res.author);
			}

			// 乐观更新卡片数据，无需重新请求 loadData
			const newParticipant: CardParticipant = {
				todoId: res.todo.id,
				shortId: res.todo.shortId,
				status: res.todo.status,
				createdAt: res.todo.createdAt,
				isMe: true,
				user: {
					id: res.author?.id || userStore.id || '',
					nickname: res.author?.nickname || userStore.nickname,
					handle: res.author?.handle || userStore.handle,
					avatar: res.author?.avatar || userStore.avatar
				}
			};

			// 查找是否存在相同 topicHash 的卡片
			const existingCardIndex = cards.findIndex(
				(c) => c.topicHash === res.todo.topicHash
			);

			if (existingCardIndex > -1) {
				const card = cards[existingCardIndex];
				const pIndex = card.participants.findIndex((p) => p.todoId === newParticipant.todoId);
				if (pIndex === -1) {
					card.participants.unshift(newParticipant);
					card.totalParticipants = card.participants.length;
					card.isMultiplayer = card.totalParticipants > 1;
					if (isStatusDone(newParticipant.status)) {
						card.doneCount += 1;
					}
				}
				// 将该卡片移到最前（新动态置顶）
				if (existingCardIndex > 0) {
					cards.splice(existingCardIndex, 1);
					cards.unshift(card);
				}
			} else {
				if (selectedCategory === 'all' || selectedCategory === res.todo.category) {
					cards.unshift({
						topicHash: res.todo.topicHash,
						content: res.todo.content,
						category: res.todo.category,
						isMultiplayer: false,
						totalParticipants: 1,
						doneCount: isStatusDone(res.todo.status) ? 1 : 0,
						participants: [newParticipant]
					});
					totalCards += 1;
				}
			}

			newContent = '';
			newNote = '';
			showCreateDrawer = false;
			showToast('Published successfully!');
		} catch (err) {
			console.error('Create todo failed:', err);
			showToast('Failed to publish, please check your input and try again');
		} finally {
			isSubmitting = false;
		}
	}

	// ---------------------------------------------------------------------------
	// 交互动作：一键加入一起做（纯乐观更新）
	// ---------------------------------------------------------------------------
	async function handleJoinTopic(card: DailyCard) {
		const email = userStore.email || PRESET_USERS[0].email;
		try {
			const res = await api.createTodo({
				email,
				content: card.content,
				category: card.category,
				startDate: selectedDate
			});

			if (res.author) {
				userStore.updateUserFromProfile(res.author);
			}

			const myParticipant: CardParticipant = {
				todoId: res.todo.id,
				shortId: res.todo.shortId,
				status: res.todo.status,
				createdAt: res.todo.createdAt,
				isMe: true,
				user: {
					id: res.author?.id || userStore.id || '',
					nickname: res.author?.nickname || userStore.nickname,
					handle: res.author?.handle || userStore.handle,
					avatar: res.author?.avatar || userStore.avatar
				}
			};

			const existingPIdx = card.participants.findIndex((p) => p.todoId === myParticipant.todoId);
			if (existingPIdx === -1) {
				card.participants.unshift(myParticipant);
				card.totalParticipants = card.participants.length;
				card.isMultiplayer = card.totalParticipants > 1;
				if (isStatusDone(myParticipant.status)) {
					card.doneCount += 1;
				}
			}

			showToast(`Successfully joined "${card.content}"!`);
		} catch (err) {
			console.error('Join topic failed:', err);
			showToast('Failed to join, please try again');
		}
	}

	// ---------------------------------------------------------------------------
	// 交互动作：状态流转变更 (Status Transitions)
	// ---------------------------------------------------------------------------
	async function handleStatusTransition(card: DailyCard, participant: CardParticipant, targetStatus: TodoStatus) {
		if (participant.status === targetStatus) {
			openStatusMenuTodoId = null;
			return;
		}

		const email = userStore.email || PRESET_USERS[0].email;
		const oldStatus = participant.status;

		// 乐观更新
		participant.status = targetStatus;
		if (isStatusDone(targetStatus) && !isStatusDone(oldStatus)) {
			card.doneCount += 1;
		} else if (isStatusDone(oldStatus) && !isStatusDone(targetStatus)) {
			card.doneCount = Math.max(0, card.doneCount - 1);
		}
		openStatusMenuTodoId = null;

		try {
			await api.updateTodo(participant.todoId, {
				email,
				status: targetStatus
			});
			showToast(`Status updated to: ${getStatusConfig(targetStatus).label}`);
		} catch (err) {
			console.error('Failed to transition status:', err);
			// 回滚
			participant.status = oldStatus;
			if (isStatusDone(targetStatus) && !isStatusDone(oldStatus)) card.doneCount = Math.max(0, card.doneCount - 1);
			else if (isStatusDone(oldStatus) && !isStatusDone(targetStatus)) card.doneCount += 1;
			showToast('Failed to update status, please try again');
		}
	}

	// 获取某条待办当前可流转的目标状态列表
	function getAvailableNextStatuses(currentStatus: TodoStatus): TodoStatus[] {
		const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
		// 如果是 done 或 abandoned，也允许重置为 pending 便于 demo 反复演练
		if (isStatusDone(currentStatus) || isStatusAbandoned(currentStatus)) {
			return ALL_TODO_STATUSES.filter((s) => s !== currentStatus) as TodoStatus[];
		}
		return allowed;
	}

	// ---------------------------------------------------------------------------
	// 交互动作：全功能编辑与分流（零网络请求，秒级弹窗）
	// ---------------------------------------------------------------------------
	function openEditDialog(card: DailyCard, participant: CardParticipant) {
		openStatusMenuTodoId = null;

		activeEditModal = {
			card,
			todo: participant,
			content: card.content,
			category: card.category || 'other',
			status: participant.status,
			note: '',
			isNotePublic: true,
			startDate: selectedDate,
			dueDate: '',
			participantCount: card.totalParticipants
		};
	}

	async function handleSaveEdit() {
		if (!activeEditModal || isSavingEdit) return;
		if (!activeEditModal.content.trim()) {
			showToast('Todo content cannot be empty');
			return;
		}

		const { card, todo, content, category, status, note, isNotePublic, startDate, dueDate } = activeEditModal;
		const email = userStore.email || PRESET_USERS[0].email;
		const isTopicChanged =
			content.trim() !== card.content.trim() ||
			category !== (card.category || 'other');
		isSavingEdit = true;

		try {
			const res = await api.updateTodo(todo.todoId, {
				email,
				content: content.trim(),
				category,
				status,
				note: note.trim() || null,
				isNotePublic,
				startDate: startDate || undefined,
				dueDate: dueDate || null
			});

			// 乐观更新状态
			todo.status = res.todo.status;

			if (isTopicChanged) {
				if (card.totalParticipants > 1) {
					// 移出原卡片
					card.participants = card.participants.filter((p) => p.todoId !== todo.todoId);
					card.totalParticipants = card.participants.length;
					card.isMultiplayer = card.totalParticipants > 1;
					if (isStatusDone(todo.status)) {
						card.doneCount = Math.max(0, card.doneCount - 1);
					}

					// 检查是否有已有卡片匹配新 topicHash
					const targetCard = cards.find((c) => c.topicHash === res.todo.topicHash);
					if (targetCard) {
						targetCard.participants.unshift({ ...todo });
						targetCard.totalParticipants = targetCard.participants.length;
						targetCard.isMultiplayer = targetCard.totalParticipants > 1;
						if (isStatusDone(res.todo.status)) targetCard.doneCount += 1;
					} else {
						cards.unshift({
							topicHash: res.todo.topicHash,
							content: res.todo.content,
							category: res.todo.category,
							isMultiplayer: false,
							totalParticipants: 1,
							doneCount: isStatusDone(res.todo.status) ? 1 : 0,
							participants: [{ ...todo }]
						});
						totalCards += 1;
					}
				} else {
					// 原卡片仅自己一人，原地更新
					card.content = res.todo.content;
					card.category = res.todo.category;
					card.topicHash = res.todo.topicHash;
				}
			} else {
				const doneParticipants = card.participants.filter((p) => isStatusDone(p.status)).length;
				card.doneCount = doneParticipants;
			}

			showToast('Changes saved!');
			activeEditModal = null;
		} catch (err) {
			console.error('Failed to update todo:', err);
			showToast('Failed to save, please check params and try again');
		} finally {
			isSavingEdit = false;
		}
	}

	function toggleExpandCard(topicHash: string) {
		expandedTopicHashes[topicHash] = !expandedTopicHashes[topicHash];
	}

	// ---------------------------------------------------------------------------
	// 生命周期挂载
	// ---------------------------------------------------------------------------
	onMount(async () => {
		const initialEmail = userStore.email || PRESET_USERS[0].email;
		await switchUserByEmail(initialEmail);
	});
</script>

<div class="min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans antialiased selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900">
	<!-- Toast Message -->
	{#if toastMessage}
		<div class="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-zinc-900 bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-lg dark:border-zinc-100 dark:bg-white dark:text-zinc-900 animate-in fade-in slide-in-from-top-2 duration-200">
			{toastMessage}
		</div>
	{/if}

	<!-- Header -->
	<header class="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/95 dark:border-zinc-800/80 dark:bg-zinc-950/95 backdrop-blur-md">
		<div class="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 sm:px-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
						<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M9 12l2.5 2.5L18 8" />
							<path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.75 1 6.4 2.6" />
						</svg>
					</div>
					<div>
						<div class="flex items-center gap-2">
							<h1 class="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">ShowTodo Demo</h1>
							<span class="rounded-full bg-zinc-200/70 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">Interactive Sandbox</span>
						</div>
						<p class="text-[11px] text-zinc-500 dark:text-zinc-400">Content Addressing · Status Machine · Forking · Collaborative</p>
					</div>
				</div>

				<!-- Identity Display -->
				<div class="flex items-center gap-2">
					<Avatar
						src={userStore.avatar}
						name={userStore.nickname}
						size="sm"
					/>
					<div class="hidden text-right sm:block">
						<div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{userStore.nickname}</div>
						<div class="font-mono text-[10px] text-zinc-400">@{userStore.handle}</div>
					</div>
				</div>
			</div>

			<!-- Identity Switcher Controls -->
			<div class="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-2 text-xs dark:border-zinc-800/60">
				<div class="flex items-center gap-1.5 overflow-x-auto">
					<span class="text-zinc-400 text-[11px] whitespace-nowrap">Presets:</span>
					{#each PRESET_USERS as u}
						<button
							onclick={() => switchUserByEmail(u.email)}
							disabled={isSyncingUser}
							class="rounded-md px-2.5 py-1 text-xs font-medium transition-all {userStore.email === u.email ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'}"
						>
							{u.nickname}
						</button>
					{/each}
				</div>

				<!-- Custom email switcher -->
				<form
					onsubmit={(e) => { e.preventDefault(); if (customEmailInput.trim()) { switchUserByEmail(customEmailInput); customEmailInput = ''; } }}
					class="flex items-center gap-1"
				>
					<input
						type="email"
						bind:value={customEmailInput}
						placeholder="Enter any email to switch..."
						class="h-7 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-white"
					/>
					<button
						type="submit"
						disabled={!customEmailInput.trim() || isSyncingUser}
						class="h-7 rounded-md border border-zinc-900 bg-zinc-900 px-2 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40 dark:border-white dark:bg-white dark:text-zinc-900"
					>
						Switch
					</button>
				</form>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-3xl px-4 py-6 sm:px-6">
		<!-- 1. Top Controls: Date and Scope Filters -->
		<div class="mb-6 flex flex-col gap-4 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
			<!-- Date Switcher -->
			<div class="flex items-center gap-2">
				<button
					onclick={() => shiftDate(-1)}
					class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
					aria-label="Previous day"
				>
					<Icon icon="lucide:chevron-left" class="h-4 w-4" />
				</button>

				<div class="flex items-center gap-2 font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-200">
					<Icon icon="lucide:calendar" class="h-4 w-4 text-zinc-400" />
					<span>{selectedDate}</span>
					{#if selectedDate === getTodayString()}
						<span class="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white dark:bg-white dark:text-zinc-900">Today</span>
					{/if}
				</div>

				<button
					onclick={() => shiftDate(1)}
					class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
					aria-label="Next day"
				>
					<Icon icon="lucide:chevron-right" class="h-4 w-4" />
				</button>
			</div>

			<!-- Scope Switcher -->
			<div class="flex items-center gap-2">
				<button
					onclick={() => { onlyMine = false; loadData(); }}
					class="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition {!onlyMine ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}"
				>
					Global Feed
				</button>
				<button
					onclick={() => { onlyMine = true; loadData(); }}
					class="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition {onlyMine ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}"
				>
					<Icon icon="lucide:user" class="h-3.5 w-3.5" />
					<span>Only Mine</span>
				</button>
			</div>
		</div>

		<!-- 2. Category Tabs -->
		<div class="mb-5 flex gap-1.5 overflow-x-auto pb-1 text-xs">
			{#each CATEGORY_TABS as tab}
				<button
					onclick={() => { selectedCategory = tab.id; loadData(); }}
					class="rounded-full px-3 py-1 font-medium transition whitespace-nowrap {selectedCategory === tab.id ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs' : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'}"
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<!-- 3. Create Todo Entry -->
		<div class="mb-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
			<form onsubmit={handleCreateTodo} class="space-y-3">
				<div class="flex items-center gap-2">
					<input
						type="text"
						bind:value={newContent}
						placeholder="Write today's goal (same text automatically groups)..."
						class="flex-1 border-0 bg-transparent px-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden dark:text-zinc-100"
					/>
					<select
						bind:value={newCategory}
						class="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 focus:outline-hidden"
					>
						<option value="study">Study</option>
						<option value="fitness">Fitness</option>
						<option value="dev">Dev</option>
						<option value="finance">Finance</option>
						<option value="life">Life</option>
						<option value="other">Other</option>
					</select>
					<button
						type="button"
						onclick={() => (showCreateDrawer = !showCreateDrawer)}
						class="flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
						title="Toggle note and advanced options"
					>
						<Icon icon={showCreateDrawer ? 'lucide:chevron-up' : 'lucide:file-text'} class="h-3.5 w-3.5" />
					</button>
					<button
						type="submit"
						disabled={!newContent.trim() || isSubmitting}
						class="flex items-center gap-1 rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
					>
						<Icon icon="lucide:plus" class="h-3.5 w-3.5" />
						<span>{isSubmitting ? 'Posting...' : 'Post'}</span>
					</button>
				</div>

				<!-- Advanced options drawer -->
				{#if showCreateDrawer}
					<div class="border-t border-zinc-100 pt-3 dark:border-zinc-800/80 space-y-2">
						<textarea
							bind:value={newNote}
							placeholder="Add note or check-in details (optional)..."
							rows="2"
							class="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
						></textarea>
						<div class="flex items-center justify-between text-xs text-zinc-500">
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={isNotePublic}
									class="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700"
								/>
								<span>Note publicly visible</span>
							</label>
							<span class="text-[11px] text-zinc-400">Date: {selectedDate}</span>
						</div>
					</div>
				{/if}
			</form>
		</div>

		<!-- 4. Stream List -->
		<div class="space-y-4">
			{#if loading && cards.length === 0}
				<div class="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 text-zinc-400 dark:border-zinc-800">
					<Icon icon="lucide:loader-2" class="h-6 w-6 animate-spin" />
					<span class="text-xs">Loading todos...</span>
				</div>
			{:else if cards.length === 0}
				<div class="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 p-6 text-center text-zinc-400 dark:border-zinc-800">
					<Icon icon="lucide:inbox" class="h-8 w-8 stroke-[1.5]" />
					<div class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
						{onlyMine ? 'You have no todos for this date' : 'No todo cards for this date'}
					</div>
					<p class="text-xs text-zinc-400 max-w-sm">
						{onlyMine ? 'Switch to "Global Feed" to discover others\' goals and join in, or post a new goal above.' : 'Write down the first goal of the day above!'}
					</p>
					{#if onlyMine}
						<button
							onclick={() => { onlyMine = false; loadData(); }}
							class="mt-2 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
						>
							View Global Feed
						</button>
					{/if}
				</div>
			{:else}
				{#each cards as card (card.topicHash)}
					{@const myParticipant = card.participants.find((p) => isCurrentParticipant(p))}
					{@const isExpanded = expandedTopicHashes[card.topicHash] ?? false}
					{@const isAllDone =
						card.isMultiplayer &&
						card.totalParticipants > 1 &&
						card.doneCount >= card.totalParticipants}

					<div
						class="group relative rounded-xl border p-5 shadow-xs transition-all {isAllDone
							? 'border-amber-300/90 dark:border-amber-500/70 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/70 dark:from-amber-950/30 dark:via-zinc-900 dark:to-amber-950/30 shadow-[0_0_15px_rgba(245,158,11,0.12)]'
							: 'border-zinc-200/80 bg-white hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900 dark:hover:border-zinc-700'}"
					>
						<!-- Card Top: Category, Multiplayer badge, Progress -->
						<div class="mb-3 flex items-center justify-between text-xs">
							<div class="flex items-center gap-2">
								{#if card.category}
									<span class="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
										#{card.category}
									</span>
								{/if}

								{#if isAllDone}
									<span class="flex items-center gap-1 rounded bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-2 py-0.5 text-[11px] font-bold text-amber-950 shadow-xs animate-in zoom-in-90">
										<Icon icon="lucide:trophy" class="h-3 w-3" />
										<span>All Completed ({card.totalParticipants})</span>
									</span>
								{:else if card.isMultiplayer}
									<span class="flex items-center gap-1 rounded bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-white dark:text-zinc-900">
										<Icon icon="lucide:users" class="h-3 w-3" />
										<span>{card.totalParticipants} joined</span>
									</span>
								{:else}
									<span class="rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-400 dark:border-zinc-800">
										Solo
									</span>
								{/if}
							</div>

							<!-- Progress -->
							<div class="flex items-center gap-2 font-mono text-xs {isAllDone ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-zinc-400'}">
								<span>{card.doneCount}/{card.totalParticipants} completed</span>
								<div class="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
									<div
										class="h-full transition-all duration-300 {isAllDone ? 'bg-gradient-to-r from-amber-400 to-yellow-300' : 'bg-zinc-900 dark:bg-white'}"
										style="width: {card.totalParticipants > 0 ? (card.doneCount / card.totalParticipants) * 100 : 0}%"
									></div>
								</div>
							</div>
						</div>

						<!-- Card Content and Action -->
						<div class="mb-4 flex items-start justify-between gap-4">
							<h3 class="text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-100 {isStatusDone(myParticipant?.status) ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}">
								{card.content}
							</h3>

							<!-- Action area -->
							<div class="flex items-center gap-2 shrink-0">
								{#if myParticipant}
									{@const currentConfig = getStatusConfig(myParticipant.status)}
									<!-- Status Selector -->
									<div class="relative">
										<button
											onclick={() => (openStatusMenuTodoId = openStatusMenuTodoId === myParticipant.todoId ? null : myParticipant.todoId)}
											class="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition {isStatusDone(myParticipant.status) ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900' : isStatusInProgress(myParticipant.status) ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white' : isStatusAbandoned(myParticipant.status) ? 'border-zinc-300 bg-zinc-100 text-zinc-500 line-through dark:border-zinc-700 dark:bg-zinc-800' : 'border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}"
										>
											<Icon icon={currentConfig.icon} class="h-3.5 w-3.5" />
											<span>{currentConfig.label}</span>
											<Icon icon="lucide:chevron-down" class="h-3 w-3 opacity-60" />
										</button>

										<!-- Dropdown menu -->
										{#if openStatusMenuTodoId === myParticipant.todoId}
											<div class="absolute right-0 top-full mt-1.5 z-40 w-36 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-150">
												<div class="px-2 py-1 text-[10px] font-semibold text-zinc-400">Change Status</div>
												{#each TODO_STATUSES as st}
													{@const isCurrent = st.id === myParticipant.status}
													<button
														onclick={() => handleStatusTransition(card, myParticipant, st.id)}
														class="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs transition {isCurrent ? 'bg-zinc-100 font-bold text-zinc-900 dark:bg-zinc-800 dark:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200'}"
													>
														<div class="flex items-center gap-1.5">
															<Icon icon={st.icon} class="h-3.5 w-3.5" />
															<span>{st.label}</span>
														</div>
														{#if isCurrent}
															<Icon icon="lucide:check" class="h-3 w-3" />
														{/if}
													</button>
												{/each}
											</div>
										{/if}
									</div>

									<!-- Edit Button -->
									<button
										onclick={() => openEditDialog(card, myParticipant)}
										class="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
										title="Edit todo details and note"
									>
										<Icon icon="lucide:edit-3" class="h-3.5 w-3.5" />
										<span>Edit</span>
									</button>
								{:else}
									<!-- Join Topic Button -->
									<button
										onclick={() => handleJoinTopic(card)}
										class="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-xs"
									>
										<Icon icon="lucide:user-plus" class="h-3.5 w-3.5" />
										<span>Join</span>
									</button>
								{/if}
							</div>
						</div>

						<!-- Card Bottom: Participants and Details -->
						<div class="border-t border-zinc-100 pt-3 dark:border-zinc-800/60">
							<div class="flex items-center justify-between">
								<!-- Participant Avatars -->
								<div class="flex flex-wrap items-center gap-2">
									{#each card.participants as p (p.todoId)}
										{@const isMe = isCurrentParticipant(p)}
										<div class="flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-zinc-50/80 px-2.5 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-800/60 {isMe ? 'ring-1 ring-zinc-900 dark:ring-white bg-zinc-100 dark:bg-zinc-800' : ''}">
											<Avatar
												src={p.user.avatar}
												name={p.user.nickname}
												size="xs"
												goldBadge={isAllDone}
												class="h-4.5 w-4.5"
											/>
											<span class="text-xs font-medium text-zinc-800 dark:text-zinc-200">
												{p.user.nickname}{isMe ? ' (You)' : ''}
											</span>
											{#if isStatusDone(p.status)}
												<span class="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" title="Completed">
													<Icon icon="lucide:check" class="h-2.5 w-2.5 stroke-[3]" />
												</span>
											{:else if isStatusInProgress(p.status)}
												<span class="h-2 w-2 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-pulse" title="In Progress"></span>
											{:else if isStatusAbandoned(p.status)}
												<Icon icon="lucide:x" class="h-2.5 w-2.5 text-zinc-400 stroke-[3]" />
											{:else}
												<span class="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" title="Pending"></span>
											{/if}
										</div>
									{/each}
								</div>

								<!-- Expand/Collapse Button -->
								{#if card.participants.length > 0}
									<button
										onclick={() => toggleExpandCard(card.topicHash)}
										class="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
									>
										<span>{isExpanded ? 'Collapse' : 'Details'}</span>
										<Icon icon={isExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'} class="h-3 w-3" />
									</button>
								{/if}
							</div>

							<!-- Expanded participant log -->
							{#if isExpanded}
								<div class="mt-3 space-y-2 rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-800/40">
									<div class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Participant Log</div>
									{#each card.participants as p (p.todoId)}
										{@const isMe = isCurrentParticipant(p)}
										<div class="flex items-center justify-between border-b border-zinc-200/40 pb-2 last:border-0 last:pb-0 dark:border-zinc-700/40">
											<div class="flex items-center gap-2">
												<Avatar
													src={p.user.avatar}
													name={p.user.nickname}
													size="xs"
													class="h-6 w-6"
												/>
												<div>
													<div class="font-medium text-zinc-800 dark:text-zinc-200">
														{p.user.nickname} <span class="font-mono text-[10px] text-zinc-400">@{p.user.handle}</span>
														{#if isMe}<span class="ml-1 rounded bg-zinc-900 px-1 py-0.2 text-[9px] text-white dark:bg-white dark:text-zinc-900">You</span>{/if}
													</div>
													<div class="text-[10px] text-zinc-400">
														Joined: {p.createdAt ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
													</div>
												</div>
											</div>

											<div class="flex items-center gap-2">
												<span class="rounded px-2 py-0.5 text-[10px] font-semibold {isStatusDone(p.status) ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : isStatusInProgress(p.status) ? 'border border-zinc-900 text-zinc-900 dark:border-white dark:text-white' : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'}">
													{getStatusConfig(p.status).label}
												</span>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</main>

	<!-- 5. Edit Modal -->
	{#if activeEditModal}
		{@const isContentOrCategoryChanged =
			activeEditModal.content.trim() !== activeEditModal.card.content.trim() ||
			activeEditModal.category !== (activeEditModal.card.category || 'other')}
		{@const isMultiplayerTopic = activeEditModal.participantCount > 1}

		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
			<div class="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 my-8">
				<div class="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
					<div>
						<h4 class="text-base font-bold text-zinc-900 dark:text-zinc-100">Edit Todo Details</h4>
						<p class="text-xs text-zinc-400">Modify content, category, status, and check-in note</p>
					</div>
					<button
						onclick={() => (activeEditModal = null)}
						class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
					>
						<Icon icon="lucide:x" class="h-4 w-4" />
					</button>
				</div>

				<!-- Fork warning notice -->
				{#if isMultiplayerTopic && isContentOrCategoryChanged}
					<div class="mb-4 rounded-xl border border-zinc-900/20 bg-zinc-50 p-3.5 text-xs leading-relaxed text-zinc-700 dark:border-white/20 dark:bg-zinc-800/60 dark:text-zinc-300 animate-in fade-in duration-150">
						<div class="flex items-start gap-2">
							<Icon icon="lucide:info" class="h-4 w-4 shrink-0 text-zinc-900 dark:text-white mt-0.5" />
							<div>
								There are currently <strong class="font-bold text-zinc-900 dark:text-white">{activeEditModal.participantCount}</strong> participants collaborating on this goal.
								Modifying text or category will <strong>fork into your own independent todo and leave this group</strong>.
							</div>
						</div>
					</div>
				{/if}

				<div class="space-y-4 text-xs">
					<!-- Content -->
					<div>
						<label for="edit-content" class="mb-1.5 block font-semibold text-zinc-700 dark:text-zinc-300">Content</label>
						<input
							id="edit-content"
							type="text"
							bind:value={activeEditModal.content}
							class="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-white"
						/>
					</div>

					<!-- Category & Status -->
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="edit-cat" class="mb-1.5 block font-semibold text-zinc-700 dark:text-zinc-300">Category</label>
							<select
								id="edit-cat"
								bind:value={activeEditModal.category}
								class="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
							>
								<option value="study">Study</option>
								<option value="fitness">Fitness</option>
								<option value="dev">Dev</option>
								<option value="finance">Finance</option>
								<option value="life">Life</option>
								<option value="other">Other</option>
							</select>
						</div>

						<div>
							<label for="edit-status" class="mb-1.5 block font-semibold text-zinc-700 dark:text-zinc-300">Status</label>
							<select
								id="edit-status"
								bind:value={activeEditModal.status}
								class="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
							>
								<option value="pending">Pending</option>
								<option value="in_progress">In Progress</option>
								<option value="done">Completed</option>
								<option value="abandoned">Abandoned</option>
							</select>
						</div>
					</div>

					<!-- Dates -->
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="edit-start-date" class="mb-1.5 block font-semibold text-zinc-700 dark:text-zinc-300">Start Date</label>
							<input
								id="edit-start-date"
								type="date"
								bind:value={activeEditModal.startDate}
								class="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
							/>
						</div>

						<div>
							<label for="edit-due-date" class="mb-1.5 block font-semibold text-zinc-700 dark:text-zinc-300">Due Date (Optional)</label>
							<input
								id="edit-due-date"
								type="date"
								bind:value={activeEditModal.dueDate}
								class="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
							/>
						</div>
					</div>

					<!-- Note -->
					<div>
						<div class="mb-1.5 flex items-center justify-between">
							<label for="edit-note" class="font-semibold text-zinc-700 dark:text-zinc-300">Personal Note / Summary</label>
							<label class="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-500">
								<input
									type="checkbox"
									bind:checked={activeEditModal.isNotePublic}
									class="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
								/>
								<span>Publicly visible</span>
							</label>
						</div>
						<textarea
							id="edit-note"
							bind:value={activeEditModal.note}
							rows="3"
							placeholder="Record progress thoughts, links, or next steps..."
							class="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
						></textarea>
					</div>
				</div>

				<div class="mt-6 flex justify-end gap-2.5 border-t border-zinc-100 pt-4 dark:border-zinc-800 text-xs">
					<button
						onclick={() => (activeEditModal = null)}
						class="rounded-lg border border-zinc-200 px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
					>
						Cancel
					</button>
					<button
						onclick={handleSaveEdit}
						disabled={!activeEditModal.content.trim() || isSavingEdit}
						class="rounded-lg bg-zinc-900 px-4 py-2 font-semibold text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-xs"
					>
						{isSavingEdit ? 'Saving...' : isMultiplayerTopic && isContentOrCategoryChanged ? 'Fork & Save' : 'Save Changes'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
