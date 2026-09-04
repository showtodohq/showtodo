<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { Todo, CategoryId } from '$lib/types/todo';
	import { getCategoryConfig } from '$lib/constants/categories';
	import { userStore } from '$lib/stores/user.svelte';
	import { feedStore, todoMutations } from '$lib/stores/todo.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import TodoItem from '$lib/components/todo/TodoItem.svelte';
	import TodoComposer from '$lib/components/todo/TodoComposer.svelte';
	import MyTodayWidget from '$lib/components/widgets/MyTodayWidget.svelte';
	import TrendingTopicsWidget from '$lib/components/widgets/TrendingTopicsWidget.svelte';

	// 分类筛选与顶部发布框联动
	let activeCategoryFilter = $state<CategoryId | null>(null);
	let composerCategory = $state<CategoryId | null>(null);
	let prevUserId = $state<string | undefined>(undefined);

	function handleCategoryFilter(catId: string) {
		if (activeCategoryFilter === catId) {
			activeCategoryFilter = null;
			composerCategory = null;
			goto('/', { replaceState: true, noScroll: true });
		} else {
			activeCategoryFilter = catId as CategoryId;
			composerCategory = catId as CategoryId;
			goto(`/?category=${catId}`, { replaceState: true, noScroll: true });
		}
		feedStore.load(true, activeCategoryFilter, true);
	}

	function handleClearCategoryFilter() {
		activeCategoryFilter = null;
		composerCategory = null;
		goto('/', { replaceState: true, noScroll: true });
		feedStore.load(true, null, true);
	}

	$effect(() => {
		const curUserId = userStore.id;
		if (prevUserId !== undefined && curUserId !== prevUserId) {
			prevUserId = curUserId;
			feedStore.load(true, activeCategoryFilter, true);
		} else if (prevUserId === undefined) {
			prevUserId = curUserId;
		}
	});

	onMount(() => {
		const urlCat = page.url.searchParams.get('category');
		if (urlCat) {
			activeCategoryFilter = urlCat as CategoryId;
			composerCategory = urlCat as CategoryId;
		}
		// 若内存中已有该分类的 Feed 数据，0ms 秒开复用，不重新发起请求也不展示 Spinner
		feedStore.load(true, activeCategoryFilter, false);
	});

	function isMyTodo(todo: Todo): boolean {
		return userStore.isAuthor(todo.authorId, todo.author?.email, todo.author?.handle);
	}
</script>

<div class="w-full space-y-6 sm:space-y-8">
	<!-- 顶部 Twitter / X 风格极简快速发布框 (直接委托 todoMutations) -->
	<TodoComposer
		bind:selectedCategory={composerCategory}
		onsubmit={(data) => todoMutations.createTodo(data)}
	/>

	<!-- 下方主体：左侧最新待办 Feed + 右侧辅助 Widgets 左右双栏布局 -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
		<!-- 左侧主流：最新公开待办动态流 (占 7~8 栏) -->
		<div class="lg:col-span-7 xl:col-span-8 space-y-4">
			<div class="flex items-center justify-between px-1">
				<h2 class="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
					最新动态流 (Latest Stream)
				</h2>

				<!-- 分类筛选激活指示条与一键清除 -->
				{#if activeCategoryFilter}
					{@const catConfig = getCategoryConfig(activeCategoryFilter)}
					<div class="flex items-center gap-1.5 animate-in fade-in duration-150">
						<span class="text-xs text-zinc-400">正在筛选:</span>
						<button
							type="button"
							onclick={handleClearCategoryFilter}
							class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 shadow-2xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer group"
							style="color: {catConfig?.color};"
							title="点击清除分类筛选并恢复全部"
						>
							<span
								class="h-1.5 w-1.5 rounded-full shrink-0"
								style="background-color: {catConfig?.color};"
							></span>
							<span>{catConfig?.name || activeCategoryFilter}</span>
							<span
								class="text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 text-xs ml-0.5"
								>✕</span
							>
						</button>
					</div>
				{/if}
			</div>

			<!-- Feed 内容区 -->
			{#if (!feedStore.loaded || feedStore.loading) && feedStore.todos.length === 0}
				<div class="flex justify-center py-20 text-zinc-400">
					<Spinner size="md" />
				</div>
			{:else if feedStore.todos.length === 0}
				<div
					class="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800/80 py-20 text-center text-xs text-zinc-400"
				>
					{#if activeCategoryFilter}
						{@const catConfig = getCategoryConfig(activeCategoryFilter)}
						暂无「{catConfig?.name || activeCategoryFilter}」类公开待办，在上方发布第一条吧 ✨
					{:else}
						暂无公开待办，在上方发布第一条吧 ✨
					{/if}
				</div>
			{:else}
				<div class="space-y-1 sm:space-y-1.5">
					{#each feedStore.todos as todo (todo.id)}
						<TodoItem
							{todo}
							isMine={isMyTodo(todo)}
							ontoggle={(t, status, e) => todoMutations.toggleStatus(t.id, status, e)}
							onreaction={(t, emoji) => todoMutations.toggleReaction(t.id, emoji)}
							oncategoryclick={handleCategoryFilter}
						/>
					{/each}
				</div>

				<!-- 分页加载更多 -->
				{#if feedStore.nextCursor}
					<div class="pt-4 flex justify-center">
						<button
							type="button"
							onclick={() => feedStore.load(false, activeCategoryFilter)}
							disabled={feedStore.loadingMore}
							class="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer disabled:opacity-50"
						>
							{#if feedStore.loadingMore}
								<Spinner size="xs" />
								<span>加载中...</span>
							{:else}
								<span>加载更多待办</span>
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							{/if}
						</button>
					</div>
				{/if}
			{/if}
		</div>

		<!-- 右侧副栏：辅助与概览组件库 (完全解耦，0 胶水 ref 绑定) -->
		<aside class="lg:col-span-5 xl:col-span-4 space-y-6">
			<!-- 1. 我的今日待办 -->
			<MyTodayWidget />

			<!-- 2. 今日热闹多人待办榜 -->
			<TrendingTopicsWidget
				onJoinTopic={(content, category) => todoMutations.joinTopic({ content, category })}
			/>
		</aside>
	</div>
</div>
