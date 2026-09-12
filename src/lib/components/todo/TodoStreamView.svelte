<script lang="ts">
	import type { createMyTodosResource } from '$lib/stores/resources/use-my-todos.svelte';
	import type { TodoStatus, CategoryId } from '$lib/types/todo';
	import { TODO_STATUSES } from '$lib/constants/status';
	import { CATEGORIES, getCategoryConfig } from '$lib/constants/categories';
	import TodoItem from '$lib/components/todo/TodoItem.svelte';
	import DataView from '$lib/components/ui/DataView.svelte';

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

<div class="space-y-6 sm:space-y-8">
	<!-- 搜索框：参考发布框 TodoComposer 样式的专属大卡片 (大间距留白、通透高质感) -->
	<div
		class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 sm:p-3.5 transition-all duration-200 shadow-2xs focus-within:border-zinc-300 dark:focus-within:border-zinc-700 focus-within:ring-2 focus-within:ring-zinc-900/5 dark:focus-within:ring-white/5"
	>
		<div class="flex items-center gap-3">
			<!-- 左侧图标槽位 (与发布框用户头像尺寸对齐) -->
			<div
				class="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 shrink-0 ring-1 ring-zinc-200/80 dark:ring-zinc-800"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
			</div>

			<!-- 搜索输入正文 (字体与发布框正文同字号与字重，纯留白无边框) -->
			<div class="flex-1 min-w-0 flex items-center">
				<input
					type="search"
					bind:value={resource.searchQuery}
					placeholder="搜索我的待办事项、备注或关键词..."
					class="w-full bg-transparent text-sm font-semibold placeholder:font-normal placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100 focus:outline-hidden leading-relaxed py-1"
				/>
			</div>

			<!-- 清除按钮与快捷键提示 -->
			{#if resource.searchQuery}
				<button
					type="button"
					onclick={() => (resource.searchQuery = '')}
					class="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
					title="清除搜索"
				>
					✕
				</button>
			{/if}
		</div>
	</div>

	<!-- 状态切片与分类胶囊行 (大间距留白，无多余边框) -->
	<div class="space-y-3">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
			<!-- 状态筛选胶囊 (全部 / 待办 / 进行中 / 已完成 / 已放弃) -->
			<div class="inline-flex items-center rounded-2xl bg-zinc-100/90 dark:bg-zinc-800/80 p-1 overflow-x-auto max-w-full scrollbar-none">
				<button
					type="button"
					onclick={() => handleTabChange('all')}
					class="px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap {resource.streamTab === 'all'
						? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
				>
					全部 ({resource.totalCount})
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

			<!-- 分类激活指示条与一键清除 -->
			{#if resource.activeCategory}
				{@const catConfig = getCategoryConfig(resource.activeCategory)}
				<div class="flex items-center gap-1.5 animate-in fade-in duration-150">
					<span class="text-xs text-zinc-400">筛选分类:</span>
					<button
						type="button"
						onclick={handleClearCategory}
						class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer group"
						style="color: {catConfig?.color};"
						title="点击清除分类筛选"
					>
						<span
							class="h-1.5 w-1.5 rounded-full shrink-0"
							style="background-color: {catConfig?.color};"
						></span>
						<span>{catConfig?.name || resource.activeCategory}</span>
						<span
							class="text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 text-xs ml-0.5"
						>✕</span>
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- 待办列表内容区 (通透大间距留白，无外层大盒包裹) -->
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
						没有找到匹配当前筛选条件的待办事项
					{:else}
						暂无待办事项，在上方发布第一条吧 ✨
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
						重置所有筛选
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
