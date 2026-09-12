<script lang="ts">
	import type { createMyTodosResource } from '$lib/stores/resources/use-my-todos.svelte';
	import type { Todo, TodoStatus } from '$lib/types/todo';
	import { TODO_STATUSES, getStatusConfig, getAllowedNextStatuses } from '$lib/constants/status';
	import CategoryBadge from '$lib/components/todo/CategoryBadge.svelte';
	import TodoCheckbox from '$lib/components/todo/TodoCheckbox.svelte';
	import { formatRelativeTime } from '$lib/utils/format';
	import Icon from '@iconify/svelte';

	interface Props {
		resource: ReturnType<typeof createMyTodosResource>;
	}

	let { resource }: Props = $props();

	const columns = $derived(
		TODO_STATUSES.map((st) => ({
			status: st.id,
			label: st.label,
			dotClass: st.dotClass,
			todos: resource.kanbanColumns[st.id] || []
		}))
	);

	let activeMenuTodoId = $state<string | null>(null);

	function toggleMenu(todoId: string, e: MouseEvent) {
		e.stopPropagation();
		activeMenuTodoId = activeMenuTodoId === todoId ? null : todoId;
	}

	function closeMenu() {
		activeMenuTodoId = null;
	}
</script>

<svelte:window onclick={closeMenu} />

<div class="space-y-6">
	<!-- 主流看板布局：大间距留白、无边框软背景列通道 (Linear / Notion 风格) -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 items-start">
		{#each columns as col (col.status)}
			<div
				class="flex flex-col rounded-3xl bg-zinc-100/50 dark:bg-zinc-900/40 p-3.5 sm:p-4 space-y-3.5 min-h-[480px]"
			>
				<!-- 列头 (无下划线硬分割，宽裕留白) -->
				<div class="flex items-center justify-between px-1 py-0.5">
					<div class="flex items-center gap-2">
						<span class="h-2.5 w-2.5 rounded-full {col.dotClass}"></span>
						<span class="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{col.label}</span>
						<span
							class="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-200/50 dark:bg-zinc-800/60 text-zinc-500"
						>
							{col.todos.length}
						</span>
					</div>
				</div>

				<!-- 任务卡片列流 (大圆角、悬浮软阴影、零生硬边框) -->
				<div class="space-y-3 flex-1">
					{#if col.todos.length === 0}
						<div
							class="py-16 text-center text-xs text-zinc-400 font-medium"
						>
							暂无待办事项
						</div>
					{:else}
						{#each col.todos as todo (todo.id)}
							{@const currentStatusConfig = getStatusConfig(todo.status)}
							<div
								class="group/card relative rounded-2xl bg-white dark:bg-zinc-900 p-4 shadow-2xs hover:shadow-xs transition-all duration-150 space-y-3"
							>
								<!-- 顶栏：分类徽章与相对时间 -->
								<div class="flex items-center justify-between gap-2">
									<div>
										{#if todo.category}
											<CategoryBadge category={todo.category} />
										{/if}
									</div>
									<span class="font-mono text-[10px] text-zinc-400">
										{formatRelativeTime(todo.createdAt)}
									</span>
								</div>

								<!-- 标题正文 (大字号微排印) -->
								<a
									href="/todos/{todo.shortId || todo.id}"
									class="block text-xs font-semibold leading-relaxed text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white transition-colors {todo.status === 'done'
										? 'line-through text-zinc-400 dark:text-zinc-500'
										: todo.status === 'abandoned'
											? 'line-through text-zinc-400 dark:text-zinc-500 opacity-60'
											: ''}"
									title="查看待办详情"
								>
									{todo.content}
								</a>

								<!-- 备注舒展预览 (如果存在) -->
								{#if todo.note}
									<div
										class="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50/80 dark:bg-zinc-800/40 rounded-xl p-2.5 leading-normal"
									>
										{todo.note}
									</div>
								{/if}

								<!-- 底栏：主流设计风格状态选择胶囊 + 单手极简打卡复选框 -->
								<div class="flex items-center justify-between pt-1">
									<!-- 主流风格状态流转选择器 (点击弹出状态切换，无粗俗文字按钮) -->
									<div class="relative">
										<button
											type="button"
											onclick={(e) => toggleMenu(todo.id, e)}
											class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-zinc-100/70 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 transition-colors cursor-pointer"
											title="更改状态"
										>
											<span class="h-1.5 w-1.5 rounded-full {currentStatusConfig.dotClass}"></span>
											<span>{currentStatusConfig.label}</span>
											<svg class="h-3 w-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
											</svg>
										</button>

										{#if activeMenuTodoId === todo.id}
											<div
												class="absolute left-0 bottom-full mb-1.5 z-30 w-32 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-1.5 shadow-xl text-xs animate-in fade-in zoom-in-95 duration-100 space-y-0.5"
											>
												<div class="px-2 py-1 text-[10px] text-zinc-400 font-medium">
													移至状态
												</div>
												{#each TODO_STATUSES as targetSt}
													<button
														type="button"
														onclick={(e) => {
															resource.changeStatus(todo.id, targetSt.id, e);
															closeMenu();
														}}
														class="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer flex items-center justify-between {todo.status === targetSt.id ? 'font-semibold bg-zinc-50 dark:bg-zinc-800/50' : ''}"
													>
														<span class="flex items-center gap-2">
															<span class="h-1.5 w-1.5 rounded-full {targetSt.dotClass}"></span>
															<span>{targetSt.label}</span>
														</span>
														{#if todo.status === targetSt.id}
															<Icon icon="lucide:check" class="h-3.5 w-3.5 text-zinc-400" />
														{/if}
													</button>
												{/each}
											</div>
										{/if}
									</div>

									<!-- 右侧打卡复选框 -->
									<TodoCheckbox
										status={todo.status}
										isMine={true}
										size="sm"
										ontoggle={(nextStatus, e) => resource.handleToggle(todo, nextStatus, e)}
									/>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
