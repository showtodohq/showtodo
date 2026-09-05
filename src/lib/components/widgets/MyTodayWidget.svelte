<script lang="ts">
	import { userStore } from '$lib/stores/user.svelte';
	import { todayStore, todoMutations } from '$lib/stores/todo.svelte';
	import DataView from '$lib/components/ui/DataView.svelte';
	import WidgetSkeleton from '$lib/components/skeleton/WidgetSkeleton.svelte';
	import TodoCheckbox from '$lib/components/todo/TodoCheckbox.svelte';
	import TodoContent from '$lib/components/todo/TodoContent.svelte';

	$effect(() => {
		if (userStore.id || userStore.email) {
			todayStore.load();
		}
	});
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

			{#if todayStore.totalCount > 0}
				<div class="font-mono text-xs text-zinc-400">
					<strong class="font-semibold text-zinc-800 dark:text-zinc-200">{todayStore.doneCount}</strong>/{todayStore.totalCount}
				</div>
			{/if}
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
						class="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 transition-colors group/item"
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
