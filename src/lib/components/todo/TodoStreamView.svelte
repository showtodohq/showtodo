<script lang="ts">
	import type { createMyTodosResource } from '$lib/stores/resources/use-my-todos.svelte';
	import type { CategoryId } from '$lib/types/todo';
	import TodoItem from '$lib/components/todo/TodoItem.svelte';
	import DataView from '$lib/components/ui/DataView.svelte';
	import FeedSkeleton from '$lib/components/skeleton/FeedSkeleton.svelte';

	interface Props {
		resource: ReturnType<typeof createMyTodosResource>;
	}

	let { resource }: Props = $props();

	function handleCategoryClick(catId: CategoryId) {
		if (resource.activeCategory === catId) {
			resource.activeCategory = null;
		} else {
			resource.activeCategory = catId;
		}
	}
</script>

<div class="space-y-4">

	<!-- Content area -->
	<DataView
		loading={resource.loading}
		empty={resource.streamFilteredTodos.length === 0}
	>
		{#snippet skeleton()}
			<FeedSkeleton count={3} />
		{/snippet}

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
