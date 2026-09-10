<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { TODO_STATUSES } from '$lib/constants/status';
	import { getCategoryConfig } from '$lib/constants/categories';
	import type { TodoStatus, CategoryId } from '$lib/types/todo';
	import { createUserProfileResource } from '$lib/stores/resources/use-user-profile.svelte';
	import DataView from '$lib/components/ui/DataView.svelte';
	import BackToSquare from '$lib/components/ui/BackToSquare.svelte';
	import UserProfileSkeleton from '$lib/components/skeleton/UserProfileSkeleton.svelte';
	import FeedSkeleton from '$lib/components/skeleton/FeedSkeleton.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TodoItem from '$lib/components/todo/TodoItem.svelte';
	import UserProfileCard from '$lib/components/user/UserProfileCard.svelte';
	import UserStatsGrid from '$lib/components/user/UserStatsGrid.svelte';
	import ActivityHeatmap from '$lib/components/stats/ActivityHeatmap.svelte';

	const profileRes = createUserProfileResource(page.params.id);

	let isUrlInitialized = false;

	$effect(() => {
		if (!isUrlInitialized) {
			const statusParam = page.url.searchParams.get('status');
			const categoryParam = page.url.searchParams.get('category');
			if (
				statusParam &&
				(['all', 'pending', 'in_progress', 'done', 'abandoned'] as string[]).includes(statusParam)
			) {
				profileRes.activeTab = statusParam as TodoStatus | 'all';
			}
			if (categoryParam) {
				profileRes.activeCategory = categoryParam as CategoryId;
			}
			isUrlInitialized = true;
		}
	});

	function updateQueryParams(tab: TodoStatus | 'all', cat: CategoryId | null) {
		if (typeof window === 'undefined') return;
		const url = new URL(window.location.href);
		if (tab === 'all') {
			url.searchParams.delete('status');
		} else {
			url.searchParams.set('status', tab);
		}
		if (!cat) {
			url.searchParams.delete('category');
		} else {
			url.searchParams.set('category', cat);
		}
		// 原生静默更新地址栏，不触发任何 SvelteKit 导航或组件重新执行
		window.history.replaceState(window.history.state, '', url.pathname + url.search);
	}

	function handleTabChange(tab: TodoStatus | 'all') {
		profileRes.activeTab = tab;
		updateQueryParams(profileRes.activeTab, profileRes.activeCategory);
	}

	function handleCategoryClick(catId: string) {
		if (profileRes.activeCategory === catId) {
			profileRes.activeCategory = null;
		} else {
			profileRes.activeCategory = catId as CategoryId;
		}
		updateQueryParams(profileRes.activeTab, profileRes.activeCategory);
	}

	function handleClearCategory() {
		profileRes.activeCategory = null;
		updateQueryParams(profileRes.activeTab, null);
	}

	let currentLoadedId = $state<string | null>(null);

	$effect(() => {
		const paramId = page.params.id;
		if (paramId && paramId !== currentLoadedId) {
			currentLoadedId = paramId;
			profileRes.load(paramId);
		}
	});

	async function onSaveProfile(data: {
		nickname: string;
		handle: string;
		avatar: string | null;
	}) {
		const updatedUser = await profileRes.handleSaveProfile(data);
		// 若 handle 发生变更，无感替换浏览器地址栏路由，防止刷新 404 或分享旧失效链接
		if (updatedUser && page.params.id && page.params.id !== updatedUser.handle) {
			goto(`/users/${updatedUser.handle}`, { replaceState: true, noScroll: true });
		}
	}
</script>

<svelte:head>
	<title>{profileRes.user ? `${profileRes.user.nickname} (@${profileRes.user.handle}) - 个人主页` : '用户主页 - Public Todo'}</title>
</svelte:head>

<div class="w-full space-y-6 sm:space-y-8">
	<DataView
		loading={profileRes.loading}
		empty={!profileRes.user}
		error={profileRes.error}
	>
		{#snippet skeleton()}
			<UserProfileSkeleton />
		{/snippet}

		{#snippet emptyView()}
			<div class="space-y-6 sm:space-y-8">
				<BackToSquare />
				<div
					class="p-8 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3"
				>
					<div class="text-2xl">👤</div>
					<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
						未找到该用户
					</div>
					<p class="text-xs text-zinc-500 max-w-sm mx-auto">
						该用户可能未注册或链接无效，请返回广场查看活跃用户。
					</p>
					<Button variant="outline" size="sm" onclick={() => goto('/')}>
						返回公共待办广场
					</Button>
				</div>
			</div>
		{/snippet}

		{#snippet errorView(msg)}
			<div class="space-y-6 sm:space-y-8">
				<BackToSquare />
				<div
					class="p-8 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3"
				>
					<div class="text-2xl">👤</div>
					<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
						{msg}
					</div>
					<p class="text-xs text-zinc-500 max-w-sm mx-auto">
						该用户可能未注册或链接无效，请返回广场查看活跃用户。
					</p>
					<Button variant="outline" size="sm" onclick={() => goto('/')}>
						返回公共待办广场
					</Button>
				</div>
			</div>
		{/snippet}

		{#if profileRes.user}
			<div class="space-y-6 sm:space-y-8">
				<BackToSquare />

				<!-- 用户名片与统计指标 -->
				<UserProfileCard user={profileRes.user} isMe={profileRes.isMe} onsaveprofile={onSaveProfile}>
					<UserStatsGrid
						totalCount={profileRes.globalTotalCount}
						statusCounts={profileRes.globalStatusCounts}
						completionRate={profileRes.globalCompletionRate}
					/>
				</UserProfileCard>

				<!-- 个人行动打卡热力图 (仅热力图，近 365 天打卡足迹) -->
				<div
					class="p-5 sm:p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-xs space-y-4"
				>
					<div class="flex items-center justify-between gap-3 flex-wrap">
						<div class="flex items-center gap-2">
							<span class="text-base font-bold text-zinc-900 dark:text-zinc-100">
								行动热力图
							</span>
							<span class="text-xs text-zinc-400 font-mono">
								(近 365 天)
							</span>
						</div>
						<div class="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
							过去一年累计打卡 <span class="font-bold text-emerald-600 dark:text-emerald-400">{profileRes.heatmap?.totalActivities ?? 0}</span> 次
						</div>
					</div>

					{#if profileRes.isHeatmapLoading && !profileRes.heatmap}
						<div class="h-32 rounded-2xl bg-zinc-100/60 dark:bg-zinc-800/40 animate-pulse flex items-center justify-center text-xs text-zinc-400">
							正在载入行动热力图...
						</div>
					{:else}
						<ActivityHeatmap days={profileRes.heatmap?.days || []} />
					{/if}
				</div>

				<!-- 待办清单与分类筛选 -->
				<div class="space-y-4">
					<!-- 状态筛选 Tab 胶囊与激活分类轻量指示 -->
					<div
						class="flex items-center justify-between gap-2 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3 flex-wrap"
					>
						<!-- 左侧：状态筛选 Tab -->
						<div class="flex items-center gap-1.5 text-xs font-medium flex-wrap">
							<button
								type="button"
								onclick={() => handleTabChange('all')}
								class="px-3 py-1.5 rounded-lg transition-colors cursor-pointer {profileRes.activeTab === 'all'
									? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
									: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'}"
							>
								全部 ({profileRes.scopedTotalCount})
							</button>

							{#each TODO_STATUSES as st}
								<button
									type="button"
									onclick={() => handleTabChange(st.id)}
									class="px-3 py-1.5 rounded-lg transition-colors cursor-pointer {profileRes.activeTab === st.id
										? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
										: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'}"
								>
									{st.label} ({profileRes.scopedStatusCounts[st.id] || 0})
								</button>
							{/each}
						</div>

						<!-- 右侧：轻量级分类筛选指示条（仅在用户点击分类胶囊激活时出现，零额外常驻分类栏） -->
						{#if profileRes.activeCategory}
							{@const catConfig = getCategoryConfig(profileRes.activeCategory)}
							<div class="flex items-center gap-1.5 animate-in fade-in duration-150 py-0.5">
								<span class="text-xs text-zinc-400">正在筛选:</span>
								<button
									type="button"
									onclick={handleClearCategory}
									class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-2xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer group"
									style="color: {catConfig?.color};"
									title="点击清除分类筛选"
								>
									<span
										class="h-1.5 w-1.5 rounded-full shrink-0"
										style="background-color: {catConfig?.color};"
									></span>
									<span>{catConfig?.name || profileRes.activeCategory}</span>
									<span
										class="text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 text-xs ml-0.5"
										>✕</span
									>
								</button>
							</div>
						{/if}
					</div>

					<!-- 待办条目列表 -->
					<DataView
						loading={profileRes.isTodosLoading}
						empty={profileRes.filteredTodos.length === 0}
					>
						{#snippet skeleton()}
							<FeedSkeleton count={3} />
						{/snippet}

						{#snippet emptyView()}
							<div
								class="p-12 text-center rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 space-y-2"
							>
								<div class="text-2xl">🌱</div>
								<div class="text-xs">
									{#if profileRes.activeCategory}
										{@const catConfig = getCategoryConfig(profileRes.activeCategory)}
										当前「{catConfig?.name || profileRes.activeCategory}」分类下暂无对应待办
										<button
											type="button"
											onclick={handleClearCategory}
											class="block mx-auto mt-2 text-xs text-indigo-500 hover:text-indigo-600 underline cursor-pointer"
										>
											清除分类筛选并显示全部
										</button>
									{:else}
										当前筛选下暂无待办事项
									{/if}
								</div>
							</div>
						{/snippet}

						<div class="space-y-2">
							{#each profileRes.filteredTodos as todo (todo.id)}
								<div
									class="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
								>
									<TodoItem
										{todo}
										isMine={Boolean(profileRes.isMe)}
										ontoggle={profileRes.handleToggle}
										onreaction={profileRes.handleReaction}
										oncategoryclick={handleCategoryClick}
									/>
								</div>
							{/each}
						</div>
					</DataView>
				</div>
			</div>
		{/if}
	</DataView>
</div>
