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
	import { getAllowedNextStatuses, getStatusConfig } from '$lib/constants/status';
	import Icon from '@iconify/svelte';

	interface Props {
		todo: Todo | null;
		isOpen: boolean;
		onClose: () => void;
		onTodoUpdated?: (updatedTodo: Todo) => void;
		onOpenEdit?: (todo: Todo) => void;
		onRequestEmail?: () => void;
	}

	let { todo, isOpen, onClose, onTodoUpdated, onOpenEdit, onRequestEmail }: Props = $props();

	let isEditModalOpen = $state(false);
	let isUpdatingStatus = $state(false);

	const isAuthor = $derived(
		todo ? userStore.isAuthor(todo.authorId, todo.author?.email, todo.author?.handle) : false
	);

	const allowedStatuses = $derived(todo ? getAllowedNextStatuses(todo.status) : []);

	function handleOpenEdit() {
		if (!todo) return;
		if (onOpenEdit) {
			onClose();
			onOpenEdit(todo);
		} else {
			isEditModalOpen = true;
		}
	}

	async function handleStatusChange(nextStatus: TodoStatus) {
		if (!todo || todo.status === nextStatus) return;
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
			toast.success(`状态已更新为「${getStatusConfig(nextStatus).label}」`);
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
						onclick={handleOpenEdit}
						class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
					>
						<Icon icon="lucide:edit-2" class="w-3 h-3" />
						编辑
					</button>
				{/if}
			</div>

			<!-- 状态快速流转操作栏 (若为创建者且有合法流转动作) -->
			{#if isAuthor && allowedStatuses.length > 0}
				<div class="pt-2 border-t border-zinc-100 dark:border-zinc-800">
					<div class="text-[11px] font-medium text-zinc-400 mb-2">流转状态</div>
					<div class="flex flex-wrap gap-2">
						{#each allowedStatuses as st (st.id)}
							<button
								type="button"
								disabled={isUpdatingStatus}
								onclick={() => handleStatusChange(st.id)}
								class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
							>
								{#if isUpdatingStatus}
									<Icon icon="lucide:loader-2" class="w-3.5 h-3.5 animate-spin {st.actionColorClass}" />
								{:else}
									<Icon icon={st.actionIcon} class="w-3.5 h-3.5 {st.actionColorClass}" />
								{/if}
								<span>{st.actionLabel}</span>
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

<!-- 编辑 Todo 弹窗兜底 (未传 onOpenEdit 时) -->
{#if !onOpenEdit && todo}
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
