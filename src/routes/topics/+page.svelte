<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { CATEGORIES } from '$lib/constants/categories';
	import { userStore } from '$lib/stores/user.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { createTopicsResource } from '$lib/stores/resources/use-topics.svelte';
	import DataView from '$lib/components/ui/DataView.svelte';
	import BackToSquare from '$lib/components/ui/BackToSquare.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import TopicCard from '$lib/components/topic/TopicCard.svelte';
	import TopicListSkeleton from '$lib/components/skeleton/TopicListSkeleton.svelte';

	const topicsRes = createTopicsResource();

	let searchInput = $state('');
	let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	function handleSearchChange(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		searchInput = val;
		if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
		searchDebounceTimer = setTimeout(() => {
			topicsRes.setSearch(val);
		}, 300);
	}

	onMount(() => {
		const cat = page.url.searchParams.get('category');
		if (cat) {
			topicsRes.setCategory(cat);
		} else {
			topicsRes.load(true);
		}
	});
</script>

<svelte:head>
	<title>多人待办广场 - Public Todo</title>
</svelte:head>

<div class="w-full space-y-6 sm:space-y-8">
	<!-- 顶部返回 -->
	<BackToSquare />

	<!-- 页面头部看板 Banner -->
	<div
		class="relative overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md shadow-xs space-y-4"
	>
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div class="space-y-1.5">
				<div class="flex items-center gap-2">
					<span class="text-2xl">🔥</span>
					<h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
						多人待办广场
					</h1>
				</div>
				<p class="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
					内容寻址聚合 · 独立平权 · 相同目标自动并肩冲线
				</p>
			</div>

			<!-- 数据微胶囊 -->
			{#if topicsRes.loaded}
				<div class="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
					<div class="px-3 py-1.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400">
						<span class="font-semibold text-zinc-900 dark:text-zinc-100">{topicsRes.total}</span>
						<span>个协同目标</span>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- 筛选与控制栏 -->
	<div class="space-y-3">
		<!-- 第一行：视角切换、时间维度、排序模式、最小人数开关 -->
		<div
			class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xs text-xs"
		>
			<!-- 左侧：视角 (全网 / 我的) & 时间维度 (累计 / 今日) -->
			<div class="flex items-center gap-2 flex-wrap">
				<!-- 视角切片 -->
				<div class="flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-0.5 border border-zinc-200/60 dark:border-zinc-700/60">
					<button
						type="button"
						onclick={() => topicsRes.setScope('all')}
						class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer {topicsRes.scope === 'all'
							? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
							: 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}"
					>
						全网同行
					</button>
					<button
						type="button"
						onclick={() => {
							if (!userStore.email) {
								toast.info('请先点击右上角头像绑定邮箱后再查看');
								return;
							}
							topicsRes.setScope('mine');
						}}
						class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer {topicsRes.scope === 'mine'
							? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
							: 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}"
					>
						我参与的
					</button>
				</div>

				<!-- 时间切片 -->
				<div class="flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-0.5 border border-zinc-200/60 dark:border-zinc-700/60">
					<button
						type="button"
						onclick={() => topicsRes.setTimeRange('all')}
						class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer {topicsRes.timeRange === 'all'
							? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
							: 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}"
					>
						全网累计
					</button>
					<button
						type="button"
						onclick={() => topicsRes.setTimeRange('today')}
						class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer {topicsRes.timeRange === 'today'
							? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
							: 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}"
					>
						今日活跃
					</button>
				</div>

				<!-- 多人门槛切换 -->
				<button
					type="button"
					onclick={() => topicsRes.setMinParticipants(topicsRes.minParticipants > 1 ? 1 : 2)}
					class="px-2.5 py-1 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 {topicsRes.minParticipants > 1
						? 'border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold'
						: 'border-zinc-200/60 dark:border-zinc-700/60 bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}"
					title="切换是否只看已有2人及以上同行的多人目标"
				>
					<span>👥</span>
					<span>仅看多人组 (≥2人)</span>
				</button>
			</div>

			<!-- 右侧：排序方式与搜索框 -->
			<div class="flex items-center gap-2 flex-wrap">
				<!-- 排序选择 -->
				<div class="flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-0.5 border border-zinc-200/60 dark:border-zinc-700/60">
					<button
						type="button"
						onclick={() => topicsRes.setSortBy('participants')}
						class="px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer {topicsRes.sortBy === 'participants'
							? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
							: 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}"
					>
						🔥 最多同行
					</button>
					<button
						type="button"
						onclick={() => topicsRes.setSortBy('recent')}
						class="px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer {topicsRes.sortBy === 'recent'
							? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
							: 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}"
					>
						⚡ 最新活跃
					</button>
					<button
						type="button"
						onclick={() => topicsRes.setSortBy('completion')}
						class="px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer {topicsRes.sortBy === 'completion'
							? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
							: 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}"
					>
						🏆 完成率
					</button>
				</div>

				<!-- 搜索框 -->
				<div class="relative flex-1 sm:w-44">
					<input
						type="text"
						value={searchInput}
						oninput={handleSearchChange}
						placeholder="搜索目标内容..."
						class="w-full h-7 pl-7 pr-2.5 text-xs rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-zinc-900 dark:focus:border-white transition-colors"
					/>
					<span class="absolute left-2.5 top-1.5 text-zinc-400 text-xs pointer-events-none">🔍</span>
				</div>
			</div>
		</div>

		<!-- 第二行：分类胶囊过滤栏 -->
		<div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
			<button
				type="button"
				onclick={() => topicsRes.setCategory('all')}
				class="px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer {topicsRes.category === 'all'
					? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs font-semibold'
					: 'border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
			>
				全部分类
			</button>
			{#each CATEGORIES as cat (cat.id)}
				<button
					type="button"
					onclick={() => topicsRes.setCategory(cat.id)}
					class="px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer {topicsRes.category === cat.id
						? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs font-semibold'
						: 'border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
				>
					{cat.name}
				</button>
			{/each}
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
					暂无符合条件的多人同行目标
				</div>
				<p class="text-xs text-zinc-400 max-w-sm mx-auto">
					尝试调整筛选分类、清除搜索词，或者前往主页发布一条待办，邀请伙伴一起加入吧！
				</p>
				<div class="pt-2">
					<Button
						variant="outline"
						size="sm"
						onclick={() => {
							topicsRes.setCategory('all');
							topicsRes.setScope('all');
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

		<div class="space-y-3 sm:space-y-4">
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
