<script lang="ts">
	import { untrack } from 'svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { todayStore, todoMutations } from '$lib/stores/todo.svelte';
	import DataView from '$lib/components/ui/DataView.svelte';
	import WidgetSkeleton from '$lib/components/skeleton/WidgetSkeleton.svelte';
	import TodoCheckbox from '$lib/components/todo/TodoCheckbox.svelte';
	import TodoContent from '$lib/components/todo/TodoContent.svelte';

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
		<!-- 头部标题与今日进度 + 全部入口 -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-1.5 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
				<span>📌 我的今日待办</span>
			</div>

			<div class="flex items-center gap-2">
				{#if todayStore.totalCount > 0}
					<div class="font-mono text-xs text-zinc-400">
						<strong class="font-semibold text-zinc-800 dark:text-zinc-200">{todayStore.doneCount}</strong>/{todayStore.totalCount}
					</div>
				{/if}

				<a
					href="/todos"
					class="inline-flex items-center gap-0.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors font-medium group/all cursor-pointer"
					title="进入我的待办清单工作台"
				>
					<span>全部</span>
					<svg class="h-3 w-3 transition-transform duration-150 group-hover/all:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</a>
			</div>
		</div>

		<!-- 待办清单内容 -->
		<DataView
			loading={!todayStore.loaded || todayStore.loading}
			empty={todayStore.todos.length === 0}
		>
			{#snippet skeleton()}
				<WidgetSkeleton rows={2} />
			{/snippet}

			{#snippet emptyView()}
				<div class="py-3 text-center text-xs text-zinc-400">
					今天还没有发布待办，在上方写一个吧 ✨
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
							title="查看待办详情"
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
