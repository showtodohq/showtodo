<script lang="ts">
	import { onMount } from 'svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { createTopicsResource } from '$lib/stores/resources/use-topics.svelte';
	import DataView from '$lib/components/ui/DataView.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import TopicCard from '$lib/components/topic/TopicCard.svelte';
	import TopicListSkeleton from '$lib/components/skeleton/TopicListSkeleton.svelte';

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

	function handleTabSwitch(tab: ViewTab) {
		if (tab === 'mine') {
			if (!userStore.email) {
				toast.info('请先点击右上角头像绑定邮箱后再查看');
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
	}

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
	<title>同行广场 · ptdl-alpha</title>
</svelte:head>

<div class="w-full space-y-5 sm:space-y-6">
	<!-- 极简页面标题栏 (紧凑单行) -->
	<div class="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/60">
		<div class="flex items-center gap-2">
			<span class="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
				同行广场
			</span>
			{#if topicsRes.loaded}
				<span class="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
					{topicsRes.total} 个目标
				</span>
			{/if}
		</div>
		<span class="text-xs text-zinc-400 font-mono hidden sm:inline">相同目标 · 并肩冲线</span>
	</div>

	<!-- 筛选与控制栏：通透单行流式架构 (无大盒嵌套，零冗余分类) -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
		<!-- 左侧：主视图分段切片 (全网同行 / 今日活跃 / 我参与的) + 多人组微过滤 -->
		<div class="flex items-center gap-2 flex-wrap">
			<div class="inline-flex items-center rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 p-0.5">
				<button
					type="button"
					onclick={() => handleTabSwitch('all')}
					class="px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer {activeTab === 'all'
						? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
				>
					全网同行
				</button>
				<button
					type="button"
					onclick={() => handleTabSwitch('today')}
					class="px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer {activeTab === 'today'
						? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
				>
					今日活跃
				</button>
				<button
					type="button"
					onclick={() => handleTabSwitch('mine')}
					class="px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer {activeTab === 'mine'
						? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
				>
					我参与的
				</button>
			</div>

			<!-- 结伴同行快捷过滤芯片 (≥2人) -->
			<button
				type="button"
				onclick={() => topicsRes.setMinParticipants(topicsRes.minParticipants > 1 ? 1 : 2)}
				class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer {topicsRes.minParticipants > 1
					? 'bg-amber-100/80 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 font-semibold'
					: 'bg-zinc-100/80 hover:bg-zinc-200/70 text-zinc-600 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:text-zinc-400'}"
				title="切换是否只看已有2人及以上同行的目标"
			>
				<span>👥</span>
				<span>结伴同行</span>
			</button>
		</div>

		<!-- 右侧：排序下拉选择器 + 紧凑搜索框 -->
		<div class="flex items-center gap-2">
			<!-- 极简排序下拉 -->
			<div class="relative inline-flex items-center">
				<select
					value={topicsRes.sortBy}
					onchange={(e) => topicsRes.setSortBy((e.target as HTMLSelectElement).value as any)}
					class="appearance-none h-8 pl-3 pr-7 rounded-xl text-xs font-medium bg-zinc-100/80 hover:bg-zinc-200/70 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-200 focus:outline-hidden cursor-pointer transition-colors"
					title="选择排序方式"
				>
					<option value="participants">🔥 最多同行</option>
					<option value="recent">⚡ 最新活跃</option>
					<option value="completion">🏆 完成率</option>
				</select>
				<span class="absolute right-2.5 pointer-events-none text-zinc-400 text-[10px]">▼</span>
			</div>

			<!-- 搜索框 -->
			<div class="relative flex-1 sm:w-44">
				<input
					type="text"
					value={searchInput}
					oninput={handleSearchChange}
					placeholder="搜索目标内容..."
					class="w-full h-8 pl-8 pr-3 text-xs rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition-all"
				/>
				<span class="absolute left-2.5 top-2 text-zinc-400 text-xs pointer-events-none">🔍</span>
			</div>
		</div>
	</div>

	<!-- 列表内容展示区 -->
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
				<div class="text-3xl">🌱</div>
				<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
					暂无符合条件的同行目标
				</div>
				<p class="text-xs text-zinc-400 max-w-sm mx-auto">
					尝试切换视角、清除搜索词，或者前往主页发布一条待办，邀请伙伴一起加入吧！
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
						}}
					>
						重置所有筛选
					</Button>
				</div>
			</div>
		{/snippet}

		{#snippet errorView(msg)}
			<div
				class="p-8 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3"
			>
				<div class="text-2xl">⚠️</div>
				<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
					{msg}
				</div>
				<Button variant="outline" size="sm" onclick={() => topicsRes.load(true)}>
					重新加载
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

			<!-- 加载更多 -->
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
							<span>加载中...</span>
						{:else}
							<span>加载更多目标</span>
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
