<script lang="ts">
	import type { PageData } from './$types';
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import { userStore } from '$lib/stores/user.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { createTopicsResource } from '$lib/stores/resources/use-topics.svelte';
	import DataView from '$lib/components/ui/DataView.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import TopicCard from '$lib/components/topic/TopicCard.svelte';
	import TopicListSkeleton from '$lib/components/skeleton/TopicListSkeleton.svelte';
	import Icon from '@iconify/svelte';

	import {
		SEARCH_URL_QUERY_PARAM,
		SEARCH_PEOPLE_QUERY_PARAM,
		SEARCH_SORT_QUERY_PARAM,
		SEARCH_PLACEHOLDERS,
		TRENDING_SORT_OPTIONS,
		type TrendingSortBy
	} from '$lib/constants/search';
	import ExpandableFilterBar from '$lib/components/ui/ExpandableFilterBar.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import FilterChip from '$lib/components/ui/FilterChip.svelte';
	import { TRENDING_SCOPE_TABS, type TrendingScopeMode } from '$lib/constants/tabs';
	import { getTrendingSeo } from '$lib/constants/seo';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';

	let { data }: { data: PageData } = $props();

	const topicsRes = createTopicsResource(untrack(() => ({ topics: data.topics, total: data.total })));

	let searchInput = $state('');

	type ViewTab = 'all' | 'today' | 'mine';
	const activeTab = $derived<ViewTab>(
		topicsRes.scope === 'mine'
			? 'mine'
			: topicsRes.timeRange === 'today'
				? 'today'
				: 'all'
	);

	function updateUrlQuery(
		tab: ViewTab,
		q: string,
		minPart: number,
		sort: 'participants' | 'recent' | 'completion'
	) {
		if (typeof window === 'undefined') return;
		const url = new URL(window.location.href);
		if (tab === 'all') {
			url.searchParams.delete('tab');
		} else {
			url.searchParams.set('tab', tab);
		}

		const cleanQuery = q.trim();
		if (!cleanQuery) {
			url.searchParams.delete(SEARCH_URL_QUERY_PARAM);
		} else {
			url.searchParams.set(SEARCH_URL_QUERY_PARAM, cleanQuery);
		}

		if (minPart <= 1) {
			url.searchParams.delete(SEARCH_PEOPLE_QUERY_PARAM);
		} else {
			url.searchParams.set(SEARCH_PEOPLE_QUERY_PARAM, String(minPart));
		}

		if (sort === 'participants') {
			url.searchParams.delete(SEARCH_SORT_QUERY_PARAM);
		} else {
			url.searchParams.set(SEARCH_SORT_QUERY_PARAM, sort);
		}

		window.history.replaceState(window.history.state, '', url.pathname + url.search);
	}

	function handleTabSwitch(tab: ViewTab) {
		if (tab === 'mine') {
			if (!userStore.email) {
				toast.info('Please link your email in the top-right menu first');
				return;
			}
			topicsRes.setTimeRange('all');
			topicsRes.setScope('mine');
		} else if (tab === 'today') {
			topicsRes.setScope('all');
			topicsRes.setTimeRange('today');
		} else {
			topicsRes.setScope('all');
			topicsRes.setTimeRange('all');
		}
		updateUrlQuery(tab, searchInput, topicsRes.minParticipants, topicsRes.sortBy);
	}

	let isUrlInitialized = false;
	$effect(() => {
		if (!isUrlInitialized) {
			const tabParam = page.url.searchParams.get('tab') as ViewTab | null;
			const queryParam = page.url.searchParams.get(SEARCH_URL_QUERY_PARAM);
			const minParam = page.url.searchParams.get(SEARCH_PEOPLE_QUERY_PARAM);
			const sortParam = page.url.searchParams.get(SEARCH_SORT_QUERY_PARAM);

			if (queryParam) {
				searchInput = queryParam;
				topicsRes.setSearch(queryParam);
			}

			if (minParam) {
				const num = parseInt(minParam, 10);
				if (!isNaN(num) && num > 1) {
					topicsRes.setMinParticipants(num);
				}
			}

			if (sortParam && ['participants', 'recent', 'completion'].includes(sortParam)) {
				topicsRes.setSortBy(sortParam as any);
			}

			if (tabParam === 'today') {
				topicsRes.setScope('all');
				topicsRes.setTimeRange('today');
			} else if (tabParam === 'mine') {
				if (userStore.email) {
					topicsRes.setTimeRange('all');
					topicsRes.setScope('mine');
				}
			}
			isUrlInitialized = true;
		}
	});

	function handleSearch(val: string) {
		searchInput = val;
		topicsRes.setSearch(val);
		updateUrlQuery(activeTab, val, topicsRes.minParticipants, topicsRes.sortBy);
	}

	function handleToggleMinParticipants() {
		const next = topicsRes.minParticipants > 1 ? 1 : 2;
		topicsRes.setMinParticipants(next);
		updateUrlQuery(activeTab, searchInput, next, topicsRes.sortBy);
	}

	function handleSortChange(sort: 'participants' | 'recent' | 'completion') {
		topicsRes.setSortBy(sort);
		updateUrlQuery(activeTab, searchInput, topicsRes.minParticipants, sort);
	}

	function handleClearAllTrendingFilters() {
		searchInput = '';
		topicsRes.setSearch('');
		topicsRes.setMinParticipants(1);
		topicsRes.setSortBy('participants');
		updateUrlQuery(activeTab, '', 1, 'participants');
	}

	const hasActiveFilters = $derived(
		Boolean(searchInput.trim() || topicsRes.minParticipants > 1 || topicsRes.sortBy !== 'participants')
	);

	const summaryText = $derived.by(() => {
		const parts: string[] = [];
		if (searchInput.trim()) {
			parts.push(`"${searchInput.trim()}"`);
		}
		if (topicsRes.minParticipants > 1) {
			parts.push('2+ People');
		}
		if (topicsRes.sortBy === 'recent') {
			parts.push('Recent');
		} else if (topicsRes.sortBy === 'completion') {
			parts.push('Completion');
		}
		return parts.join(' · ');
	});

	const trendingSeo = $derived(getTrendingSeo(searchInput));

	onMount(() => {
		if (!topicsRes.loaded) {
			topicsRes.load(true);
		}
	});
</script>

<SeoHead seo={trendingSeo} />

<div class="w-full space-y-5 sm:space-y-6">
	<!-- Page title bar -->
	<div class="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/60">
		<div class="flex items-center gap-2">
			<span class="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
				Trending Todos
			</span>
			{#if topicsRes.loaded}
				<span class="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
					{topicsRes.total} trending
				</span>
			{/if}
		</div>
	</div>

	<!-- Filter & control bar: ExpandableFilterBar (整合大Tab + 话题搜索 + 2+人同行 + 排序规则) -->
	<ExpandableFilterBar
		bind:query={searchInput}
		placeholder={SEARCH_PLACEHOLDERS.TRENDING}
		{hasActiveFilters}
		{summaryText}
		onsearch={handleSearch}
		onclearall={handleClearAllTrendingFilters}
	>
		{#snippet leading()}
			<!-- Left: Primary scope tabs (All / Today / Mine) - 使用统一规范 Tabs 组件 -->
			<Tabs
				options={TRENDING_SCOPE_TABS}
				value={activeTab}
				onchange={(val) => handleTabSwitch(val)}
				size="sm"
				class="shrink-0"
			/>
		{/snippet}

		{#snippet filters()}
			<div class="space-y-2 text-xs pt-0.5">
				<!-- 维度 1: 门槛/人群 -->
				<div class="flex items-center gap-1.5 flex-wrap">
					<span class="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium shrink-0">Filter:</span>
					<FilterChip
						selected={topicsRes.minParticipants > 1}
						onclick={handleToggleMinParticipants}
						title="Filter goals with 2 or more participants"
					>
						{#snippet leading()}
							<Icon icon="lucide:users" class="h-3.5 w-3.5" />
						{/snippet}
						2+ People
					</FilterChip>
				</div>

				<!-- 维度 2: 排序方式 (平铺微胶囊) -->
				<div class="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
					<span class="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium shrink-0">Sort:</span>
					{#each TRENDING_SORT_OPTIONS as opt}
						<FilterChip
							selected={topicsRes.sortBy === opt.id}
							onclick={() => handleSortChange(opt.id)}
						>
							{opt.label}
						</FilterChip>
					{/each}
				</div>
			</div>
		{/snippet}
	</ExpandableFilterBar>

	<!-- List content -->
	<DataView
		loading={!topicsRes.loaded || topicsRes.loading}
		empty={topicsRes.topics.length === 0}
		error={topicsRes.error}
	>
		{#snippet skeleton()}
			<TopicListSkeleton count={4} />
		{/snippet}

		{#snippet emptyView()}
			<div
				class="p-10 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-3 bg-white/40 dark:bg-zinc-900/20"
			>
				<div class="inline-flex p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
					<Icon icon="lucide:sprout" class="h-6 w-6" />
				</div>
				<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
					No matching trending todos.
				</div>
				<div class="pt-2">
					<Button
						variant="outline"
						size="sm"
						onclick={handleClearAllTrendingFilters}
					>
						Reset all filters
					</Button>
				</div>
			</div>
		{/snippet}

		{#snippet errorView(msg)}
			<div
				class="p-8 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3"
			>
				<div class="inline-flex p-3 rounded-2xl bg-red-100/80 dark:bg-red-950/60 text-red-500">
					<Icon icon="lucide:alert-triangle" class="h-6 w-6" />
				</div>
				<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
					{msg}
				</div>
				<Button variant="outline" size="sm" onclick={() => topicsRes.load(true)}>
					Reload
				</Button>
			</div>
		{/snippet}

		<div class="space-y-2.5 sm:space-y-3">
			{#each topicsRes.topics as topic (topic.topicHash)}
				<TopicCard
					{topic}
					onjoin={(t) => topicsRes.handleJoin(t)}
				/>
			{/each}

			<!-- Load more -->
			{#if topicsRes.hasMore}
				<div class="pt-4 flex justify-center">
					<button
						type="button"
						onclick={() => topicsRes.loadMore()}
						disabled={topicsRes.loadingMore}
						class="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer disabled:opacity-50"
					>
						{#if topicsRes.loadingMore}
							<Spinner size="xs" />
							<span>Loading...</span>
						{:else}
							<span>Load more</span>
							<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						{/if}
					</button>
				</div>
			{/if}
		</div>
	</DataView>
</div>
