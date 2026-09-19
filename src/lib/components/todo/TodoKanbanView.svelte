<script lang="ts">
	import type { createMyTodosResource } from '$lib/stores/resources/use-my-todos.svelte';
	import type { Todo, TodoStatus } from '$lib/types/todo';
	import {
		TODO_STATUSES,
		getStatusConfig,
		getAllowedNextStatuses,
		isStatusDone,
		isStatusAbandoned
	} from '$lib/constants/status';
	import { getCategoryConfig } from '$lib/constants/categories';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Popover from '$lib/components/ui/Popover.svelte';
	import { POPOVER_PLACEMENT, POPOVER_TRIGGER, POPOVER_ROLE } from '$lib/constants/popover';
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
							{@const currentStatusConfig = getStatusConfig(todo.status)}
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

									<Popover
										placement={POPOVER_PLACEMENT.TOP_END}
										trigger={POPOVER_TRIGGER.CLICK}
										role={POPOVER_ROLE.MENU}
										offset={6}
									>
										{#snippet triggerSnippet({ triggerProps })}
											<button
												type="button"
												{...triggerProps}
												class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition-colors cursor-pointer shadow-2xs"
												title="Change status"
											>
												<TodoStatusIcon status={todo.status} size="xs" class={currentStatusConfig.actionColorClass} />
												<span>{currentStatusConfig.label}</span>
												<svg class="h-3 w-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
												</svg>
											</button>
										{/snippet}

										{#snippet children({ close })}
											<div
												class="w-32 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1.5 shadow-xl text-xs animate-in fade-in zoom-in-95 duration-100 space-y-0.5"
											>
												<div class="px-2 py-1 text-[10px] text-zinc-400 font-medium">
													Move to
												</div>
												{#each TODO_STATUSES as targetSt}
													<button
														type="button"
														onclick={(e) => {
															resource.changeStatus(todo.id, targetSt.id, e);
															close();
														}}
														class="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer flex items-center justify-between {todo.status === targetSt.id ? 'font-semibold bg-zinc-50 dark:bg-zinc-800/50' : ''}"
													>
														<span class="flex items-center gap-2">
															<TodoStatusIcon status={targetSt.id} size="xs" class={targetSt.actionColorClass} />
															<span>{targetSt.label}</span>
														</span>
														{#if todo.status === targetSt.id}
															<Icon icon="lucide:check" class="h-3.5 w-3.5 text-zinc-400" />
														{/if}
													</button>
												{/each}
											</div>
										{/snippet}
									</Popover>
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
