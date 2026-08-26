<script lang="ts">
	import type { Todo } from '$lib/types/todo';
	import TodoPill from './TodoPill.svelte';
	import { sortTodosForCell } from '$lib/utils/calendar';
	import Icon from '@iconify/svelte';

	interface Props {
		todos: Todo[];
		dateStr: string;
		isToday?: boolean;
		isCurrentUser?: boolean;
		onSelectTodo?: (todo: Todo) => void;
		onOpenDayTodos?: (dateStr: string, todos: Todo[]) => void;
		onQuickCreate?: (dateStr: string) => void;
	}

	let {
		todos = [],
		dateStr,
		isToday = false,
		isCurrentUser = false,
		onSelectTodo,
		onOpenDayTodos,
		onQuickCreate
	}: Props = $props();

	// 排序
	const sortedTodos = $derived(sortTodosForCell(todos));
	const maxDisplay = 3;
	const displayTodos = $derived(sortedTodos.slice(0, maxDisplay));
	const overflowCount = $derived(sortedTodos.length - maxDisplay);
</script>

<div
	class="relative group/cell min-h-[96px] sm:min-h-[110px] p-2 flex flex-col justify-start gap-1.5 transition-colors border-r border-zinc-100 dark:border-zinc-800/60 last:border-r-0 {isToday
		? 'bg-blue-50/20 dark:bg-blue-950/10'
		: 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30'}"
>
	<!-- Todo Pills 列表 -->
	{#if displayTodos.length > 0}
		<div class="space-y-1.5 w-full">
			{#each displayTodos as todo (todo.id)}
				<TodoPill {todo} onClick={(t) => onSelectTodo?.(t)} />
			{/each}
		</div>
	{/if}

	<!-- 溢出 +N more 指示器 -->
	{#if overflowCount > 0}
		<button
			type="button"
			onclick={() => onOpenDayTodos?.(dateStr, sortedTodos)}
			class="w-full text-center py-0.5 px-1.5 rounded-md text-[11px] font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
		>
			+{overflowCount} more
		</button>
	{/if}

	<!-- 当前用户悬停快速新建引导（空单元格或底部） -->
	{#if isCurrentUser}
		<button
			type="button"
			onclick={() => onQuickCreate?.(dateStr)}
			title="在此日期添加待办"
			class="mt-auto opacity-0 group-hover/cell:opacity-100 focus:opacity-100 transition-opacity w-full py-1 rounded flex items-center justify-center text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs gap-1 border border-dashed border-transparent hover:border-blue-300 dark:hover:border-blue-700"
		>
			<Icon icon="lucide:plus" class="w-3.5 h-3.5" />
			<span class="text-[10px]">添加</span>
		</button>
	{/if}
</div>
