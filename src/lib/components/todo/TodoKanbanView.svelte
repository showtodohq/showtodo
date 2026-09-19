<script lang="ts">
	import type { createMyTodosResource } from '$lib/stores/resources/use-my-todos.svelte';
	import type { Todo, TodoStatus } from '$lib/types/todo';
	import {
		TODO_STATUSES,
		isStatusDone,
		isStatusAbandoned
	} from '$lib/constants/status';
	import { getCategoryConfig } from '$lib/constants/categories';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import TodoStatusDropdown from '$lib/components/todo/TodoStatusDropdown.svelte';
	import { formatRelativeTime } from '$lib/utils/format';
	import Icon from '@iconify/svelte';
	import TodoStatusIcon from '$lib/components/todo/TodoStatusIcon.svelte';

	interface Props {
		resource: ReturnType<typeof createMyTodosResource>;
	}

	let { resource }: Props = $props();

	const columns = $derived(
		TODO_STATUSES.map((st) => ({
			status: st.id,
			label: st.label,
			actionColorClass: st.actionColorClass,
			todos: resource.kanbanColumns[st.id] || []
		}))
	);

	const totalKanbanTodos = $derived(columns.reduce((acc, col) => acc + col.todos.length, 0));
</script>

<div class="space-y-4">
	{#if totalKanbanTodos === 0}
		<EmptyState
			title="No todos in workbench"
			description="Create a goal or plan to get started on the board"
			class="py-16"
		>
			{#snippet icon()}
				<Icon icon="lucide:kanban" class="h-6 w-6 text-zinc-400" />
			{/snippet}
		</EmptyState>
	{:else}
		<!-- 主流横向看板通道：横向自由滑动、固定舒适列宽、释放垂直空间 (Linear / Trello 风格) -->
		<div
			class="-mx-4 px-4 sm:-mx-6 sm:px-6 overflow-x-auto pb-4 pt-1 flex gap-4 sm:gap-5 scrollbar-thin snap-x snap-mandatory scroll-smooth"
		>
		{#each columns as col (col.status)}
			<div
				class="flex flex-col rounded-3xl bg-zinc-100/50 dark:bg-zinc-900/40 p-3.5 sm:p-4 space-y-3.5 w-[280px] sm:w-[300px] shrink-0 snap-start min-h-[460px]"
			>
				<!-- 列头 (无下划线硬分割，宽裕留白) -->
				<div class="flex items-center justify-between px-1 py-0.5">
					<div class="flex items-center gap-2">
						<TodoStatusIcon status={col.status} size="sm" class={col.actionColorClass} />
						<span class="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{col.label}</span>
						<span
							class="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-200/50 dark:bg-zinc-800/60 text-zinc-500"
						>
							{col.todos.length}
						</span>
					</div>
				</div>

				<!-- Task cards list -->
				<div class="space-y-3 flex-1">
					{#if col.todos.length === 0}
						<div
							class="py-16 text-center text-xs text-zinc-400 font-medium"
						>
							No todos
						</div>
					{:else}
						{#each col.todos as todo (todo.id)}
							{@const catConfig = getCategoryConfig(todo.category)}
							<div
								class="group/card relative rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all duration-150 space-y-3 {catConfig
									? catConfig.bgClass
									: 'bg-white dark:bg-zinc-900'}"
							>
								<!-- Todo content link -->
								<a
									href="/t/{todo.shortId || todo.id}"
									class="block text-xs font-semibold leading-relaxed text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white transition-colors {isStatusDone(
										todo.status
									)
										? 'line-through text-zinc-400 dark:text-zinc-500'
										: isStatusAbandoned(todo.status)
											? 'line-through text-zinc-400 dark:text-zinc-500 opacity-60'
											: ''}"
									title="View todo details"
								>
									{todo.content}
								</a>

								<!-- Note preview -->
								{#if todo.note}
									<div
										class="text-xs text-zinc-600 dark:text-zinc-300 bg-white/60 dark:bg-black/20 rounded-xl p-2.5 leading-normal"
									>
										{todo.note}
									</div>
								{/if}

								<!-- Bottom bar: time on left, status popover on right -->
								<div class="flex items-center justify-between pt-1">
									<span class="font-mono text-[10px] text-zinc-500/80 dark:text-zinc-400">
										{formatRelativeTime(todo.createdAt)}
									</span>

									<TodoStatusDropdown
										status={todo.status}
										todoTitle={todo.content}
										onchange={(nextSt, e) => resource.changeStatus(todo.id, nextSt, e)}
										onlogprogress={(data) => resource.logProgress(todo.id, data.status, data.note)}
									/>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/each}
		</div>
	{/if}
</div>
