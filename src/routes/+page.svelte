<script lang="ts">
	import type { PageData } from './$types';
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { Todo, CategoryId } from '$lib/types/todo';
	import { getCategoryConfig } from '$lib/constants/categories';
	import { userStore } from '$lib/stores/user.svelte';
	import { feedStore, trendingStore, todoMutations } from '$lib/stores/todo.svelte';
	import { statsStore } from '$lib/stores/stats.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import DataView from '$lib/components/ui/DataView.svelte';
	import FeedSkeleton from '$lib/components/skeleton/FeedSkeleton.svelte';
	import TodoItem from '$lib/components/todo/TodoItem.svelte';
	import TodoComposer from '$lib/components/todo/TodoComposer.svelte';
	import MyTodayWidget from '$lib/components/widgets/MyTodayWidget.svelte';
	import TrendingTopicsWidget from '$lib/components/widgets/TrendingTopicsWidget.svelte';
	import SiteStatsWidget from '$lib/components/widgets/SiteStatsWidget.svelte';
	import { getHomeSeo } from '$lib/constants/seo';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import Icon from '@iconify/svelte';

	let { data }: { data: PageData } = $props();

	// SSR 同步水合首屏实体与状态
	untrack(() => {
		feedStore.hydrate(data.feed);
		if (data.stats) {
			statsStore.hydrate(data.stats);
		}
		if (data.trendingCards) {
			trendingStore.hydrate(data.trendingCards);
		}
	});

	// 分类筛选与顶部发布框联动
	let activeCategoryFilter = $state<CategoryId | null>(null);
	let composerCategory = $state<CategoryId | null>(null);

	const homeSeo = $derived(getHomeSeo(activeCategoryFilter));

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
	}

	function handleClearCategoryFilter() {
		activeCategoryFilter = null;
		composerCategory = null;
		goto('/', { replaceState: true, noScroll: true });
	}

	$effect(() => {
		const category = (page.url.searchParams.get('category') as CategoryId | null) ?? data.feed.category;
		activeCategoryFilter = category;
		composerCategory = category;

		// 当 SvelteKit 服务端重新加载数据或路由切换时同步水合
		if (data.feed && (feedStore.activeCategory !== data.feed.category || !feedStore.loaded)) {
			feedStore.hydrate(data.feed);
		}
		if (data.stats) {
			statsStore.hydrate(data.stats);
		}
		if (data.trendingCards) {
			trendingStore.hydrate(data.trendingCards);
		}
	});

	function isMyTodo(todo: Todo): boolean {
		return userStore.isAuthor(todo.authorId, todo.author?.email, todo.author?.handle);
	}
</script>

<SeoHead seo={homeSeo} />

<div class="w-full space-y-6 sm:space-y-8">
	<!-- Top composer -->
	<TodoComposer
		bind:selectedCategory={composerCategory}
		onsubmit={(data) => todoMutations.createTodo(data)}
	/>

	<!-- Main grid -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
		<!-- Left stream -->
		<div class="lg:col-span-7 xl:col-span-8 space-y-4">
			<div class="flex items-center justify-between px-1">
				<h2 class="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
					Latest Stream
				</h2>

				<!-- Category filter tag -->
				{#if activeCategoryFilter}
					{@const catConfig = getCategoryConfig(activeCategoryFilter)}
					<div class="flex items-center gap-1.5 animate-in fade-in duration-150">
						<span class="text-xs text-zinc-400">Filtering:</span>
						<button
							type="button"
							onclick={handleClearCategoryFilter}
							class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 shadow-2xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer group"
							style="color: {catConfig?.color};"
							title="Clear filter and view all"
						>
							<span
								class="h-1.5 w-1.5 rounded-full shrink-0"
								style="background-color: {catConfig?.color};"
							></span>
							<span>{catConfig?.name || activeCategoryFilter}</span>
							<Icon icon="lucide:x" class="h-3 w-3 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 ml-0.5" />
						</button>
					</div>
				{/if}
			</div>

			<!-- Feed content -->
			<DataView
				loading={!feedStore.loaded || feedStore.loading}
				empty={feedStore.todos.length === 0}
			>
				{#snippet skeleton()}
					<FeedSkeleton count={3} />
				{/snippet}

				{#snippet emptyView()}
					<div
						class="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800/80 py-20 text-center text-xs text-zinc-400"
					>
						{#if activeCategoryFilter}
							{@const catConfig = getCategoryConfig(activeCategoryFilter)}
							No public todos in "{catConfig?.name || activeCategoryFilter}". Create the first one above!
						{:else}
							No public todos yet. Create the first one above!
						{/if}
					</div>
				{/snippet}

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

				<!-- Pagination -->
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
								<span>Loading...</span>
							{:else}
								<span>Load more todos</span>
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
			</DataView>
		</div>

		<!-- 右侧副栏：辅助与概览组件库 (完全解耦，0 胶水 ref 绑定) -->
		<aside class="lg:col-span-5 xl:col-span-4 space-y-4 sm:space-y-5">
			<!-- 1. 我的今日待办 -->
			<MyTodayWidget />

			<!-- 2. 今日热闹多人待办榜 -->
			<TrendingTopicsWidget
				onJoinTopic={(content, category) => todoMutations.joinTopic({ content, category })}
			/>

			<!-- 3. 全站数据统计脉搏卡片 -->
			<SiteStatsWidget />
		</aside>
	</div>
</div>
