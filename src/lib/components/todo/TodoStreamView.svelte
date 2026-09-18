<script lang="ts">
	import type { createMyTodosResource } from '$lib/stores/resources/use-my-todos.svelte';
	import type { TodoStatus, CategoryId } from '$lib/types/todo';
	import { TODO_STATUSES } from '$lib/constants/status';
	import { CATEGORIES, getCategoryConfig } from '$lib/constants/categories';
	import TodoItem from '$lib/components/todo/TodoItem.svelte';
	import DataView from '$lib/components/ui/DataView.svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		resource: ReturnType<typeof createMyTodosResource>;
	}

	let { resource }: Props = $props();

	function handleTabChange(tab: TodoStatus | 'all') {
		resource.streamTab = tab;
	}

	function handleCategoryClick(catId: CategoryId) {
		if (resource.activeCategory === catId) {
			resource.activeCategory = null;
		} else {
			resource.activeCategory = catId;
		}
	}

	function handleClearCategory() {
		resource.activeCategory = null;
	}
</script>

<div class="space-y-4 sm:space-y-5">
	<!-- Status tabs & category filter -->
	<div class="space-y-3">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
			<!-- Status filter pills (All / Pending / In Progress / Completed / Abandoned) -->
			<div class="inline-flex items-center rounded-2xl bg-zinc-100/90 dark:bg-zinc-800/80 p-1 overflow-x-auto max-w-full scrollbar-none">
				<button
					type="button"
					onclick={() => handleTabChange('all')}
					class="px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap {resource.streamTab === 'all'
						? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
				>
					All ({resource.totalCount})
				</button>

				{#each TODO_STATUSES as st}
					<button
						type="button"
						onclick={() => handleTabChange(st.id)}
						class="px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap {resource.streamTab === st.id
							? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
							: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
					>
						{st.label} ({resource.statusCounts[st.id] || 0})
					</button>
				{/each}
			</div>

			<!-- Active category indicator & clear -->
			{#if resource.activeCategory}
				{@const catConfig = getCategoryConfig(resource.activeCategory)}
				<div class="flex items-center gap-1.5 animate-in fade-in duration-150">
					<span class="text-xs text-zinc-400">Category:</span>
					<button
						type="button"
						onclick={handleClearCategory}
						class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer group"
						style="color: {catConfig?.color};"
						title="Clear category filter"
					>
						<span
							class="h-1.5 w-1.5 rounded-full shrink-0"
							style="background-color: {catConfig?.color};"
						></span>
						<span>{catConfig?.name || resource.activeCategory}</span>
						<Icon icon="lucide:x" class="h-3 w-3 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 ml-0.5" />
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Content area -->
	<DataView
		loading={resource.loading}
		empty={resource.streamFilteredTodos.length === 0}
	>
		{#snippet emptyView()}
			<div
				class="rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800/80 py-20 text-center text-xs text-zinc-400 space-y-2"
			>
				<div>
					{#if resource.searchQuery || resource.activeCategory || resource.streamTab !== 'all'}
						No todos match the current filters
					{:else}
						No todos yet. Create your first one above!
					{/if}
				</div>
				{#if resource.searchQuery || resource.activeCategory || resource.streamTab !== 'all'}
					<button
						type="button"
						onclick={() => {
							resource.searchQuery = '';
							resource.activeCategory = null;
							resource.streamTab = 'all';
						}}
						class="text-xs text-zinc-600 dark:text-zinc-300 hover:underline cursor-pointer"
					>
						Reset all filters
					</button>
				{/if}
			</div>
		{/snippet}

		<div class="space-y-1.5 sm:space-y-2">
			{#each resource.streamFilteredTodos as todo (todo.id)}
				<TodoItem
					{todo}
					isMine={true}
					ontoggle={(t, next, e) => resource.handleToggle(t, next, e)}
					oncategoryclick={(cat) => handleCategoryClick(cat as CategoryId)}
				/>
			{/each}
		</div>
	</DataView>
</div>
