<script lang="ts">
	import type { Todo, TodoStatus } from '$lib/types/todo';
	import Modal from '$lib/components/common/Modal.svelte';
	import Avatar from '$lib/components/common/Avatar.svelte';
	import CategoryBadge from '$lib/components/common/CategoryBadge.svelte';
	import StatusBadge from '$lib/components/common/StatusBadge.svelte';
	import ReactionBar from '$lib/components/todo/ReactionBar.svelte';
	import EditTodoModal from '$lib/components/todo/EditTodoModal.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { api } from '$lib/services/api';
	import { TODO_STATUSES, canTransitionTo } from '$lib/constants/status';
	import Icon from '@iconify/svelte';

	interface Props {
		todo: Todo | null;
		isOpen: boolean;
		onClose: () => void;
		onTodoUpdated?: (updatedTodo: Todo) => void;
		onRequestEmail?: () => void;
	}

	let { todo, isOpen, onClose, onTodoUpdated, onRequestEmail }: Props = $props();

	let isEditModalOpen = $state(false);
	let isUpdatingStatus = $state(false);

	const isAuthor = $derived(
		todo && userStore.id && (todo.authorId === userStore.id || todo.author?.id === userStore.id)
	);

	async function handleStatusChange(nextStatus: TodoStatus) {
		if (!todo) return;
		const email = userStore.email;
		if (!email) {
			toast.info('请先设置邮箱');
			onRequestEmail?.();
			return;
		}

		isUpdatingStatus = true;
		try {
			const res = await api.updateTodo(todo.id, { email, status: nextStatus });
			const updated: Todo = {
				...todo,
				...res.todo,
				author: todo.author,
				reactions: todo.reactions
			};
			onTodoUpdated?.(updated);
			toast.success('状态已更新');
		} catch (error: any) {
			toast.error(error.message || '更新状态失败');
		} finally {
			isUpdatingStatus = false;
		}
	}
</script>

<Modal {isOpen} {onClose} title="待办详情" maxWidth="md">
	{#if todo}
		<div class="space-y-4">
			<!-- 头部作者信息 -->
			<div class="flex items-center justify-between gap-3">
				<div class="flex items-center gap-2.5">
					<Avatar
						avatar={todo.author?.avatar}
						seed={todo.author?.nickname || 'User'}
						size="sm"
						alt={todo.author?.nickname}
					/>
					<div>
						<div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
							{todo.author?.nickname}
						</div>
						<div class="text-[11px] text-zinc-400">
							@{todo.author?.handle}
						</div>
					</div>
				</div>

				<div class="flex items-center gap-1.5">
					<CategoryBadge category={todo.category} />
					<StatusBadge status={todo.status} />
				</div>
			</div>

			<!-- 待办主文本 -->
			<div class="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
				<p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed break-words whitespace-pre-wrap">
					{todo.content}
				</p>

				{#if todo.note}
					<div class="mt-2.5 pt-2.5 border-t border-zinc-200/60 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
						{todo.note}
					</div>
				{/if}
			</div>

			<!-- 时间与元信息 -->
			<div class="flex items-center justify-between text-xs text-zinc-400">
				<div class="flex items-center gap-1">
					<Icon icon="lucide:calendar" class="w-3.5 h-3.5" />
					<span>开始: {todo.startDate ? todo.startDate.slice(0, 10) : '未设'}</span>
					{#if todo.dueDate}
						<span class="ml-2">截止: {todo.dueDate.slice(0, 10)}</span>
					{/if}
				</div>

				{#if isAuthor}
					<button
						type="button"
						onclick={() => (isEditModalOpen = true)}
						class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
					>
						<Icon icon="lucide:edit-2" class="w-3 h-3" />
						编辑
					</button>
				{/if}
			</div>

			<!-- 状态快速流转操作栏 (若为创建者) -->
			{#if isAuthor}
				<div class="pt-2 border-t border-zinc-100 dark:border-zinc-800">
					<div class="text-[11px] font-medium text-zinc-400 mb-2">更新状态</div>
					<div class="grid grid-cols-4 gap-1.5">
						{#each TODO_STATUSES as st (st.id)}
							{@const isCurrent = todo.status === st.id}
							{@const isAllowed = canTransitionTo(todo.status, st.id)}
							{@const isDisabled = isUpdatingStatus || isCurrent || !isAllowed}
							<button
								type="button"
								disabled={isDisabled}
								onclick={() => handleStatusChange(st.id)}
								class="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors select-none {isCurrent
									? st.activeButtonClass
									: isAllowed
										? st.inactiveButtonClass + ' cursor-pointer'
										: 'opacity-30 bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-600 border-dashed border-zinc-200/60 dark:border-zinc-800 cursor-not-allowed'}"
							>
								<Icon icon={st.icon} class="w-3.5 h-3.5 shrink-0" />
								<span>{st.label}</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Emoji 表态 Reaction 栏 -->
			<div class="pt-2 border-t border-zinc-100 dark:border-zinc-800">
				<div class="text-[11px] font-medium text-zinc-400 mb-1.5">围观表态</div>
				<ReactionBar
					todoId={todo.id}
					initialReactions={todo.reactions}
					{onRequestEmail}
				/>
			</div>
		</div>
	{/if}
</Modal>

<!-- 编辑 Todo 弹窗 -->
{#if todo}
	<EditTodoModal
		{todo}
		isOpen={isEditModalOpen}
		onClose={() => (isEditModalOpen = false)}
		onUpdated={(updated) => {
			onTodoUpdated?.(updated);
			isEditModalOpen = false;
		}}
	/>
{/if}
