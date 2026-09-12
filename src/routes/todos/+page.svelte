<script lang="ts">
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import type { CategoryId } from '$lib/types/todo';
	import { userStore } from '$lib/stores/user.svelte';
	import { todayStore } from '$lib/stores/today.svelte';
	import { createMyTodosResource } from '$lib/stores/resources/use-my-todos.svelte';
	import BreadcrumbNav from '$lib/components/ui/BreadcrumbNav.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import TodoComposer from '$lib/components/todo/TodoComposer.svelte';
	import TodoStreamView from '$lib/components/todo/TodoStreamView.svelte';
	import TodoKanbanView from '$lib/components/todo/TodoKanbanView.svelte';
	import TodoCalendarView from '$lib/components/todo/TodoCalendarView.svelte';
	import Icon from '@iconify/svelte';
	import { api } from '$lib/services/api';
	import { toast } from '$lib/stores/toast.svelte';

	const resource = createMyTodosResource();

	let composerCategory = $state<CategoryId | null>(null);

	// 同步 URL 参数中的 ?view=
	let isUrlInitialized = false;

	$effect(() => {
		if (!isUrlInitialized) {
			const viewParam = page.url.searchParams.get('view');
			if (viewParam === 'stream' || viewParam === 'kanban' || viewParam === 'calendar') {
				resource.activeView = viewParam;
			}
			isUrlInitialized = true;
		}
	});

	function updateViewQuery(view: 'stream' | 'kanban' | 'calendar') {
		resource.activeView = view;
		if (typeof window === 'undefined') return;
		const url = new URL(window.location.href);
		if (view === 'stream') {
			url.searchParams.delete('view');
		} else {
			url.searchParams.set('view', view);
		}
		window.history.replaceState(window.history.state, '', url.pathname + url.search);
	}

	// 监听当前登录用户，拉取数据
	$effect(() => {
		const viewerId = userStore.id;
		untrack(() => {
			if (viewerId) {
				void resource.load();
				void todayStore.load();
			}
		});
	});

	// 未登录访客绑定邮箱
	let guestEmail = $state('');
	let loggingIn = $state(false);

	async function handleGuestLogin(e: SubmitEvent) {
		e.preventDefault();
		const clean = guestEmail.trim().toLowerCase();
		if (!clean) return;

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(clean)) {
			toast.error('请输入有效的电子邮箱地址');
			return;
		}

		loggingIn = true;
		try {
			const res = await api.syncUser(clean);
			if (res.user) {
				userStore.updateUserFromProfile(res.user);
				toast.success(`欢迎回来，${res.user.nickname}！`);
				void resource.load(true);
			}
		} catch (err) {
			console.error('Failed to login:', err);
			toast.error(`登录失败: ${(err as Error).message}`);
		} finally {
			loggingIn = false;
		}
	}
</script>

<svelte:head>
	<title>我的待办 · ptdl-alpha</title>
</svelte:head>

<!-- 纯粹的大间距留白布局体系：移除冗余页面标题，视图切换栏置于发布框下方并支持滚动悬停 -->
<div class="w-full space-y-6 sm:space-y-8">
	<!-- 顶部面包屑导航 (纯净通透) -->
	<BreadcrumbNav
		backHref="/"
		backLabel="返回动态流"
		crumbs={[
			{ label: '动态流', href: '/' },
			{ label: '我的待办' }
		]}
	/>

	<!-- 访客引导卡片 -->
	{#if !userStore.email}
		<div
			class="rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800/80 py-20 text-center text-xs text-zinc-400 space-y-4 max-w-md mx-auto"
		>
			<div class="inline-flex p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
				<Icon icon="lucide:inbox" class="h-8 w-8" />
			</div>
			<div class="space-y-1.5">
				<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
					开启您的专属待办工作台
				</div>
				<p class="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
					输入邮箱即可同步待办数据，以动态流、状态看板与月日历三种视角专注推进。
				</p>
			</div>

			<form onsubmit={handleGuestLogin} class="space-y-2.5 pt-2 px-6">
				<Input
					type="email"
					size="sm"
					placeholder="输入您的邮箱 (如 alex@example.com)"
					bind:value={guestEmail}
					required
					class="w-full text-center text-xs"
				/>
				<Button
					type="submit"
					variant="primary"
					size="sm"
					class="w-full text-xs font-medium"
					loading={loggingIn}
					disabled={loggingIn || !guestEmail.trim()}
				>
					一键登录并进入
				</Button>
			</form>
		</div>
	{:else}
		<!-- 1. 置顶极简快速发布框 (与首页一致置顶) -->
		<TodoComposer
			bind:selectedCategory={composerCategory}
			placeholder="写下一个待办目标，回车快速规划..."
			onsubmit={(data) => resource.createTodo(data)}
		/>

		<!-- 2. 视图切换工具区：置于发布框与内容流之间，支持滚动吸顶悬停 (sticky top-14) -->
		<div
			class="sticky top-14 z-20 py-2.5 -mx-4 px-4 sm:-mx-6 sm:px-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-all flex items-center justify-between gap-3"
		>
			<!-- 左侧三重视图控制器 (带 Icon，移动端仅显示 Icon，桌面端显示 Icon + 文字) -->
			<div class="inline-flex items-center rounded-2xl bg-zinc-100/90 dark:bg-zinc-800/80 p-1 text-xs font-medium shadow-2xs">
				<!-- 动态流 (Stream) -->
				<button
					type="button"
					onclick={() => updateViewQuery('stream')}
					class="inline-flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-1.5 rounded-xl font-medium transition-all cursor-pointer {resource.activeView === 'stream'
						? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
					title="动态流"
					aria-label="动态流视图"
				>
					<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
					</svg>
					<span class="hidden sm:inline">动态流</span>
				</button>

				<!-- 状态看板 (Kanban) -->
				<button
					type="button"
					onclick={() => updateViewQuery('kanban')}
					class="inline-flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-1.5 rounded-xl font-medium transition-all cursor-pointer {resource.activeView === 'kanban'
						? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
					title="状态看板"
					aria-label="状态看板视图"
				>
					<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
					</svg>
					<span class="hidden sm:inline">状态看板</span>
				</button>

				<!-- 月日历 (Calendar) -->
				<button
					type="button"
					onclick={() => updateViewQuery('calendar')}
					class="inline-flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-1.5 rounded-xl font-medium transition-all cursor-pointer {resource.activeView === 'calendar'
						? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
					title="月日历"
					aria-label="月日历视图"
				>
					<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					<span class="hidden sm:inline">月日历</span>
				</button>
			</div>

			<!-- 右侧指标摘要 (移动端极简，桌面端完整) -->
			<div class="text-xs font-mono text-zinc-400 shrink-0">
				<span class="hidden sm:inline">{resource.statusCounts.done}/{resource.totalCount} 已完成 ({resource.completionRate}%)</span>
				<span class="sm:hidden px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-medium">
					{resource.statusCounts.done}/{resource.totalCount}
				</span>
			</div>
		</div>

		<!-- 3. 三大视图内容区 -->
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
