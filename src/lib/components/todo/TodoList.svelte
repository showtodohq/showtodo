<script lang="ts">
	import type { Todo } from '$lib/types/todo';
	import TodoCard from '$lib/components/todo/TodoCard.svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		todos: Todo[];
		isLoading: boolean;
		isLoadingMore: boolean;
		hasMore: boolean;
		onLoadMore: () => void;
		onTodoUpdated?: (todo: Todo) => void;
		onRequestEmail?: () => void;
		emptyMessage?: string;
	}

	let {
		todos,
		isLoading,
		isLoadingMore,
		hasMore,
		onLoadMore,
		onTodoUpdated,
		onRequestEmail,
		emptyMessage = '暂无待办事项'
	}: Props = $props();
</script>

<div class="space-y-4">
	<!-- Initial Loading Skeleton -->
	{#if isLoading && todos.length === 0}
		<div class="space-y-3.5">
			{#each [1, 2, 3] as _}
				<div
					class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 space-y-3 animate-pulse"
				>
					<div class="flex items-center gap-2">
						<div class="h-5 w-14 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
						<div class="h-5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
					</div>
					<div class="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
					<div class="h-4 w-1/2 bg-zinc-100 dark:bg-zinc-800/60 rounded-md"></div>
					<div class="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
							<div class="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
						</div>
						<div class="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if todos.length === 0}
		<!-- Empty State -->
		<div
			class="rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 py-12 px-4 text-center space-y-3"
		>
			<div
				class="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center"
			>
				<Icon icon="lucide:inbox" class="w-5 h-5" />
			</div>
			<div class="space-y-1">
				<p class="text-xs text-zinc-500 max-w-sm mx-auto">
					{emptyMessage}
				</p>
			</div>
		</div>
	{:else}
		<!-- Todos Cards -->
		<div class="space-y-3.5">
			{#each todos as todo (todo.id)}
				<TodoCard {todo} onUpdated={onTodoUpdated} {onRequestEmail} />
			{/each}
		</div>

		<!-- Load More Button -->
		{#if hasMore}
			<div class="pt-4 text-center">
				<button
					type="button"
					disabled={isLoadingMore}
					onclick={onLoadMore}
					class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-200 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
				>
					{#if isLoadingMore}
						<Icon icon="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
						<span>加载中...</span>
					{:else}
						<Icon icon="lucide:chevron-down" class="w-3.5 h-3.5" />
						<span>加载更多</span>
					{/if}
				</button>
			</div>
		{/if}
	{/if}
</div>
