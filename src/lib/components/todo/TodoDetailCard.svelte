<script lang="ts">
	import type { Todo, TodoStatus, ReactionEmoji, CategoryId } from '$lib/types/todo';
	import { TODO_STATUS } from '$lib/constants/status';
	import { CATEGORIES } from '$lib/constants/categories';
	import { formatRelativeTime, formatScheduleRange } from '$lib/utils/format';
	import { toast } from '$lib/stores/toast.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import CategoryBadge from '$lib/components/todo/CategoryBadge.svelte';
	import TodoCheckbox from '$lib/components/todo/TodoCheckbox.svelte';
	import TodoContent from '$lib/components/todo/TodoContent.svelte';
	import TodoReactionsBar from '$lib/components/todo/TodoReactionsBar.svelte';
	import TodoStatusDropdown from '$lib/components/todo/TodoStatusDropdown.svelte';
	import StreakBadge from '$lib/components/todo/recurrence/StreakBadge.svelte';
	import RecurrenceConfigSection from '$lib/components/todo/recurrence/RecurrenceConfigSection.svelte';
	import { api } from '$lib/services/api';
	import type { RecurrenceFrequency, RecurrenceStatus, RecurrenceEndCondition } from '$lib/constants/recurrence';
	import { POPOVER_PLACEMENT } from '$lib/constants/popover';
	import Icon from '@iconify/svelte';

	interface Props {
		todo: Todo;
		isMine: boolean;
		topicParticipantCount?: number;
		hasJoined?: boolean;
		myJoinedTodo?: Todo | null;
		myJoinedStatus?: TodoStatus;
		isJoining?: boolean;
		onstatuschange?: (nextStatus: TodoStatus, e?: MouseEvent) => void;
		onreaction?: (emoji?: ReactionEmoji) => void;
		onsaveedit?: (data: {
			content: string;
			note?: string | null;
			category?: CategoryId | null;
			startDate?: string | null;
			dueDate?: string | null;
		}) => Promise<void>;
		ondelete?: () => Promise<void> | void;
		onabandon?: () => Promise<void> | void;
		onjoin?: () => Promise<void> | void;
		onmystatuschange?: (nextStatus: TodoStatus, e?: MouseEvent) => void;
		onlogprogress?: (data: { status: TodoStatus; note: string }) => Promise<void> | void;
		initialShowDeleteModal?: boolean;
		initialEditing?: boolean;
	}

	let {
		todo,
		isMine,
		topicParticipantCount = 0,
		hasJoined = false,
		myJoinedTodo,
		myJoinedStatus,
		isJoining = false,
		initialShowDeleteModal = false,
		initialEditing = false,
		onstatuschange,
		onreaction,
		onsaveedit,
		ondelete,
		onabandon,
		onjoin,
		onmystatuschange,
		onlogprogress
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let isEditing = $state(initialEditing);
	let editContent = $state('');
	let editNote = $state('');
	let editCategory = $state<CategoryId | null>(null);
	let editStartDate = $state('');
	let editDueDate = $state('');
	let activeStartQuick = $state<'now' | 'tomorrow' | 'nextMonday' | null>(null);
	let activeDueQuick = $state<'eod' | 'tomorrow' | 'nextWeek' | null>(null);
	let isSaving = $state(false);
	// svelte-ignore state_referenced_locally
	let showDeleteModal = $state(initialShowDeleteModal);
	let isDeleting = $state(false);
	let isAbandoning = $state(false);

	// 周期规则状态
	let isRecurring = $state(false);
	let recurrenceFrequency = $state<RecurrenceFrequency>('daily');
	let recurrenceInterval = $state(1);
	let recurrenceDaysOfWeek = $state([1, 2, 3, 4, 5]);
	let recurrenceDayOfMonth = $state(1);
	let recurrenceEndCondition = $state<RecurrenceEndCondition>('never');
	let recurrenceEndAfterOccurrences = $state(30);
	let recurrenceEndDate = $state('');
	let isTogglingRuleStatus = $state(false);
	let currentRuleStatus = $state<RecurrenceStatus | null>(null);
	let deleteRecurringMode = $state<'instance' | 'rule'>('instance');
	let cascadeDeleteHistory = $state(false);

	async function toggleRecurringRuleStatus() {
		if (!todo.recurringRuleId || isTogglingRuleStatus) return;
		const nextStatus: RecurrenceStatus = currentRuleStatus === 'active' ? 'paused' : 'active';
		isTogglingRuleStatus = true;
		try {
			const { rule } = await api.updateRecurringRuleStatus(todo.recurringRuleId, nextStatus);
			currentRuleStatus = rule.status;
			if (todo.recurringRule) {
				todo.recurringRule.status = rule.status;
			}
			toast.success(nextStatus === 'active' ? 'Recurring habit resumed' : 'Recurring habit paused');
		} catch {
			toast.error('Failed to update recurring rule status');
		} finally {
			isTogglingRuleStatus = false;
		}
	}

	function toDatetimeLocalValue(isoStr?: string | null): string {
		if (!isoStr) return '';
		try {
			const d = new Date(isoStr);
			if (isNaN(d.getTime())) return '';
			const year = d.getFullYear();
			const month = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			const hours = String(d.getHours()).padStart(2, '0');
			const minutes = String(d.getMinutes()).padStart(2, '0');
			return `${year}-${month}-${day}T${hours}:${minutes}`;
		} catch {
			return '';
		}
	}

	function resizeAction(node: HTMLTextAreaElement) {
		function resize() {
			node.style.height = 'auto';
			node.style.height = `${node.scrollHeight}px`;
		}
		resize();
		node.addEventListener('input', resize);
		return {
			destroy() {
				node.removeEventListener('input', resize);
			}
		};
	}

	function syncFromTodo() {
		editContent = todo.content;
		editNote = todo.note || '';
		editCategory = (todo.category as CategoryId) || null;
		editStartDate = toDatetimeLocalValue(todo.startDate);
		editDueDate = toDatetimeLocalValue(todo.dueDate);
		activeStartQuick = null;
		activeDueQuick = null;
		currentRuleStatus = todo.recurringRule?.status || null;
		isRecurring = Boolean(todo.recurringRuleId);
		recurrenceFrequency = todo.recurringRule?.frequency || 'daily';
		recurrenceInterval = todo.recurringRule?.interval || 1;
		recurrenceDaysOfWeek =
			todo.recurringRule?.daysOfWeek && todo.recurringRule.daysOfWeek.length > 0
				? [...todo.recurringRule.daysOfWeek]
				: [1, 2, 3, 4, 5];
		recurrenceDayOfMonth = todo.recurringRule?.dayOfMonth || 1;
		recurrenceEndCondition = todo.recurringRule?.endCondition || 'never';
		recurrenceEndAfterOccurrences = todo.recurringRule?.endAfterOccurrences || 30;
		recurrenceEndDate = todo.recurringRule?.endDate ? todo.recurringRule.endDate.split('T')[0] : '';
	}

	syncFromTodo();

	$effect(() => {
		if (!isEditing) {
			syncFromTodo();
		}
	});

	function startEditing() {
		syncFromTodo();
		isEditing = true;
	}

	function cancelEditing() {
		syncFromTodo();
		isEditing = false;
	}

	function setQuickStartDate(type: 'now' | 'tomorrow' | 'nextMonday') {
		if (activeStartQuick === type) {
			editStartDate = '';
			activeStartQuick = null;
			return;
		}
		activeStartQuick = type;
		const target = new Date();
		if (type === 'tomorrow') {
			target.setDate(target.getDate() + 1);
			target.setHours(9, 0, 0, 0);
		} else if (type === 'nextMonday') {
			const day = target.getDay();
			const diff = day === 0 ? 1 : 8 - day;
			target.setDate(target.getDate() + diff);
			target.setHours(9, 0, 0, 0);
		}
		const year = target.getFullYear();
		const month = String(target.getMonth() + 1).padStart(2, '0');
		const date = String(target.getDate()).padStart(2, '0');
		const hours = String(target.getHours()).padStart(2, '0');
		const minutes = String(target.getMinutes()).padStart(2, '0');
		editStartDate = `${year}-${month}-${date}T${hours}:${minutes}`;
	}

	function clearStartDate() {
		editStartDate = '';
		activeStartQuick = null;
	}

	function setQuickDueDate(type: 'eod' | 'tomorrow' | 'nextWeek') {
		if (activeDueQuick === type) {
			editDueDate = '';
			activeDueQuick = null;
			return;
		}
		activeDueQuick = type;
		const target = new Date();
		if (type === 'eod') {
			target.setHours(23, 59, 0, 0);
		} else if (type === 'tomorrow') {
			target.setDate(target.getDate() + 1);
			target.setHours(23, 59, 0, 0);
		} else if (type === 'nextWeek') {
			target.setDate(target.getDate() + 7);
			target.setHours(23, 59, 0, 0);
		}
		const year = target.getFullYear();
		const month = String(target.getMonth() + 1).padStart(2, '0');
		const date = String(target.getDate()).padStart(2, '0');
		editDueDate = `${year}-${month}-${date}T23:59`;
	}

	function clearDueDate() {
		editDueDate = '';
		activeDueQuick = null;
	}

	function clearAllTime() {
		editStartDate = '';
		editDueDate = '';
		activeStartQuick = null;
		activeDueQuick = null;
	}

	const isTimeInvalid = $derived.by(() => {
		if (editStartDate && editDueDate) {
			return new Date(editStartDate).getTime() > new Date(editDueDate).getTime();
		}
		return false;
	});

	async function handleSave() {
		const clean = editContent.trim();
		if (!clean || isSaving || isTimeInvalid) return;

		isSaving = true;
		try {
			await onsaveedit?.({
				content: clean,
				note: editNote.trim() || null,
				category: editCategory,
				startDate: editStartDate ? new Date(editStartDate).toISOString() : null,
				dueDate: editDueDate ? new Date(editDueDate).toISOString() : null
			});

			if (!todo.recurringRuleId && isRecurring) {
				try {
					const { rule } = await api.createRecurringRule({
						content: clean,
						note: editNote.trim() || undefined,
						category: editCategory || undefined,
						frequency: recurrenceFrequency,
						interval: recurrenceInterval,
						daysOfWeek: recurrenceFrequency === 'weekly' ? recurrenceDaysOfWeek : undefined,
						dayOfMonth: recurrenceFrequency === 'monthly' ? recurrenceDayOfMonth : undefined,
						endCondition: recurrenceEndCondition,
						endAfterOccurrences: recurrenceEndCondition === 'by_count' ? recurrenceEndAfterOccurrences : undefined,
						endDate: recurrenceEndCondition === 'by_date' && recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : undefined
					});
					todo.recurringRuleId = rule.id;
					todo.recurringRule = {
						id: rule.id,
						frequency: rule.frequency,
						interval: rule.interval,
						daysOfWeek: rule.daysOfWeek,
						dayOfMonth: rule.dayOfMonth,
						cronExpression: rule.cronExpression,
						endCondition: rule.endCondition,
						endAfterOccurrences: rule.endAfterOccurrences,
						endDate: rule.endDate,
						currentStreak: rule.currentStreak,
						maxStreak: rule.maxStreak ?? rule.currentStreak ?? 0,
						status: rule.status
					};
					currentRuleStatus = rule.status;
					toast.success('Successfully upgraded to recurring habit!');
				} catch (err) {
					console.error('Failed to create recurring rule:', err);
					toast.error('Todo updated, but failed to create recurring rule');
				}
			} else if (todo.recurringRuleId && isRecurring) {
				try {
					const { rule } = await api.updateRecurringRule(todo.recurringRuleId, {
						content: clean,
						note: editNote.trim() || undefined,
						category: editCategory || undefined,
						frequency: recurrenceFrequency,
						interval: recurrenceInterval,
						daysOfWeek: recurrenceFrequency === 'weekly' ? recurrenceDaysOfWeek : undefined,
						dayOfMonth: recurrenceFrequency === 'monthly' ? recurrenceDayOfMonth : undefined,
						endCondition: recurrenceEndCondition,
						endAfterOccurrences: recurrenceEndCondition === 'by_count' ? recurrenceEndAfterOccurrences : undefined,
						endDate: recurrenceEndCondition === 'by_date' && recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : undefined
					});
					todo.recurringRule = {
						id: rule.id,
						frequency: rule.frequency,
						interval: rule.interval,
						daysOfWeek: rule.daysOfWeek,
						dayOfMonth: rule.dayOfMonth,
						cronExpression: rule.cronExpression,
						endCondition: rule.endCondition,
						endAfterOccurrences: rule.endAfterOccurrences,
						endDate: rule.endDate,
						currentStreak: rule.currentStreak,
						maxStreak: rule.maxStreak ?? rule.currentStreak ?? 0,
						status: rule.status
					};
					currentRuleStatus = rule.status;
				} catch (err) {
					console.error('Failed to update recurring rule:', err);
					toast.error('Todo updated, but failed to update recurring rule');
				}
			}

			isEditing = false;
		} finally {
			isSaving = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isEditing) return;
		if (e.key === 'Escape') {
			cancelEditing();
		} else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			handleSave();
		}
	}

	async function handleAbandon() {
		isAbandoning = true;
		try {
			if (onabandon) {
				await onabandon();
			} else if (onstatuschange) {
				onstatuschange(TODO_STATUS.ABANDONED);
			}
			showDeleteModal = false;
			isEditing = false;
		} finally {
			isAbandoning = false;
		}
	}

	async function handleDelete() {
		isDeleting = true;
		try {
			if (todo.recurringRuleId && deleteRecurringMode === 'rule') {
				await api.deleteRecurringRule(todo.recurringRuleId, {
					deleteHistory: cascadeDeleteHistory
				});
				toast.success('Recurring series deleted');
			}
			await ondelete?.();
			showDeleteModal = false;
		} catch (err: any) {
			toast.error(`Delete failed: ${err?.message || 'Unknown error'}`);
		} finally {
			isDeleting = false;
		}
	}

	const scheduleText = $derived(formatScheduleRange(todo.startDate, todo.dueDate));

	// 领域派生状态：多人同行模块 (Domain Derived States for Multiplayer Section)
	const hasOtherParticipants = $derived((topicParticipantCount ?? 0) > 1);

	const shouldShowMultiplayer = $derived(
		Boolean(todo.topicHash && (!isMine || hasOtherParticipants))
	);

	const myTodoUrl = $derived(
		myJoinedTodo?.shortId || myJoinedTodo?.id
			? `/t/${myJoinedTodo.shortId || myJoinedTodo.id}`
			: null
	);

	const canShowMyTodoShortcut = $derived(
		Boolean(!isMine && hasJoined && hasOtherParticipants && myTodoUrl)
	);

	async function copyLink() {
		const url = window.location.href;
		try {
			await navigator.clipboard.writeText(url);
			toast.success('Todo link copied');
		} catch {
			toast.info(`Link: ${url}`);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="space-y-6 sm:space-y-7">
	<!-- Author header & status dropdown -->
	<div class="flex items-start justify-between gap-4 pb-1">
		<a
			href="/@{todo.author?.handle || todo.authorId}"
			class="flex items-center gap-3 group/author"
		>
			<Avatar
				src={todo.author?.avatar}
				name={todo.author?.nickname}
				alt={todo.author?.nickname}
				size="md"
			/>
			<div>
				<div class="flex items-center gap-1.5">
					<span
						class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover/author:text-zinc-600 dark:group-hover/author:text-zinc-300 transition-colors"
					>
						{todo.author?.nickname || 'Unknown'}
					</span>
					{#if isMine}
						<span
							class="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium"
						>
							You
						</span>
					{/if}
				</div>
				<div class="text-[11px] text-zinc-400 font-mono">
					@{todo.author?.handle || 'user'} · {formatRelativeTime(todo.createdAt)}
				</div>
			</div>
		</a>

		<!-- Right status dropdown -->
		<div class="flex items-center gap-2 shrink-0 pt-0.5">
			<TodoStatusDropdown
				status={todo.status}
				disabled={!isMine}
				placement={POPOVER_PLACEMENT.BOTTOM_END}
				todoTitle={todo.content}
				onchange={(next, e) => onstatuschange?.(next, e)}
				onlogprogress={isMine ? onlogprogress : undefined}
			/>
		</div>
	</div>

	<!-- 核心区域：浏览模式 vs 就地编辑模式 -->
	{#if isEditing}
		<!-- 【就地编辑模式】：正文、备注、分类保持浏览模式样式不变，时间使用“新建todo”modal里的样式 -->
		<div class="space-y-4 animate-in fade-in duration-150">
			<!-- 1. 正文就地编辑：保持浏览模式样式不变 (相同的 H1 大字号、粗体、无边框下划线) -->
			<div class="relative">
				<textarea
					bind:value={editContent}
					use:resizeAction
					placeholder="What are you working on? Todo content..."
					rows="1"
					required
					class="w-full resize-none bg-transparent p-0 border-0 border-b border-dashed border-zinc-300 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-hidden font-bold tracking-tight text-zinc-900 dark:text-zinc-100 text-lg sm:text-xl md:text-2xl leading-snug sm:leading-tight placeholder:text-zinc-400"
				></textarea>
			</div>

			<!-- 2. 备注就地编辑：保持浏览模式样式不变 (相同的左边框、圆角、背景和内边距) -->
			<div class="relative pl-3.5 sm:pl-4 py-2 border-l-2 border-zinc-400 dark:border-zinc-600 bg-zinc-50/80 dark:bg-zinc-900/60 rounded-r-xl pr-3">
				<textarea
					bind:value={editNote}
					use:resizeAction
					placeholder="Add background notes or reference links (optional)..."
					rows="2"
					class="w-full resize-none bg-transparent p-0 border-0 focus:outline-hidden text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
				></textarea>
			</div>

			<!-- 3. 分类就地编辑：保持浏览模式 CategoryBadge 药丸样式不变 -->
			<div class="flex items-center gap-1.5 flex-wrap pt-1">
				<span class="text-[11px] font-medium text-zinc-400 shrink-0 mr-1">Category:</span>
				{#each CATEGORIES as cat}
					{@const isSelected = editCategory === cat.id}
					<button
						type="button"
						onclick={() => (editCategory = isSelected ? null : cat.id)}
						class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all duration-150 cursor-pointer {isSelected
							? 'ring-2 ring-zinc-900 dark:ring-zinc-100 shadow-xs font-semibold scale-105'
							: 'opacity-50 hover:opacity-85 hover:scale-100'}"
						style="background-color: {cat.color}20; color: {cat.color};"
						title="Select category: {cat.name}"
					>
						<span class="h-1.5 w-1.5 rounded-full shrink-0" style="background-color: {cat.color};"></span>
						<span>{cat.name}</span>
					</button>
				{/each}
			</div>

			<!-- 4. 时间就地编辑：使用“新建todo”modal里的完整 Schedule 样式 -->
			<div class="p-3 sm:p-3.5 rounded-xl bg-zinc-50/90 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
				<!-- 卡片顶栏：标题与自包含的清空操作 -->
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
						<Icon icon="lucide:calendar" class="h-3.5 w-3.5 text-zinc-500" />
						<span>Schedule</span>
					</div>

					{#if editStartDate || editDueDate}
						<button
							type="button"
							onclick={clearAllTime}
							class="inline-flex items-center justify-center gap-1 h-6 px-2 rounded-lg text-[11px] text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
							title="Clear schedule"
							aria-label="Clear schedule"
						>
							<Icon icon="lucide:trash-2" class="h-3 w-3 shrink-0" />
							<span>Clear</span>
						</button>
					{/if}
				</div>

				<!-- 时间规划双栏输入区 (响应式网格) -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<!-- 左栏：开始时间 (快捷操作：Now / Tmr / Mon) -->
					<div class="space-y-1.5">
						<div class="flex items-center justify-between">
							<span class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Start Date</span>
							<div class="flex items-center gap-1">
								<button
									type="button"
									onclick={() => setQuickStartDate('now')}
									class="px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all duration-150 cursor-pointer {activeStartQuick === 'now'
										? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs font-semibold'
										: 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700/80'}"
									title="Set to now"
								>
									Now
								</button>
								<button
									type="button"
									onclick={() => setQuickStartDate('tomorrow')}
									class="px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all duration-150 cursor-pointer {activeStartQuick === 'tomorrow'
										? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs font-semibold'
										: 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700/80'}"
									title="Set to tomorrow"
								>
									Tmr
								</button>
								<button
									type="button"
									onclick={() => setQuickStartDate('nextMonday')}
									class="px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all duration-150 cursor-pointer {activeStartQuick === 'nextMonday'
										? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs font-semibold'
										: 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700/80'}"
									title="Set to next Monday"
								>
									Mon
								</button>
								{#if editStartDate}
									<button
										type="button"
										onclick={clearStartDate}
										class="text-[10px] text-red-500 hover:text-red-600 px-1 cursor-pointer leading-none flex items-center justify-center"
										title="Clear start date"
									>
										<Icon icon="lucide:x" class="h-3 w-3" />
									</button>
								{/if}
							</div>
						</div>
						<input
							type="datetime-local"
							bind:value={editStartDate}
							oninput={() => (activeStartQuick = null)}
							class="w-full bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-400 transition-all"
						/>
					</div>

					<!-- 右栏：截止时间 (快捷操作：EOD / Tmr / +1w) -->
					<div class="space-y-1.5">
						<div class="flex items-center justify-between">
							<span class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Due Date</span>
							<div class="flex items-center gap-1">
								<button
									type="button"
									onclick={() => setQuickDueDate('eod')}
									class="px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all duration-150 cursor-pointer {activeDueQuick === 'eod'
										? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs font-semibold'
										: 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700/80'}"
									title="Set to end of day"
								>
									EOD
								</button>
								<button
									type="button"
									onclick={() => setQuickDueDate('tomorrow')}
									class="px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all duration-150 cursor-pointer {activeDueQuick === 'tomorrow'
										? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs font-semibold'
										: 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700/80'}"
									title="Set to tomorrow"
								>
									Tmr
								</button>
								<button
									type="button"
									onclick={() => setQuickDueDate('nextWeek')}
									class="px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all duration-150 cursor-pointer {activeDueQuick === 'nextWeek'
										? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs font-semibold'
										: 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700/80'}"
									title="Set to 1 week from now"
								>
									+1w
								</button>
								{#if editDueDate}
									<button
										type="button"
										onclick={clearDueDate}
										class="text-[10px] text-red-500 hover:text-red-600 px-1 cursor-pointer leading-none flex items-center justify-center"
										title="Clear due date"
									>
										<Icon icon="lucide:x" class="h-3 w-3" />
									</button>
								{/if}
							</div>
						</div>
						<input
							type="datetime-local"
							bind:value={editDueDate}
							oninput={() => (activeDueQuick = null)}
							class="w-full bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-400 transition-all"
						/>
					</div>
				</div>

				{#if isTimeInvalid}
					<div class="text-[11px] text-red-500 dark:text-red-400 flex items-center gap-1">
						<Icon icon="lucide:alert-circle" class="h-3.5 w-3.5 shrink-0" />
						<span>Start date cannot be later than due date</span>
					</div>
				{/if}
			</div>

			<!-- 4.5. 周期规则设置 (Recurrence Configuration) -->
			<div class="space-y-3 pt-1">
				{#if todo.recurringRuleId}
					<div class="p-3 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2">
						<div class="flex items-center justify-between flex-wrap gap-2">
							<div class="flex items-center gap-2">
								<StreakBadge
									frequency={todo.recurringRule?.frequency || 'daily'}
									currentStreak={todo.recurringRule?.currentStreak ?? 0}
									maxStreak={todo.recurringRule?.maxStreak ?? 0}
									cycleIndex={todo.cycleIndex}
									size="sm"
								/>
								<span class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
									Recurring Habit Linked
								</span>
							</div>
							{#if isMine}
								{@const isRuleActive = (currentRuleStatus ?? todo.recurringRule?.status ?? 'active') === 'active'}
								<button
									type="button"
									onclick={toggleRecurringRuleStatus}
									disabled={isTogglingRuleStatus}
									class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors {isRuleActive
										? 'bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 dark:text-amber-300'
										: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300'}"
								>
									<Icon
										icon={isRuleActive ? 'lucide:pause-circle' : 'lucide:play-circle'}
										class="w-3.5 h-3.5"
									/>
									<span>{isRuleActive ? 'Pause Rule' : 'Resume Rule'}</span>
								</button>
							{/if}
						</div>
						<p class="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
							Materialized from a {todo.recurringRule?.frequency || 'daily'} recurring rule. Updating the recurrence rules below will apply to future scheduled occurrences of this habit.
						</p>
					</div>
				{/if}

				<div class={todo.recurringRuleId ? '' : 'pt-2 border-t border-zinc-100 dark:border-zinc-800'}>
					<RecurrenceConfigSection
						bind:isRecurring
						bind:frequency={recurrenceFrequency}
						bind:interval={recurrenceInterval}
						bind:daysOfWeek={recurrenceDaysOfWeek}
						bind:dayOfMonth={recurrenceDayOfMonth}
						bind:endCondition={recurrenceEndCondition}
						bind:endAfterOccurrences={recurrenceEndAfterOccurrences}
						bind:endDate={recurrenceEndDate}
					/>
				</div>
			</div>

			<!-- 5. 编辑操作栏 (取消 / 保存 / 删除) -->
			<div class="flex items-center justify-between pt-2">
				<button
					type="button"
					onclick={() => (showDeleteModal = true)}
					class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200/60 dark:hover:border-red-900/50 transition-colors cursor-pointer"
					title="Delete this todo"
				>
					<Icon icon="lucide:trash-2" class="w-3.5 h-3.5 shrink-0" />
					<span>Delete todo</span>
				</button>

				<div class="flex items-center gap-2">
					<Button
						type="button"
						variant="ghost"
						size="xs"
						onclick={cancelEditing}
						disabled={isSaving}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="primary"
						size="xs"
						loading={isSaving}
						disabled={isSaving || !editContent.trim() || isTimeInvalid}
						onclick={handleSave}
					>
						Save Changes
					</Button>
				</div>
			</div>
		</div>
	{:else}
		<!-- 【浏览模式】：正文、备注、分类（徽章）、时间、短链接 -->
		<div class="space-y-3">
			<TodoContent
				content={todo.content}
				status={todo.status}
				size="lg"
				as="h1"
			/>

			{#if todo.note}
				<div
					class="relative pl-3.5 sm:pl-4 py-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed break-words border-l-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900/40 rounded-r-xl pr-3"
				>
					{todo.note}
				</div>
			{/if}

			<!-- 分类与起止时间栏 (显著展示分类徽章与日程时间，杜绝分类未显示) -->
			<div class="flex items-center justify-between flex-wrap gap-2.5 pt-1 text-xs text-zinc-500 dark:text-zinc-400">
				<div class="flex items-center gap-2 flex-wrap">
					{#if todo.category}
						<a
							href="/?category={todo.category}"
							class="inline-block hover:opacity-85 transition-opacity"
							title="Filter todos by {todo.category}"
						>
							<CategoryBadge category={todo.category} />
						</a>
					{:else}
						<span
							class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/60 select-none"
							title="No category assigned"
						>
							<span class="h-1.5 w-1.5 rounded-full bg-zinc-400/50"></span>
							No category
						</span>
					{/if}

					{#if todo.recurringRuleId}
						<StreakBadge
							frequency={todo.recurringRule?.frequency || 'daily'}
							currentStreak={todo.recurringRule?.currentStreak ?? 0}
							maxStreak={todo.recurringRule?.maxStreak ?? 0}
							cycleIndex={todo.cycleIndex}
							size="sm"
						/>
					{/if}

					{#if scheduleText}
						<span class="flex items-center gap-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
							<Icon icon="lucide:calendar" class="h-3.5 w-3.5 text-zinc-400 shrink-0" />
							<span>{scheduleText}</span>
						</span>
					{/if}
				</div>

				<div class="flex items-center gap-2">
					{#if isMine && todo.recurringRuleId}
						{@const isRuleActive = (currentRuleStatus ?? todo.recurringRule?.status ?? 'active') === 'active'}
						<button
							type="button"
							onclick={toggleRecurringRuleStatus}
							disabled={isTogglingRuleStatus}
							class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer {isRuleActive
								? 'text-zinc-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
								: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600'}"
							title={isRuleActive ? 'Pause recurring habit' : 'Resume recurring habit'}
						>
							<Icon
								icon={isRuleActive ? 'lucide:pause-circle' : 'lucide:play-circle'}
								class="w-3.5 h-3.5"
							/>
							<span>{isRuleActive ? 'Pause' : 'Paused (Resume)'}</span>
						</button>
					{/if}

					<button
						type="button"
						onclick={copyLink}
						class="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:underline cursor-pointer"
						title="Copy short link"
					>
						<Icon icon="lucide:link-2" class="h-3.5 w-3.5 text-zinc-400 shrink-0" />
						<span>{todo.shortId || todo.id.slice(0, 8)}</span>
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Reaction bar & actions (浏览模式下提供反应和编辑入口) -->
	{#if !isEditing}
		<div class="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
			<TodoReactionsBar
				todoId={todo.id}
				reactions={todo.reactions}
				myReactions={todo.myReactions}
				{isMine}
				onreact={onreaction}
				onedit={isMine ? startEditing : undefined}
			/>
		</div>
	{/if}

	<!-- Multiplayer / Trending section -->
	{#if shouldShowMultiplayer}
		<div
			class="p-4 rounded-2xl border transition-all space-y-3 {hasJoined
				? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/50'
				: hasOtherParticipants
					? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/50'
					: 'bg-zinc-50/80 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800'}"
		>
			<div class="flex items-center justify-between flex-wrap gap-3">
				<!-- Left: Trending info & link -->
				<div class="flex items-center gap-2.5 text-xs flex-wrap">
					{#if hasJoined}
						<span class="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-200">
							<Icon icon="lucide:check" class="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
							<span>In my list</span>
						</span>
						{#if hasOtherParticipants}
							<span class="text-emerald-600/80 dark:text-emerald-400/80">
								({topicParticipantCount} people doing this)
							</span>
						{/if}
					{:else if isMine}
						<div class="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
							<Icon icon="lucide:flame" class="h-4 w-4 text-orange-500 shrink-0" />
							<span>
								<strong>{topicParticipantCount}</strong> other people are also doing this todo!
							</span>
						</div>
					{:else}
						<div class="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
							{#if hasOtherParticipants}
								<Icon icon="lucide:flame" class="h-4 w-4 text-orange-500 shrink-0" />
								<span>
									<strong>{topicParticipantCount}</strong> people are doing this todo
								</span>
							{:else}
								<Icon icon="lucide:sprout" class="h-4 w-4 text-emerald-500 shrink-0" />
								<span>No one else yet.</span>
							{/if}
						</div>
					{/if}

					{#if hasOtherParticipants || hasJoined}
						<a
							href="/trending/{todo.topicHash}"
							class="font-semibold text-xs transition-colors hover:underline shrink-0 {hasJoined
								? 'text-emerald-700 dark:text-emerald-300'
								: 'text-amber-700 dark:text-amber-300'}"
						>
							See who's doing this →
						</a>
					{/if}

					{#if canShowMyTodoShortcut}
						<a
							href={myTodoUrl}
							class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-100/90 hover:bg-emerald-200/90 text-emerald-800 dark:bg-emerald-900/50 dark:hover:bg-emerald-900/80 dark:text-emerald-200 transition-all shadow-2xs shrink-0 cursor-pointer"
							title="View my todo"
						>
							<span>Mine</span>
							<Icon icon="lucide:arrow-up-right" class="h-3 w-3" />
						</a>
					{/if}
				</div>

				<!-- Right: Action button / Check-in -->
				<div class="flex items-center gap-3">
					{#if hasJoined && myJoinedStatus}
						<div class="flex items-center gap-2 bg-white/80 dark:bg-zinc-900/80 py-1 px-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 shadow-2xs">
							<span class="text-xs text-zinc-500 dark:text-zinc-400">My Check-in:</span>
							<TodoCheckbox
								status={myJoinedStatus}
								isMine={true}
								size="sm"
								ontoggle={(next, e) => onmystatuschange?.(next, e)}
							/>
						</div>
					{:else if !isMine}
						<Button
							variant="primary"
							size="xs"
							loading={isJoining}
							onclick={onjoin}
							class="font-medium px-3 py-1.5 shadow-xs"
						>
							Add to my list
						</Button>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Delete Confirmation Modal -->
<Modal
	bind:open={showDeleteModal}
	size="sm"
	closeOnClickOutside={!isDeleting && !isAbandoning}
	closeOnEsc={!isDeleting && !isAbandoning}
>
	{#snippet header()}
		<div
			class="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40"
		>
			<div class="flex items-center gap-2.5">
				<div
					class="flex items-center justify-center h-8 w-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shadow-2xs"
				>
					<Icon icon="lucide:trash-2" class="w-4 h-4" />
				</div>
				<h3 class="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
					Delete this todo?
				</h3>
			</div>

			<button
				type="button"
				onclick={() => (showDeleteModal = false)}
				disabled={isDeleting || isAbandoning}
				class="inline-flex items-center justify-center h-7 w-7 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
				aria-label="Close dialog"
			>
				<Icon icon="lucide:x" class="w-4 h-4" />
			</button>
		</div>
	{/snippet}

	<div class="space-y-4">
		{#if todo.recurringRuleId}
			<!-- 周期性待办删除模式选择 (Recurring series deletion options) -->
			<div class="space-y-2.5">
				<p class="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200">
					This todo belongs to a recurring series. Select delete scope:
				</p>
				<div class="space-y-2">
					<label
						class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors {deleteRecurringMode === 'instance'
							? 'bg-zinc-100/90 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700'
							: 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800'}"
					>
						<input
							type="radio"
							name="delete_recurring_scope"
							value="instance"
							bind:group={deleteRecurringMode}
							class="mt-0.5 text-zinc-900 focus:ring-zinc-500"
						/>
						<div class="space-y-0.5">
							<span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
								This occurrence only {#if todo.cycleIndex}(#{todo.cycleIndex}){/if}
							</span>
							<p class="text-[11px] text-zinc-500 dark:text-zinc-400">
								Only removes this specific instance. The recurring series stays active and future occurrences will continue generating.
							</p>
						</div>
					</label>

					<label
						class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors {deleteRecurringMode === 'rule'
							? 'bg-red-50/70 dark:bg-red-950/30 border-red-300 dark:border-red-800'
							: 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800'}"
					>
						<input
							type="radio"
							name="delete_recurring_scope"
							value="rule"
							bind:group={deleteRecurringMode}
							class="mt-0.5 text-red-600 focus:ring-red-500"
						/>
						<div class="space-y-1 w-full">
							<span class="text-xs font-semibold text-red-700 dark:text-red-300">
								Entire recurring series (stop all future generation)
							</span>
							<p class="text-[11px] text-zinc-500 dark:text-zinc-400">
								Permanently deletes the recurring rule template. No more todos will be created, and future calendar projections will be cleared.
							</p>

							{#if deleteRecurringMode === 'rule'}
								<div class="pt-2 mt-2 border-t border-red-200/60 dark:border-red-900/40">
									<label class="flex items-center gap-2 cursor-pointer">
										<input
											type="checkbox"
											bind:checked={cascadeDeleteHistory}
											class="rounded border-red-300 text-red-600 focus:ring-red-500 text-xs"
										/>
										<span class="text-[11px] text-red-600 dark:text-red-400 font-medium">
											Also delete all past completed records (unchecked preserves your history and streak)
										</span>
									</label>
								</div>
							{/if}
						</div>
					</label>
				</div>
			</div>
		{:else}
			<p class="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
				This action is permanent and cannot be undone. All activity logs and reactions will be wiped.
			</p>
		{/if}

		<!-- 放弃引导说明 -->
		<div
			class="p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800/80 space-y-3"
		>
			<div class="flex items-start justify-between gap-2">
				<div class="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
					<Icon icon="lucide:lightbulb" class="w-3.5 h-3.5 text-amber-500 shrink-0" />
					<span>Not working on this anymore?</span>
				</div>
				<span
					class="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
				>
					Recommended
				</span>
			</div>

			<p class="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
				Marking it as abandoned preserves your history and public streak.
			</p>

			<button
				type="button"
				onclick={handleAbandon}
				disabled={isAbandoning || isDeleting}
				class="w-full inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 border border-zinc-200/90 dark:border-zinc-700 shadow-2xs transition-all duration-150 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
			>
				<Icon icon="lucide:archive" class="w-3.5 h-3.5 text-zinc-400" />
				<span>Mark as Abandoned instead</span>
			</button>
		</div>
	</div>

	{#snippet footer()}
		<Button
			type="button"
			variant="ghost"
			size="sm"
			onclick={() => (showDeleteModal = false)}
			disabled={isDeleting || isAbandoning}
		>
			Cancel
		</Button>
		<Button
			type="button"
			variant="danger"
			size="sm"
			loading={isDeleting}
			disabled={isAbandoning}
			onclick={handleDelete}
		>
			Delete
		</Button>
	{/snippet}
</Modal>
