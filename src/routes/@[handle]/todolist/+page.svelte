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
	import TodoComposer from '$lib/components/todo/TodoComposer.svelte';
	import TodoStreamView from '$lib/components/todo/TodoStreamView.svelte';
	import TodoKanbanView from '$lib/components/todo/TodoKanbanView.svelte';
	import TodoCalendarView from '$lib/components/todo/TodoCalendarView.svelte';
	import {
		SEARCH_URL_QUERY_PARAM,
		SEARCH_PLACEHOLDERS
	} from '$lib/constants/search';
	import SearchInput from '$lib/components/ui/SearchInput.svelte';
	import Icon from '@iconify/svelte';

	const handleParam = $derived(page.params.handle);
	const resource = createMyTodosResource();

	let composerCategory = $state<CategoryId | null>(null);

	// 同步 URL 参数中的 ?view= 和 ?q=
	let isUrlInitialized = false;

	$effect(() => {
		if (!isUrlInitialized) {
			const viewParam = page.url.searchParams.get('view');
			const queryParam = page.url.searchParams.get(SEARCH_URL_QUERY_PARAM);

			if (viewParam === 'stream' || viewParam === 'kanban' || viewParam === 'calendar') {
				resource.activeView = viewParam;
			}
			if (queryParam) {
				resource.searchQuery = queryParam;
			}
			isUrlInitialized = true;
		}
	});

	function updateQueryParams(view: 'stream' | 'kanban' | 'calendar', q: string) {
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
		window.history.replaceState(window.history.state, '', url.pathname + url.search);
	}

	function handleViewSwitch(view: 'stream' | 'kanban' | 'calendar') {
		updateQueryParams(view, resource.searchQuery);
	}

	function handleSearch(val: string) {
		resource.searchQuery = val;
		updateQueryParams(resource.activeView, val);
	}

	function handleClearSearch() {
		resource.searchQuery = '';
		updateQueryParams(resource.activeView, '');
	}

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
		<!-- Header Banner: 作者模式展示发布框，访客模式展示公开看板标牌 -->
		{#if resource.isMe}
			<TodoComposer
				bind:selectedCategory={composerCategory}
				placeholder="Write down a goal, press Enter to plan..."
				onsubmit={(data) => resource.createTodo(data)}
			/>
		{:else if resource.targetUser}
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
			class="sticky top-14 z-20 py-2.5 -mx-4 px-4 sm:-mx-6 sm:px-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-all flex flex-wrap sm:flex-nowrap items-center justify-between gap-3"
		>
			<!-- View switcher pills (Stream / Kanban / Calendar) -->
			<div class="inline-flex items-center rounded-2xl bg-zinc-100/90 dark:bg-zinc-800/80 p-1 text-xs font-medium shadow-2xs shrink-0">
				<!-- Stream view -->
				<button
					type="button"
					onclick={() => handleViewSwitch('stream')}
					class="inline-flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-1.5 rounded-xl font-medium transition-all cursor-pointer {resource.activeView === 'stream'
						? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
					title="Stream view"
					aria-label="Stream view"
				>
					<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
					</svg>
					<span class="hidden sm:inline">Stream</span>
				</button>

				<!-- Kanban view -->
				<button
					type="button"
					onclick={() => handleViewSwitch('kanban')}
					class="inline-flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-1.5 rounded-xl font-medium transition-all cursor-pointer {resource.activeView === 'kanban'
						? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
					title="Kanban view"
					aria-label="Kanban view"
				>
					<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
					</svg>
					<span class="hidden sm:inline">Kanban</span>
				</button>

				<!-- Calendar view -->
				<button
					type="button"
					onclick={() => handleViewSwitch('calendar')}
					class="inline-flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-1.5 rounded-xl font-medium transition-all cursor-pointer {resource.activeView === 'calendar'
						? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
					title="Calendar view"
					aria-label="Calendar view"
				>
					<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					<span class="hidden sm:inline">Calendar</span>
				</button>
			</div>

			<!-- Universal Workbench Search Bar -->
			<div class="flex-1 min-w-[180px] sm:max-w-xs order-3 sm:order-2 w-full sm:w-auto">
				<SearchInput
					value={resource.searchQuery}
					placeholder={SEARCH_PLACEHOLDERS.WORKBENCH}
					enableGlobalShortcut={true}
					onsearch={handleSearch}
					onclear={handleClearSearch}
				/>
			</div>

			<!-- Metrics summary -->
			<div class="text-xs font-mono text-zinc-400 shrink-0 order-2 sm:order-3 ml-auto sm:ml-0">
				<span class="hidden sm:inline">{resource.statusCounts.done}/{resource.totalCount} completed ({resource.completionRate}%)</span>
				<span class="sm:hidden px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-medium">
					{resource.statusCounts.done}/{resource.totalCount}
				</span>
			</div>
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
