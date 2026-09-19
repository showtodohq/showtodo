<script lang="ts">
	import type { Todo, TodoStatus, ReactionEmoji } from '$lib/types/todo';
	import { TODO_STATUS } from '$lib/constants/status';
	import { getCategoryConfig } from '$lib/constants/categories';
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
		onsaveedit?: (content: string, note?: string | null) => Promise<void>;
		ondelete?: () => Promise<void> | void;
		onabandon?: () => Promise<void> | void;
		onjoin?: () => Promise<void> | void;
		onmystatuschange?: (nextStatus: TodoStatus, e?: MouseEvent) => void;
		onlogprogress?: (data: { status: TodoStatus; note: string }) => Promise<void> | void;
	}

	let {
		todo,
		isMine,
		topicParticipantCount = 0,
		hasJoined = false,
		myJoinedTodo,
		myJoinedStatus,
		isJoining = false,
		onstatuschange,
		onreaction,
		onsaveedit,
		ondelete,
		onabandon,
		onjoin,
		onmystatuschange,
		onlogprogress
	}: Props = $props();

	let isEditing = $state(false);
	let editContent = $state('');
	let editNote = $state('');
	let isSaving = $state(false);
	let showDeleteModal = $state(false);
	let isDeleting = $state(false);
	let isAbandoning = $state(false);

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
			await ondelete?.();
			showDeleteModal = false;
		} finally {
			isDeleting = false;
		}
	}

	$effect(() => {
		editContent = todo.content;
		editNote = todo.note || '';
	});

	const scheduleText = $derived(formatScheduleRange(todo.startDate, todo.dueDate));

	// 领域派生状态：多人同行模块 (Domain Derived States for Multiplayer Section)
	const hasOtherParticipants = $derived((topicParticipantCount ?? 0) > 1);

	// 是否展示同行模块：
	// 1. 待办必须绑定了 topicHash
	// 2. 当为作者本人的待办且暂无他人同行时，隐藏空状态以消除视觉杂讯
	// 3. 其它场景（作者且有多人同行、或非作者可查看/参与/快捷打卡）正常呈现
	const shouldShowMultiplayer = $derived(
		Boolean(todo.topicHash && (!isMine || hasOtherParticipants))
	);

	// 我的当前关联待办详情链接
	const myTodoUrl = $derived(
		myJoinedTodo?.shortId || myJoinedTodo?.id
			? `/t/${myJoinedTodo.shortId || myJoinedTodo.id}`
			: null
	);

	// 是否允许快捷查看我的待办 (非作者 + todo in my list + 拥有同行者)
	const canShowMyTodoShortcut = $derived(
		Boolean(!isMine && hasJoined && hasOtherParticipants && myTodoUrl)
	);

	async function handleSave(e: SubmitEvent) {
		e.preventDefault();
		if (!editContent.trim()) return;

		isSaving = true;
		try {
			await onsaveedit?.(editContent.trim(), editNote.trim() || null);
			isEditing = false;
		} finally {
			isSaving = false;
		}
	}

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

<div class="space-y-6 sm:space-y-7">
	<!-- Author header & checkbox -->
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

	<!-- Content & inline edit -->
	{#if isEditing}
		<form onsubmit={handleSave} class="space-y-3 pt-2">
			<div class="space-y-1">
				<label
					for="edit-content"
					class="text-xs font-medium text-zinc-600 dark:text-zinc-400"
				>
					Todo Content
				</label>
				<textarea
					id="edit-content"
					bind:value={editContent}
					rows="2"
					required
					class="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
				></textarea>
			</div>

			<div class="space-y-1">
				<label
					for="edit-note"
					class="text-xs font-medium text-zinc-600 dark:text-zinc-400"
				>
					Public Note (optional)
				</label>
				<textarea
					id="edit-note"
					bind:value={editNote}
					rows="2"
					placeholder="Add background or notes..."
					class="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
				></textarea>
			</div>

			<div class="flex items-center justify-between pt-1">
				<button
					type="button"
					onclick={() => (showDeleteModal = true)}
					class="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200/60 dark:hover:border-red-900/50 transition-colors cursor-pointer"
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
						onclick={() => (isEditing = false)}
					>
						Cancel
					</Button>
					<Button type="submit" variant="primary" size="xs" loading={isSaving}>
						Save
					</Button>
				</div>
			</div>
		</form>
	{:else}
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
		</div>
	{/if}

	<!-- Metadata bar: category, schedule, link copy -->
	<div
		class="flex items-center justify-between flex-wrap gap-3 pt-2 text-xs text-zinc-500 dark:text-zinc-400"
	>
		<div class="flex items-center gap-2.5 flex-wrap">
			{#if todo.category}
				<CategoryBadge category={todo.category} />
			{/if}

			{#if scheduleText}
				<span class="flex items-center gap-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
					<Icon icon="lucide:calendar" class="h-3.5 w-3.5 text-zinc-400 shrink-0" />
					<span>{scheduleText}</span>
				</span>
			{/if}
		</div>

		<button
			type="button"
			onclick={copyLink}
			class="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:underline cursor-pointer"
		>
			<Icon icon="lucide:link-2" class="h-3.5 w-3.5 text-zinc-400 shrink-0" />
			<span>{todo.shortId || todo.id.slice(0, 8)}</span>
		</button>
	</div>

	<!-- Reaction bar & actions -->
	<div class="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
		<TodoReactionsBar
			todoId={todo.id}
			reactions={todo.reactions}
			myReactions={todo.myReactions}
			{isMine}
			onreact={onreaction}
			onedit={isMine && !isEditing ? () => (isEditing = true) : undefined}
		/>
	</div>

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
		<p class="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
			This action is permanent and cannot be undone. All activity logs and reactions will be wiped.
		</p>

		<!-- 放弃引导说明 (内含快捷放弃，推荐操作) -->
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
