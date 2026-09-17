<script lang="ts">
	import { onMount } from 'svelte';
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

	const topicsRes = createTopicsResource();

	let searchInput = $state('');
	let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	type ViewTab = 'all' | 'today' | 'mine';
	const activeTab = $derived<ViewTab>(
		topicsRes.scope === 'mine'
			? 'mine'
			: topicsRes.timeRange === 'today'
				? 'today'
				: 'all'
	);

	function updateTabQuery(tab: ViewTab) {
		if (typeof window === 'undefined') return;
		const url = new URL(window.location.href);
		if (tab === 'all') {
			url.searchParams.delete('tab');
		} else {
			url.searchParams.set('tab', tab);
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
		updateTabQuery(tab);
	}

	let isUrlInitialized = false;
	$effect(() => {
		if (!isUrlInitialized) {
			const tabParam = page.url.searchParams.get('tab') as ViewTab | null;
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

	function handleSearchChange(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		searchInput = val;
		if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
		searchDebounceTimer = setTimeout(() => {
			topicsRes.setSearch(val);
		}, 300);
	}

	onMount(() => {
		topicsRes.load(true);
	});
</script>

<svelte:head>
	<title>Goals · ShowTodo</title>
</svelte:head>

<div class="w-full space-y-5 sm:space-y-6">
	<!-- Page title bar -->
	<div class="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/60">
		<div class="flex items-center gap-2">
			<span class="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
				Goals
			</span>
			{#if topicsRes.loaded}
				<span class="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
					{topicsRes.total} goals
				</span>
			{/if}
		</div>
		<span class="text-xs text-zinc-400 font-mono hidden sm:inline">Shared Goals · Pursued Together</span>
	</div>

	<!-- Filter & control bar -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
		<!-- Left: tabs (All Goals / Active Today / My Goals) + Group filter -->
		<div class="flex items-center gap-2 flex-wrap">
			<div class="inline-flex items-center rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 p-0.5">
				<button
					type="button"
					onclick={() => handleTabSwitch('all')}
					class="px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer {activeTab === 'all'
						? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
				>
					All Goals
				</button>
				<button
					type="button"
					onclick={() => handleTabSwitch('today')}
					class="px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer {activeTab === 'today'
						? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
				>
					Active Today
				</button>
				<button
					type="button"
					onclick={() => handleTabSwitch('mine')}
					class="px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer {activeTab === 'mine'
						? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
				>
					My Goals
				</button>
			</div>

			<!-- Group filter chip (>=2 participants) -->
			<button
				type="button"
				onclick={() => topicsRes.setMinParticipants(topicsRes.minParticipants > 1 ? 1 : 2)}
				class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer {topicsRes.minParticipants > 1
					? 'bg-amber-100/80 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 font-semibold'
					: 'bg-zinc-100/80 hover:bg-zinc-200/70 text-zinc-600 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:text-zinc-400'}"
				title="Toggle showing goals with 2 or more participants"
			>
				<Icon icon="lucide:users" class="h-3.5 w-3.5 shrink-0" />
				<span>Group Goals</span>
			</button>
		</div>

		<!-- Right: Sorting & search -->
		<div class="flex items-center gap-2">
			<div class="relative inline-flex items-center">
				<select
					value={topicsRes.sortBy}
					onchange={(e) => topicsRes.setSortBy((e.target as HTMLSelectElement).value as any)}
					class="appearance-none h-8 pl-3 pr-7 rounded-xl text-xs font-medium bg-zinc-100/80 hover:bg-zinc-200/70 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-200 focus:outline-hidden cursor-pointer transition-colors"
					title="Sort by"
				>
					<option value="participants">Most Participants</option>
					<option value="recent">Recently Active</option>
					<option value="completion">Completion Rate</option>
				</select>
				<Icon icon="lucide:chevron-down" class="absolute right-2 top-2.5 h-3 w-3 pointer-events-none text-zinc-400" />
			</div>

			<!-- Search -->
			<div class="relative flex-1 sm:w-44">
				<input
					type="text"
					value={searchInput}
					oninput={handleSearchChange}
					placeholder="Search goals..."
					class="w-full h-8 pl-8 pr-3 text-xs rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition-all"
				/>
				<Icon icon="lucide:search" class="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
			</div>
		</div>
	</div>

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
				<div class="inline-flex p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400">
					<Icon icon="lucide:sprout" class="h-6 w-6" />
				</div>
				<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
					No matching goals found
				</div>
				<p class="text-xs text-zinc-400 max-w-sm mx-auto">
					Try clearing filters or search terms, or publish a todo from the feed to start a new goal!
				</p>
				<div class="pt-2">
					<Button
						variant="outline"
						size="sm"
						onclick={() => {
							topicsRes.setScope('all');
							topicsRes.setTimeRange('all');
							topicsRes.setSearch('');
							topicsRes.setMinParticipants(1);
							searchInput = '';
							updateTabQuery('all');
						}}
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
							<span>Load more goals</span>
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
