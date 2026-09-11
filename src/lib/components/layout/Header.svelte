<script lang="ts">
	import { page } from '$app/state';
	import UserPopover from '$lib/components/layout/UserPopover.svelte';

	let scrollY = $state(0);
	const isScrolled = $derived(scrollY > 12);

	const pathname = $derived(page.url.pathname);
	const isFeed = $derived(pathname === '/');
	const isTopics = $derived(pathname.startsWith('/topics'));
	const isStats = $derived(pathname.startsWith('/stats'));
</script>

<svelte:window bind:scrollY />

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
				多人广场
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

		<!-- 右侧：Apple / Linear 风格用户身份与偏好 Popover -->
		<div class="shrink-0">
			<UserPopover />
		</div>
	</div>
</header>

