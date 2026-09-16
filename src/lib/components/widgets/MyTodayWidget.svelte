<script lang="ts">
	import { untrack } from 'svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { todayStore, todoMutations } from '$lib/stores/todo.svelte';
	import DataView from '$lib/components/ui/DataView.svelte';
	import WidgetSkeleton from '$lib/components/skeleton/WidgetSkeleton.svelte';
	import TodoCheckbox from '$lib/components/todo/TodoCheckbox.svelte';
	import TodoContent from '$lib/components/todo/TodoContent.svelte';
	import Icon from '@iconify/svelte';

	$effect(() => {
		const viewerId = userStore.id;
		untrack(() => {
			void viewerId;
			void todayStore.load();
		});
	});
</script>

{#if userStore.email}
	<div
		class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white/60 dark:bg-zinc-950/60 p-4 backdrop-blur-xs space-y-3"
	>
		<!-- Header bar: unified pattern with icon, full title, badge and action link -->
		<div class="flex items-center justify-between">
			<a
				href="/todos"
				class="flex items-center gap-2 font-semibold text-xs text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group/title"
				title="Open My Todos workbench"
			>
				<div class="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
					<Icon icon="lucide:check-circle-2" class="h-3.5 w-3.5" />
				</div>
				<span>My Today's Todos</span>
			</a>

			<div class="flex items-center gap-1.5 font-mono text-xs">
				{#if todayStore.totalCount > 0}
					<span class="text-[10px] text-zinc-400">
						<strong class="font-semibold text-zinc-800 dark:text-zinc-200">{todayStore.doneCount}</strong>/{todayStore.totalCount}
					</span>
					<span class="text-[10px] text-zinc-300 dark:text-zinc-700">·</span>
				{/if}

				<a
					href="/todos"
					class="inline-flex items-center gap-0.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors group/link cursor-pointer font-sans"
					title="Go to My Todos workbench"
				>
					<span>View all</span>
					<Icon icon="lucide:arrow-right" class="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
				</a>
			</div>
		</div>

		<!-- Todos content -->
		<DataView
			loading={!todayStore.loaded || todayStore.loading}
			empty={todayStore.todos.length === 0}
		>
			{#snippet skeleton()}
				<WidgetSkeleton rows={2} />
			{/snippet}

			{#snippet emptyView()}
				<div class="py-3 text-center text-xs text-zinc-400">
					No todos for today yet. Write one above!
				</div>
			{/snippet}

			<div class="space-y-1.5">
				{#each todayStore.todos as todo (todo.id)}
					<div
						class="flex items-center justify-between gap-2 py-2 px-2.5 rounded-xl hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 transition-all duration-150 group/item"
					>
						<!-- 统一 TodoContent 组件 (紧凑截断模式，点击进入详情) -->
						<a
							href="/todos/{todo.shortId || todo.id}"
							class="flex-1 min-w-0 group/link focus:outline-hidden"
							title="View todo details"
						>
							<TodoContent
								content={todo.content}
								status={todo.status}
								size="xs"
								truncate={true}
								class="group-hover/link:text-zinc-600 dark:group-hover/link:text-zinc-300 transition-colors cursor-pointer"
							/>
						</a>

						<!-- 统一 TodoCheckbox 组件 -->
						<TodoCheckbox
							status={todo.status}
							isMine={true}
							size="sm"
							ontoggle={(nextStatus, e) => todoMutations.toggleStatus(todo.id, nextStatus, e)}
						/>
					</div>
				{/each}
			</div>
		</DataView>
	</div>
{/if}
