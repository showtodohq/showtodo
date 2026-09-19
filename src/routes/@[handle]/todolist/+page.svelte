<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import type { CategoryId } from '$lib/types/todo';
	import { userStore } from '$lib/stores/user.svelte';
	import { todayStore } from '$lib/stores/today.svelte';
	import { createMyTodosResource } from '$lib/stores/resources/use-my-todos.svelte';
	import BreadcrumbNav from '$lib/components/ui/BreadcrumbNav.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import TodoStreamView from '$lib/components/todo/TodoStreamView.svelte';
	import TodoKanbanView from '$lib/components/todo/TodoKanbanView.svelte';
	import TodoCalendarView from '$lib/components/todo/TodoCalendarView.svelte';
	import TodoStatusIcon from '$lib/components/todo/TodoStatusIcon.svelte';
	import {
		SEARCH_URL_QUERY_PARAM,
		SEARCH_STATUS_QUERY_PARAM,
		SEARCH_CATEGORY_QUERY_PARAM,
		SEARCH_PLACEHOLDERS
	} from '$lib/constants/search';
	import { TODO_STATUSES, getStatusConfig } from '$lib/constants/status';
	import { CATEGORIES, getCategoryConfig } from '$lib/constants/categories';
	import type { TodoStatus } from '$lib/types/todo';
	import ExpandableFilterBar from '$lib/components/ui/ExpandableFilterBar.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import FilterChip from '$lib/components/ui/FilterChip.svelte';
	import { TODOLIST_VIEW_MODES, type TodoListViewMode } from '$lib/constants/tabs';
	import Icon from '@iconify/svelte';

	const handleParam = $derived(page.params.handle);
	const resource = createMyTodosResource();

	// 同步 URL 参数中的 ?view=, ?q=, ?status=, ?category=
	let isUrlInitialized = false;

	$effect(() => {
		if (!isUrlInitialized) {
			const viewParam = page.url.searchParams.get('view');
			const queryParam = page.url.searchParams.get(SEARCH_URL_QUERY_PARAM);
			const statusParam = page.url.searchParams.get(SEARCH_STATUS_QUERY_PARAM);
			const categoryParam = page.url.searchParams.get(SEARCH_CATEGORY_QUERY_PARAM);

			if (viewParam === 'stream' || viewParam === 'kanban' || viewParam === 'calendar') {
				resource.activeView = viewParam;
			}
			if (queryParam) {
				resource.searchQuery = queryParam;
			}
			if (statusParam && (['all', 'pending', 'in_progress', 'done', 'abandoned'] as string[]).includes(statusParam)) {
				resource.streamTab = statusParam as TodoStatus | 'all';
			}
			if (categoryParam) {
				resource.activeCategory = categoryParam as CategoryId;
			}
			isUrlInitialized = true;
		}
	});

	function updateQueryParams(
		view: 'stream' | 'kanban' | 'calendar',
		q: string,
		status: TodoStatus | 'all',
		category: CategoryId | null
	) {
		resource.activeView = view;
		if (typeof window === 'undefined') return;
		const url = new URL(window.location.href);
		if (view === 'stream') {
			url.searchParams.delete('view');
		} else {
			url.searchParams.set('view', view);
		}

		const cleanQ = q.trim();
		if (!cleanQ) {
			url.searchParams.delete(SEARCH_URL_QUERY_PARAM);
		} else {
			url.searchParams.set(SEARCH_URL_QUERY_PARAM, cleanQ);
		}

		if (status === 'all') {
			url.searchParams.delete(SEARCH_STATUS_QUERY_PARAM);
		} else {
			url.searchParams.set(SEARCH_STATUS_QUERY_PARAM, status);
		}

		if (!category) {
			url.searchParams.delete(SEARCH_CATEGORY_QUERY_PARAM);
		} else {
			url.searchParams.set(SEARCH_CATEGORY_QUERY_PARAM, category);
		}

		window.history.replaceState(window.history.state, '', url.pathname + url.search);
	}

	function handleViewSwitch(view: 'stream' | 'kanban' | 'calendar') {
		updateQueryParams(view, resource.searchQuery, resource.streamTab, resource.activeCategory);
	}

	function handleSearch(val: string) {
		resource.searchQuery = val;
		updateQueryParams(resource.activeView, val, resource.streamTab, resource.activeCategory);
	}

	function handleStatusChange(st: TodoStatus | 'all') {
		resource.streamTab = st;
		updateQueryParams(resource.activeView, resource.searchQuery, st, resource.activeCategory);
	}

	function handleCategoryChange(cat: CategoryId | null) {
		resource.activeCategory = resource.activeCategory === cat ? null : cat;
		updateQueryParams(resource.activeView, resource.searchQuery, resource.streamTab, resource.activeCategory);
	}

	function handleClearAllFilters() {
		resource.searchQuery = '';
		resource.streamTab = 'all';
		resource.activeCategory = null;
		updateQueryParams(resource.activeView, '', 'all', null);
	}

	const hasActiveFilters = $derived(
		Boolean(resource.searchQuery.trim() || resource.streamTab !== 'all' || resource.activeCategory)
	);

	const summaryText = $derived.by(() => {
		const parts: string[] = [];
		if (resource.searchQuery.trim()) {
			parts.push(`"${resource.searchQuery.trim()}"`);
		}
		if (resource.streamTab !== 'all') {
			const stConfig = getStatusConfig(resource.streamTab);
			parts.push(stConfig?.label || resource.streamTab);
		}
		if (resource.activeCategory) {
			const catConfig = getCategoryConfig(resource.activeCategory);
			parts.push(catConfig?.name || resource.activeCategory);
		}
		return parts.join(' · ');
	});

	// 监听当前路由 handle 与登录用户变化拉取数据
	let currentLoadedKey = $state<string | null>(null);

	$effect(() => {
		const targetHandle = handleParam;
		const viewerId = userStore.id;
		const key = `${targetHandle}:${viewerId}`;
		if (targetHandle && key !== currentLoadedKey) {
			currentLoadedKey = key;
			untrack(() => {
				void resource.load(targetHandle);
				if (userStore.isAuthor(targetHandle)) {
					void todayStore.load();
				}
			});
		}
	});
</script>

<svelte:head>
	<title>{resource.targetUser ? `${resource.targetUser.nickname}'s Todolist · ShowTodo` : 'Todolist · ShowTodo'}</title>
</svelte:head>

<div class="w-full space-y-6 sm:space-y-8">
	<!-- Breadcrumbs -->
	<BreadcrumbNav
		backHref="/"
		backLabel="Back to Feed"
		crumbs={[
			{ label: 'Feed', href: '/' },
			{ label: `@${handleParam}`, href: `/@${handleParam}` },
			{ label: 'Todolist' }
		]}
	/>

	{#if resource.error === 'User not found'}
		<!-- User not found 404 state -->
		<div
			class="p-8 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3"
		>
			<div class="inline-flex p-3 rounded-2xl bg-red-100/80 dark:bg-red-950/60 text-red-500">
				<Icon icon="lucide:user-x" class="h-6 w-6" />
			</div>
			<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
				User not found
			</div>
			<p class="text-xs text-zinc-500 max-w-sm mx-auto">
				The requested user "@{handleParam}" does not exist or may have changed handle.
			</p>
			<Button variant="outline" size="sm" onclick={() => goto('/')}>
				Back to Feed
			</Button>
		</div>
	{:else}
		<!-- Header Banner: 访客模式展示公开看板标牌 (作者模式不展示发布框) -->
		{#if !resource.isMe && resource.targetUser}
			<div
				class="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
			>
				<div class="flex items-center gap-3">
					<a href={`/@${resource.targetUser.handle}`} class="shrink-0 hover:opacity-90 transition-opacity">
						<Avatar src={resource.targetUser.avatar} name={resource.targetUser.nickname} size="md" />
					</a>
					<div class="space-y-0.5">
						<div class="flex items-center gap-2">
							<a href={`/@${resource.targetUser.handle}`} class="text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:underline">
								{resource.targetUser.nickname}
							</a>
							<span class="text-xs text-zinc-400 font-mono">@{resource.targetUser.handle}</span>
						</div>
						<div class="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
							<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
								<Icon icon="lucide:globe" class="h-3 w-3 text-emerald-500" />
								<span>Public Workbench</span>
							</span>
						</div>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<a
						href={`/@${resource.targetUser.handle}`}
						class="px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors inline-flex items-center gap-1"
					>
						<span>View Profile</span>
						<Icon icon="lucide:arrow-right" class="h-3.5 w-3.5" />
					</a>
				</div>
			</div>
		{/if}

		<!-- Sticky view switcher and search toolbar -->
		<div
			class="sticky top-14 z-20 py-2.5 -mx-4 px-4 sm:-mx-6 sm:px-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-all"
		>
			<ExpandableFilterBar
				bind:query={resource.searchQuery}
				placeholder={SEARCH_PLACEHOLDERS.WORKBENCH}
				{hasActiveFilters}
				{summaryText}
				onsearch={handleSearch}
				onclearall={handleClearAllFilters}
			>
				{#snippet leading()}
					{#snippet streamIcon()}
						<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
						</svg>
					{/snippet}

					{#snippet kanbanIcon()}
						<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
						</svg>
					{/snippet}

					{#snippet calendarIcon()}
						<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					{/snippet}

					{@const viewTabs = [
						{ id: TODOLIST_VIEW_MODES.STREAM, label: 'Stream', icon: streamIcon, hideLabelOnMobile: true },
						{ id: TODOLIST_VIEW_MODES.KANBAN, label: 'Kanban', icon: kanbanIcon, hideLabelOnMobile: true },
						{ id: TODOLIST_VIEW_MODES.CALENDAR, label: 'Calendar', icon: calendarIcon, hideLabelOnMobile: true }
					]}
					<Tabs
						options={viewTabs}
						value={resource.activeView}
						onchange={(val) => handleViewSwitch(val)}
						size="sm"
						class="shrink-0"
					/>
				{/snippet}

				{#snippet filters()}
					<!-- 状态微胶囊组 (全部 / 待办 / 进行中 / 完成 / 放弃) -->
					<div class="flex items-center gap-1.5 flex-wrap text-xs">
						<span class="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium shrink-0">Status:</span>
						<FilterChip
							selected={resource.streamTab === 'all'}
							onclick={() => handleStatusChange('all')}
							badge={resource.totalCount}
						>
							All
						</FilterChip>
						{#each TODO_STATUSES as st}
							<FilterChip
								selected={resource.streamTab === st.id}
								badge={resource.statusCounts[st.id] || 0}
								onclick={() => handleStatusChange(st.id)}
							>
								{#snippet leading()}
									<TodoStatusIcon
										status={st.id}
										size="sm"
										class={resource.streamTab === st.id
											? 'text-current'
											: st.actionColorClass}
									/>
								{/snippet}
								{st.label}
							</FilterChip>
						{/each}
					</div>

					<!-- 分类微胶囊组 (全部 / 学习 / 健身 / 工作 / 生活 等) -->
					<div class="flex items-center gap-1.5 flex-wrap text-xs pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
						<span class="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium shrink-0">Category:</span>
						<FilterChip
							selected={resource.activeCategory === null}
							onclick={() => handleCategoryChange(null)}
						>
							All
						</FilterChip>
						{#each CATEGORIES as cat}
							<FilterChip
								selected={resource.activeCategory === cat.id}
								dotColor={cat.color}
								onclick={() => handleCategoryChange(cat.id)}
							>
								{cat.name}
							</FilterChip>
						{/each}
					</div>
				{/snippet}
			</ExpandableFilterBar>
		</div>

		<!-- Views -->
		<div>
			{#if resource.activeView === 'stream'}
				<TodoStreamView {resource} />
			{:else if resource.activeView === 'kanban'}
				<TodoKanbanView {resource} />
			{:else if resource.activeView === 'calendar'}
				<TodoCalendarView {resource} />
			{/if}
		</div>
	{/if}
</div>
