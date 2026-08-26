<script lang="ts">
	import type { Todo } from '$lib/types/todo';
	import type { UserProfile } from '$lib/types/user';
	import Modal from '$lib/components/common/Modal.svelte';
	import TodoPill from '$lib/components/calendar/TodoPill.svelte';
	import Avatar from '$lib/components/common/Avatar.svelte';
	import { sortTodosForCell } from '$lib/utils/calendar';

	interface Props {
		isOpen: boolean;
		user: UserProfile | null;
		dateStr: string;
		todos: Todo[];
		onClose: () => void;
		onSelectTodo: (todo: Todo) => void;
	}

	let { isOpen, user, dateStr, todos = [], onClose, onSelectTodo }: Props = $props();

	const sortedTodos = $derived(sortTodosForCell(todos));
</script>

<Modal {isOpen} {onClose} title="当天全部待办" maxWidth="md">
	{#if user}
		<div class="space-y-4">
			<div class="flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
				<div class="flex items-center gap-2">
					<Avatar avatar={user.avatar} seed={user.nickname} size="sm" alt={user.nickname} />
					<div>
						<div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
							{user.nickname}
						</div>
						<div class="text-[11px] text-zinc-400">
							@{user.handle}
						</div>
					</div>
				</div>
				<div class="text-xs font-medium text-zinc-500 dark:text-zinc-400">
					{dateStr}
				</div>
			</div>

			<div class="space-y-2 max-h-80 overflow-y-auto pr-1">
				{#each sortedTodos as todo (todo.id)}
					<TodoPill
						{todo}
						onClick={(t) => {
							onClose();
							onSelectTodo(t);
						}}
					/>
				{/each}
			</div>
		</div>
	{/if}
</Modal>
