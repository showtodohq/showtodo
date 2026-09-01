<script lang="ts">
	import { userStore } from '$lib/stores/user.svelte';
	import { api } from '$lib/services/api';
	import { toast } from '$lib/stores/toast.svelte';
	import { optimisticAction } from '$lib/utils/mutation';
	import { confetti } from '$lib/utils/confetti';
	import type { Todo, TodoStatus } from '$lib/types/todo';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	interface Props {
		onTodoToggled?: (todoId: string, nextStatus: TodoStatus) => void;
	}

	let { onTodoToggled }: Props = $props();

	let todayTodos = $state<Todo[]>([]);
	let loading = $state(false);

	function getTodayString(): string {
		const now = new Date();
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, '0');
		const d = String(now.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	export async function refresh() {
		if (!userStore.id && !userStore.email) return;
		loading = true;
		try {
			const today = getTodayString();
			// 服务端数据库级精确过滤：当天范围的个人待办
			const res = await api.getTodos({
				authorId: userStore.id,
				startDateFrom: `${today}T00:00:00.000Z`,
				startDateTo: `${today}T23:59:59.999Z`,
				limit: 10
			});
			todayTodos = res.todos || [];
		} catch (e) {
			console.error('Failed to load my today todos:', e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (userStore.id || userStore.email) {
			refresh();
		} else {
			todayTodos = [];
		}
	});

	const doneCount = $derived(todayTodos.filter((t) => t.status === 'done').length);
	const totalCount = $derived(todayTodos.length);

	export function triggerCheckAllDone(justCompletedTodoId?: string) {
		const isAllDone =
			todayTodos.length > 0 &&
			todayTodos.every((t) => (t.id === justCompletedTodoId ? true : t.status === 'done'));

		if (isAllDone) {
			confetti.tripleCelebration();
			toast.success('🎉 太棒了！今日全部待办已全部达成！');
		}
	}

	async function handleToggleStatus(todo: Todo, event?: MouseEvent) {
		if (!userStore.email) return;

		const prevStatus = todo.status;
		const nextStatus: TodoStatus = prevStatus === 'done' ? 'pending' : 'done';

		if (nextStatus === 'done') {
			const isAllDone =
				todayTodos.length > 0 &&
				todayTodos.every((t) => (t.id === todo.id ? true : t.status === 'done'));

			if (isAllDone) {
				confetti.tripleCelebration();
				toast.success('🎉 太棒了！今日全部待办已全部达成！');
			} else if (event) {
				confetti.burst(event.clientX, event.clientY, 250);
			} else {
				confetti.burst(undefined, undefined, 250);
			}
		}

		try {
			await optimisticAction({
				apply: () => {
					todo.status = nextStatus;
					onTodoToggled?.(todo.id, nextStatus);
				},
				rollback: () => {
					todo.status = prevStatus;
					onTodoToggled?.(todo.id, prevStatus);
				},
				action: async () => {
					await api.updateTodo(todo.id, {
						email: userStore.email!,
						status: nextStatus
					});
				},
				onError: (err) => {
					toast.error(`更新失败: ${(err as Error).message}`);
				}
			});
		} catch {
			// error handled
		}
	}
</script>

{#if userStore.email}
	<div
		class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white/60 dark:bg-zinc-950/60 p-4 backdrop-blur-xs space-y-3"
	>
		<!-- 头部标题与今日进度 -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-1.5 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
				<span>📌 我的今日待办</span>
			</div>

			{#if totalCount > 0}
				<div class="font-mono text-xs text-zinc-400">
					<strong class="font-semibold text-zinc-800 dark:text-zinc-200">{doneCount}</strong>/{totalCount}
				</div>
			{/if}
		</div>

		<!-- 待办清单内容 -->
		{#if loading && todayTodos.length === 0}
			<div class="flex justify-center py-4 text-zinc-400">
				<Spinner size="sm" />
			</div>
		{:else if todayTodos.length === 0}
			<div class="py-3 text-center text-xs text-zinc-400">
				今天还没有发布待办，在上方写一个吧 ✨
			</div>
		{:else}
			<div class="space-y-1.5">
				{#each todayTodos as todo (todo.id)}
					{@const isDone = todo.status === 'done'}
					<div
						class="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 transition-colors group/item"
					>
						<span
							class="text-xs truncate flex-1 {isDone
								? 'line-through text-zinc-400 dark:text-zinc-500'
								: 'text-zinc-800 dark:text-zinc-200 font-medium'}"
						>
							{todo.content}
						</span>

						<button
							type="button"
							onclick={(e) => handleToggleStatus(todo, e)}
							class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-150 active:scale-85 cursor-pointer {isDone
								? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
								: 'border-zinc-400 dark:border-zinc-600 hover:border-zinc-900 dark:hover:border-zinc-200'}"
							title={isDone ? '标记为未完成' : '完成此待办'}
							aria-label={isDone ? 'Mark uncompleted' : 'Mark completed'}
						>
							{#if isDone}
								<svg class="h-2.5 w-2.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							{/if}
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
