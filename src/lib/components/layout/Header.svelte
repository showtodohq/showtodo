<script lang="ts">
	import { page } from '$app/state';
	import UserPopover from '$lib/components/layout/UserPopover.svelte';
	import { createTodoModalStore } from '$lib/stores/create-todo-modal.svelte';

	let scrollY = $state(0);
	const isScrolled = $derived(scrollY > 12);

	const pathname = $derived(page.url.pathname);
	const isFeed = $derived(pathname === '/');
	const isTopics = $derived(pathname.startsWith('/topics'));
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
	<div class="mx-auto flex h-full max-w-3xl sm:max-w-4xl items-center justify-between px-4 sm:px-6 gap-3">
		<!-- 左侧：品牌 Logo 与产品名称 -->
		<a href="/" class="flex items-center gap-2.5 group transition-opacity hover:opacity-90 shrink-0">
			<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-mono text-xs font-bold shadow-xs">
				PT
			</div>
			<span class="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 hidden sm:inline">
				ptdl-alpha
			</span>
		</a>

		<!-- 中间：全局一级模块导航 Tabs (Reddit / Linear 风格极简胶囊) -->
		<nav class="flex items-center p-1 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 text-xs font-medium">
			<a
				href="/"
				class="px-2.5 sm:px-3 py-1 rounded-lg transition-all {isFeed
					? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
					: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
			>
				动态流
			</a>
			<a
				href="/topics"
				class="px-2.5 sm:px-3 py-1 rounded-lg transition-all {isTopics
					? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
					: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
			>
				同行广场
			</a>
			<a
				href="/stats"
				class="px-2.5 sm:px-3 py-1 rounded-lg transition-all {isStats
					? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
					: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
			>
				全站看板
			</a>
		</nav>

		<!-- 右侧：全局发布按钮与用户身份 Popover -->
		<div class="flex items-center gap-2 shrink-0">
			<!-- 高对比度实心微胶囊新建按钮 (Linear 风格) -->
			<button
				type="button"
				onclick={() => createTodoModalStore.show()}
				class="flex h-8 items-center gap-1.5 px-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 active:scale-95 transition-all text-xs font-semibold shadow-xs cursor-pointer group"
				title="新建公开待办 (按 C 唤起)"
				aria-label="发布新待办"
			>
				<svg class="h-3.5 w-3.5 stroke-[2.5] transition-transform group-hover:rotate-90 duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				<span class="hidden sm:inline">发布</span>
				<kbd class="hidden md:inline-flex items-center justify-center h-4 min-w-4 px-1 rounded bg-zinc-800 dark:bg-zinc-200 text-[10px] font-mono text-zinc-300 dark:text-zinc-700 leading-none">C</kbd>
			</button>

			<UserPopover />
		</div>
	</div>
</header>
