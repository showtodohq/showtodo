<script lang="ts">
	import { page } from '$app/state';
	import UserPopover from '$lib/components/layout/UserPopover.svelte';
	import { createTodoModalStore } from '$lib/stores/create-todo-modal.svelte';

	let scrollY = $state(0);
	const isScrolled = $derived(scrollY > 12);

	const pathname = $derived(page.url.pathname);
	const isFeed = $derived(pathname === '/');
	const isGoals = $derived(pathname.startsWith('/goals'));
	const isMy = $derived(pathname.startsWith('/my'));
	const isStats = $derived(pathname.startsWith('/stats'));

	function handleGlobalKeydown(e: KeyboardEvent) {
		// 当用户在表单输入框内输入时，不拦截快捷键
		const target = e.target as HTMLElement | null;
		const isInputActive =
			target?.tagName === 'INPUT' ||
			target?.tagName === 'TEXTAREA' ||
			target?.tagName === 'SELECT' ||
			target?.isContentEditable;

		if (isInputActive) return;

		// 快捷键 'c' 或 'C' 且未按 Ctrl/Cmd/Alt，直接唤起发布弹窗
		if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey && !e.altKey) {
			e.preventDefault();
			createTodoModalStore.show();
		}
	}
</script>

<svelte:window bind:scrollY onkeydown={handleGlobalKeydown} />

<header
	class="sticky top-0 z-30 h-14 transition-all duration-200 {isScrolled
		? 'border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shadow-2xs'
		: 'border-b border-transparent bg-transparent'}"
>
	<div class="mx-auto grid grid-cols-[1fr_auto_1fr] h-full max-w-3xl sm:max-w-4xl items-center px-4 sm:px-6 gap-3">
		<!-- 左列 (1fr)：品牌 Logo 与产品名称 (左对齐) -->
		<div class="flex items-center justify-start min-w-0">
			<a href="/" class="flex items-center gap-2.5 group transition-opacity hover:opacity-90 shrink-0">
				<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs">
					<svg class="h-4 w-4 stroke-[2.2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
						<path d="M9 12l2.5 2.5L18 8" />
						<path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.75 1 6.4 2.6" />
					</svg>
				</div>
				<span class="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 hidden sm:inline">
					ShowTodo
				</span>
			</a>
		</div>

		<!-- 中列 (auto)：全局一级模块导航 Tabs (绝对精准水平居中) -->
		<div class="flex items-center justify-center">
			<nav
				aria-label="Main navigation"
				class="flex items-center p-1 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 text-xs font-medium shrink-0"
			>
				<a
					href="/"
					title="Feed"
					aria-label="Feed"
					class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg transition-all {isFeed
						? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
				>
					<svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width={isFeed ? 2.2 : 1.8}>
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
					</svg>
					<span class="hidden sm:inline">Feed</span>
				</a>
				<a
					href="/goals"
					title="Goals"
					aria-label="Goals"
					class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg transition-all {isGoals
						? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
				>
					<svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width={isGoals ? 2.2 : 1.8}>
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
					</svg>
					<span class="hidden sm:inline">Goals</span>
				</a>
				<a
					href="/my"
					title="My"
					aria-label="My"
					class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg transition-all {isMy
						? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
				>
					<svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width={isMy ? 2.2 : 1.8}>
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
					</svg>
					<span class="hidden sm:inline">My</span>
				</a>
				<a
					href="/stats"
					title="Stats"
					aria-label="Stats"
					class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg transition-all {isStats
						? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
				>
					<svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width={isStats ? 2.2 : 1.8}>
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
					</svg>
					<span class="hidden sm:inline">Stats</span>
				</a>
			</nav>
		</div>

		<!-- 右列 (1fr)：全局发布按钮与用户身份 Popover (右对齐) -->
		<div class="flex items-center justify-end gap-2 shrink-0">
			<!-- 精致紧凑微胶囊新建按钮 (与左侧 Logo 严格统一为 h-7 规格) -->
			<button
				type="button"
				onclick={() => createTodoModalStore.show()}
				class="flex h-7 w-7 sm:w-auto items-center justify-center sm:justify-start gap-1.5 px-0 sm:px-2.5 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 active:scale-95 transition-all text-xs font-medium shadow-2xs cursor-pointer group shrink-0"
				title="Create public todo (Press C to open)"
				aria-label="Create new todo"
			>
				<svg class="h-3.5 w-3.5 stroke-[2.5] transition-transform group-hover:rotate-90 duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				<span class="hidden sm:inline">Post</span>
				<kbd class="hidden md:inline-flex items-center justify-center h-3.5 min-w-3.5 px-1 rounded bg-zinc-800 dark:bg-zinc-200 text-[9px] font-mono text-zinc-300 dark:text-zinc-700 leading-none">C</kbd>
			</button>

			<UserPopover />
		</div>
	</div>
</header>
