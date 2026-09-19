<script lang="ts">
	import { untrack } from 'svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import type { CategoryId } from '$lib/types/todo';
	import { CATEGORIES } from '$lib/constants/categories';
	import { userStore } from '$lib/stores/user.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { api } from '$lib/services/api';
	import { todoMutations } from '$lib/stores/mutations.svelte';
	import { createTodoModalStore } from '$lib/stores/create-todo-modal.svelte';
	import Icon from '@iconify/svelte';

	let content = $state(createTodoModalStore.initialContent || '');
	let note = $state('');
	let isNoteOpen = $state(false);
	let isNotePublic = $state(true);
	let selectedCategory = $state<CategoryId | null>(createTodoModalStore.initialCategory || null);
	let startDate = $state(createTodoModalStore.initialStartDate || '');
	let dueDate = $state(createTodoModalStore.initialDueDate || '');
	let activeStartQuick = $state<'now' | 'tomorrow' | 'nextMonday' | null>(null);
	let activeDueQuick = $state<'eod' | 'tomorrow' | 'nextWeek' | null>(null);
	let isTimePlanningOpen = $state(Boolean(createTodoModalStore.initialStartDate || createTodoModalStore.initialDueDate));
	let inlineEmail = $state('');
	let isComposing = $state(false);
	let submitting = $state(false);
	let textareaRef = $state<HTMLTextAreaElement | null>(null);

	// 使用 wasOpen 追踪，只在弹窗从关闭变为打开的那一刻初始化一次，避免用户输入时被 effect 意外重置
	let wasOpen = false;
	$effect(() => {
		const isOpen = createTodoModalStore.open;
		if (isOpen && !wasOpen) {
			wasOpen = true;
			untrack(() => {
				content = createTodoModalStore.initialContent || '';
				selectedCategory = createTodoModalStore.initialCategory || null;
				startDate = createTodoModalStore.initialStartDate || '';
				dueDate = createTodoModalStore.initialDueDate || '';
				activeStartQuick = null;
				activeDueQuick = null;
				note = '';
				isNoteOpen = false;
				isNotePublic = true;
				inlineEmail = '';
				isTimePlanningOpen = Boolean(startDate || dueDate);

				setTimeout(() => {
					textareaRef?.focus();
				}, 50);
			});
		} else if (!isOpen) {
			wasOpen = false;
		}
	});

	// 时间合法性校验：开始时间不得晚于截止时间
	const isTimeInvalid = $derived.by(() => {
		if (startDate && dueDate) {
			return new Date(startDate).getTime() > new Date(dueDate).getTime();
		}
		return false;
	});

	const hasTimeConfigured = $derived(Boolean(startDate || dueDate));

	function formatDisplayDateTime(val: string): string {
		if (!val) return '';
		try {
			const d = new Date(val);
			if (isNaN(d.getTime())) return val;
			const month = d.toLocaleDateString('en-US', { month: 'short' });
			const day = d.getDate();
			const h = String(d.getHours()).padStart(2, '0');
			const min = String(d.getMinutes()).padStart(2, '0');
			return `${month} ${day} ${h}:${min}`;
		} catch {
			return val;
		}
	}

	function handleClose() {
		createTodoModalStore.close();
	}

	function handleCompositionStart() {
		isComposing = true;
	}

	function handleCompositionEnd() {
		isComposing = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (isComposing || e.isComposing || e.keyCode === 229) {
			return;
		}

		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			handleSubmit();
		}
	}

	function setQuickStartDate(type: 'now' | 'tomorrow' | 'nextMonday') {
		if (activeStartQuick === type) {
			startDate = '';
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
		startDate = `${year}-${month}-${date}T${hours}:${minutes}`;
	}

	function clearStartDate() {
		startDate = '';
		activeStartQuick = null;
	}

	function setQuickDueDate(type: 'eod' | 'tomorrow' | 'nextWeek') {
		if (activeDueQuick === type) {
			dueDate = '';
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
		const day = String(target.getDate()).padStart(2, '0');
		dueDate = `${year}-${month}-${day}T23:59`;
	}

	function clearDueDate() {
		dueDate = '';
		activeDueQuick = null;
	}

	// 纯粹清空时间数据，绝不擅自折叠收起面板
	function clearAllTime() {
		startDate = '';
		dueDate = '';
		activeStartQuick = null;
		activeDueQuick = null;
	}

	async function handleSubmit() {
		const clean = content.trim();
		if (!clean || submitting || isTimeInvalid) return;

		// 若未登录或未绑定邮箱，先同步身份
		if (!userStore.email) {
			const cleanEmail = inlineEmail.trim().toLowerCase();
			if (!cleanEmail || !cleanEmail.includes('@')) {
				toast.info('Please enter a valid email to post');
				return;
			}

			submitting = true;
			try {
				const { user } = await api.syncUser(cleanEmail);
				userStore.updateUserFromProfile(user);
			} catch {
				userStore.setSession({
					email: cleanEmail,
					nickname: cleanEmail.split('@')[0],
					handle: cleanEmail.split('@')[0]
				});
			}
		}

		submitting = true;
		try {
			const res = await todoMutations.createTodo({
				content: clean,
				note: note.trim() || null,
				isNotePublic,
				category: selectedCategory,
				startDate: startDate ? new Date(startDate).toISOString() : null,
				dueDate: dueDate ? new Date(dueDate).toISOString() : null
			});

			if (res) {
				toast.success('Todo posted to square');
				handleClose();
			}
		} catch (error) {
			console.error('Failed to create todo from modal:', error);
		} finally {
			submitting = false;
		}
	}
</script>

<Modal
	bind:open={createTodoModalStore.open}
	size="md"
	class="p-0 overflow-hidden border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl rounded-2xl"
	onclose={handleClose}
>
	{#snippet header()}
		<!-- 顶栏：微型标题与操作提示 (各端高度与边距自适应) -->
		<div class="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
			<div class="flex items-center gap-2">
				<div class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
				<h3 class="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
					Create Public Todo
				</h3>
			</div>

			<div class="flex items-center gap-2">
				<span class="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 hidden sm:inline">
					ESC to close
				</span>
				<button
					type="button"
					onclick={handleClose}
					class="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
					aria-label="Close modal"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>
	{/snippet}

	<!-- 弹窗主要内容区 (移动端与桌面端自适应内边距) -->
	<div class="p-4 sm:p-5 space-y-3.5">
		<!-- 用户身份状态提示或未登录邮箱输入 -->
		<div class="flex items-center gap-2.5 sm:gap-3">
			<Avatar
				src={userStore.avatar}
				name={userStore.nickname || 'Guest'}
				size="sm"
				class="h-7 w-7 ring-1 ring-zinc-200 dark:ring-zinc-800 shrink-0"
			/>
			{#if userStore.email}
				<div class="text-xs text-zinc-500 dark:text-zinc-400 truncate">
					Posting as <span class="font-medium text-zinc-900 dark:text-zinc-200">{userStore.nickname}</span>
				</div>
			{:else}
				<div class="flex-1 min-w-0">
					<input
						type="email"
						bind:value={inlineEmail}
						placeholder="Enter your email to get started..."
						class="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all"
					/>
				</div>
			{/if}
		</div>

		<!-- 主文本输入框 (大号字阶，无边框留白设计) -->
		<div>
			<textarea
				bind:this={textareaRef}
				bind:value={content}
				onkeydown={handleKeydown}
				oncompositionstart={handleCompositionStart}
				oncompositionend={handleCompositionEnd}
				placeholder="What are you going to do today? Show your todo (e.g. Ship feature, read 30 mins)..."
				rows="3"
				class="w-full resize-none bg-transparent text-sm sm:text-base font-medium placeholder:font-normal placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100 focus:outline-hidden leading-relaxed py-1"
			></textarea>
		</div>

		<!-- 时间状态指示胶囊 (当已设置时间且面板收起时呈现，随时清晰展示时间，支持一键展开或一键移除) -->
		{#if hasTimeConfigured && !isTimePlanningOpen}
			<div class="flex items-center gap-2 animate-in fade-in duration-150">
				<button
					type="button"
					onclick={() => (isTimePlanningOpen = true)}
					class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer group"
					title="Expand schedule"
				>
					<svg class="h-3.5 w-3.5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					<span>
						{#if startDate && dueDate}
							{formatDisplayDateTime(startDate)} → {formatDisplayDateTime(dueDate)}
						{:else if startDate}
							Starts: {formatDisplayDateTime(startDate)}
						{:else}
							Due: {formatDisplayDateTime(dueDate)}
						{/if}
					</span>
				</button>

				<button
					type="button"
					onclick={clearAllTime}
					class="p-1 rounded-md text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
					title="Clear schedule"
					aria-label="Clear schedule"
				>
					<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		{/if}

		<!-- 展开的详细备注区 -->
		{#if isNoteOpen}
			<div class="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-900 animate-in fade-in duration-150">
				<textarea
					bind:value={note}
					placeholder="Add notes, reference links, action steps..."
					rows="2"
					class="w-full resize-none bg-transparent text-xs text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-400/80 dark:placeholder:text-zinc-600 focus:outline-hidden leading-relaxed py-1"
				></textarea>

				<!-- 隐私偏好微复选框 -->
				<div class="flex items-center justify-between text-xs pt-0.5 select-none">
					<button
						type="button"
						onclick={() => (isNotePublic = !isNotePublic)}
						class="group inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors focus:outline-hidden"
					>
						<div
							class="h-3.5 w-3.5 rounded-[4px] border transition-all duration-150 flex items-center justify-center shrink-0 {isNotePublic
								? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900 shadow-2xs'
								: 'border-zinc-300 dark:border-zinc-700 bg-transparent group-hover:border-zinc-400 dark:group-hover:border-zinc-600'}"
						>
							{#if isNotePublic}
								<svg class="h-2.5 w-2.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							{/if}
						</div>
						<span>Public note</span>
					</button>
				</div>
			</div>
		{/if}

		<!-- 起止时间（开始时间 & 截止时间）卡片 (自包含操作，清空不折叠) -->
		{#if isTimePlanningOpen}
			<div class="p-3 sm:p-3.5 rounded-xl bg-zinc-50/90 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-3 animate-in fade-in duration-150">
				<!-- 卡片顶栏：标题与自包含的收起、清空操作 -->
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
						<svg class="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<span>Schedule</span>
					</div>

					<div class="flex items-center gap-1.5 sm:gap-2">
						{#if hasTimeConfigured}
							<button
								type="button"
								onclick={clearAllTime}
								class="inline-flex items-center justify-center gap-1 h-7 px-2 rounded-lg text-[11px] text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
								title="Clear selected dates"
								aria-label="Clear dates"
							>
								<svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
								<span class="hidden sm:inline">Clear</span>
							</button>
						{/if}
						<button
							type="button"
							onclick={() => (isTimePlanningOpen = false)}
							class="inline-flex items-center justify-center gap-1 h-7 px-2 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-all cursor-pointer"
							title="Collapse schedule panel"
							aria-label="Collapse panel"
						>
							<svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
							</svg>
							<span class="hidden sm:inline">Collapse</span>
						</button>
					</div>
				</div>

				<!-- 时间规划双栏输入区 (响应式网格) -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<!-- 左栏：开始时间 (快捷操作采用国际化标准英文简写：Now / Tmr / Mon) -->
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
									title="Set to now (Now)"
									aria-pressed={activeStartQuick === 'now'}
								>
									Now
								</button>
								<button
									type="button"
									onclick={() => setQuickStartDate('tomorrow')}
									class="px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all duration-150 cursor-pointer {activeStartQuick === 'tomorrow'
										? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs font-semibold'
										: 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700/80'}"
									title="Set to tomorrow (Tomorrow)"
									aria-pressed={activeStartQuick === 'tomorrow'}
								>
									Tmr
								</button>
								<button
									type="button"
									onclick={() => setQuickStartDate('nextMonday')}
									class="px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all duration-150 cursor-pointer {activeStartQuick === 'nextMonday'
										? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs font-semibold'
										: 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700/80'}"
									title="Set to next Monday (Monday)"
									aria-pressed={activeStartQuick === 'nextMonday'}
								>
									Mon
								</button>
								{#if startDate}
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
							bind:value={startDate}
							oninput={() => (activeStartQuick = null)}
							class="w-full bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-400 transition-all"
						/>
					</div>

					<!-- 右栏：截止时间 (快捷操作采用专业英文简写：EOD / Tmr / +1w，彻底告别生硬的 DDL) -->
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
									title="Set to end of day (End of Day)"
									aria-pressed={activeDueQuick === 'eod'}
								>
									EOD
								</button>
								<button
									type="button"
									onclick={() => setQuickDueDate('tomorrow')}
									class="px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all duration-150 cursor-pointer {activeDueQuick === 'tomorrow'
										? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs font-semibold'
										: 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700/80'}"
									title="Set to tomorrow (Tomorrow)"
									aria-pressed={activeDueQuick === 'tomorrow'}
								>
									Tmr
								</button>
								<button
									type="button"
									onclick={() => setQuickDueDate('nextWeek')}
									class="px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all duration-150 cursor-pointer {activeDueQuick === 'nextWeek'
										? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs font-semibold'
										: 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700/80'}"
									title="Set to 1 week from now (+1 Week)"
									aria-pressed={activeDueQuick === 'nextWeek'}
								>
									+1w
								</button>
								{#if dueDate}
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
							bind:value={dueDate}
							oninput={() => (activeDueQuick = null)}
							class="w-full bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-400 transition-all"
						/>
					</div>
				</div>

				<!-- 校验错误提示 -->
				{#if isTimeInvalid}
					<div class="text-[11px] text-red-500 dark:text-red-400 flex items-center gap-1 animate-in fade-in">
						<svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
						<span>Start date cannot be later than due date</span>
					</div>
				{/if}
			</div>
		{/if}

		<!-- 分类药丸组与触发工具栏 (响应式空间布局) -->
		<div class="pt-2 border-t border-zinc-100 dark:border-zinc-900 space-y-2.5">
			<!-- 分类选择药丸 (移动端全宽平滑横向滚动，不换行挤压) -->
			<div class="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
				<span class="text-[11px] text-zinc-400 shrink-0 mr-0.5">Category:</span>
				{#each CATEGORIES as cat}
					{@const isSelected = selectedCategory === cat.id}
					<button
						type="button"
						onclick={() => (selectedCategory = isSelected ? null : cat.id)}
						class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer shrink-0 {isSelected
							? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
							: 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-100/70 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800'}"
					>
						<span class="h-1.5 w-1.5 rounded-full shrink-0" style="background-color: {cat.color};"></span>
						<span>{cat.name}</span>
					</button>
				{/each}
			</div>

			<!-- 辅助工具触发条 (各端空间尺寸与按钮图标适配) -->
			<div class="flex items-center justify-between pt-1 gap-2">
				<!-- 左侧工具组：按钮均搭配专业矢量图标，在小屏下以高质感图标呈现，大屏显示图文 -->
				<div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
					<!-- 展开/收起备注按钮 -->
					<button
						type="button"
						onclick={() => (isNoteOpen = !isNoteOpen)}
						class="inline-flex h-8 items-center justify-center gap-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-medium transition-all cursor-pointer {isNoteOpen || note.trim()
							? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs'
							: 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'}"
						title={isNoteOpen ? 'Collapse note' : 'Add note'}
						aria-label="Add note"
					>
						<svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
						<span class="hidden sm:inline">Note</span>
					</button>

					<!-- 展开/收起起止时间卡片按钮 -->
					<button
						type="button"
						onclick={() => (isTimePlanningOpen = !isTimePlanningOpen)}
						class="inline-flex h-8 items-center justify-center gap-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-medium transition-all cursor-pointer {isTimePlanningOpen || hasTimeConfigured
							? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs'
							: 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'}"
						title={isTimePlanningOpen ? 'Collapse schedule' : hasTimeConfigured ? 'Edit schedule' : 'Schedule'}
						aria-label="Schedule"
					>
						<svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<span class="hidden sm:inline">{isTimePlanningOpen ? 'Collapse' : hasTimeConfigured ? 'Edit schedule' : 'Schedule'}</span>
					</button>
				</div>

				<!-- 右侧操作组：取消与立即发布按钮 -->
				<div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
					<button
						type="button"
						onclick={handleClose}
						class="inline-flex h-8 items-center justify-center gap-1 px-2.5 sm:px-3 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
						title="Cancel (Esc)"
						aria-label="Cancel"
					>
						<svg class="h-3.5 w-3.5 shrink-0 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
						<span class="hidden sm:inline">Cancel</span>
					</button>

					<button
						type="button"
						onclick={handleSubmit}
						disabled={!content.trim() || submitting || isTimeInvalid || (!userStore.email && !inlineEmail.trim())}
						class="inline-flex h-8 items-center gap-1.5 rounded-xl bg-zinc-900 px-3 sm:px-4 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
						title="Post todo (⌘+Enter)"
					>
						<svg class="h-3.5 w-3.5 shrink-0 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
						</svg>
						<span>{submitting ? 'Posting...' : 'Post'}</span>
						<span class="text-[10px] opacity-60 font-mono hidden md:inline">⌘↵</span>
					</button>
				</div>
			</div>
		</div>
	</div>
</Modal>
