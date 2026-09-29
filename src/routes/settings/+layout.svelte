<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/state';
	import BreadcrumbNav from '$lib/components/ui/BreadcrumbNav.svelte';
	import Icon from '@iconify/svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const navItems = [
		{
			label: 'Overview',
			href: '/settings',
			icon: 'lucide:layout-dashboard',
			description: 'Account & preferences',
			exact: true
		},
		{
			label: 'Password',
			href: '/settings/password',
			icon: 'lucide:key-round',
			description: 'Login credentials & security',
			exact: false
		},
		{
			label: 'API Keys',
			href: '/settings/apikey',
			icon: 'lucide:sparkles',
			description: 'AI & MCP assistant integration',
			exact: false
		}
	];

	function isItemActive(item: (typeof navItems)[number]): boolean {
		const pathname = page.url.pathname.replace(/\/$/, '') || '/';
		const itemHref = item.href.replace(/\/$/, '') || '/';
		if (item.exact) {
			return pathname === itemHref;
		}
		return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
	}

	const currentCrumbs = $derived.by(() => {
		const pathname = page.url.pathname.replace(/\/$/, '') || '/';
		if (pathname === '/settings/password') {
			return [
				{ label: 'Feed', href: '/' },
				{ label: 'Settings', href: '/settings' },
				{ label: 'Password' }
			];
		}
		if (pathname === '/settings/apikey') {
			return [
				{ label: 'Feed', href: '/' },
				{ label: 'Settings', href: '/settings' },
				{ label: 'API Keys' }
			];
		}
		return [
			{ label: 'Feed', href: '/' },
			{ label: 'Settings' }
		];
	});
</script>

<div class="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-16">
	<!-- 顶部面包屑导航 -->
	<BreadcrumbNav
		backHref="/"
		backLabel="Back to Feed"
		crumbs={currentCrumbs}
	/>

	<!-- 移动端横向滚动 Tab 导航 (无边框微背景微动效，底部分界) -->
	<div class="md:hidden flex items-center gap-1.5 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-zinc-100 dark:border-zinc-800/60">
		{#each navItems as item (item.href)}
			{@const active = isItemActive(item)}
			<a
				href={item.href}
				class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ease-out active:scale-[0.97] {active
					? 'bg-zinc-100/90 text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-100 font-semibold'
					: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40'}"
			>
				<Icon icon={item.icon} class="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105" />
				<span>{item.label}</span>
			</a>
		{/each}
	</div>

	<!-- 左右布局容器 -->
	<div class="grid grid-cols-1 md:grid-cols-12 md:gap-10 items-start">
		<!-- 左侧侧边栏导航 (桌面端无边框无背景微动效，带右侧极淡分隔线) -->
		<aside class="hidden md:block md:col-span-4 lg:col-span-3 space-y-1 md:border-r md:border-zinc-200/60 dark:md:border-zinc-800/60 md:pr-8 min-h-[400px]">
			<nav class="space-y-1 sticky top-20" aria-label="Settings navigation">
				{#each navItems as item (item.href)}
					{@const active = isItemActive(item)}
					<a
						href={item.href}
						class="group flex items-start gap-3 p-3 rounded-2xl transition-all duration-200 ease-out active:scale-[0.99] {active
							? 'bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 font-semibold'
							: 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30'}"
					>
						<div
							class="p-2 rounded-xl transition-all duration-200 shrink-0 {active
								? 'bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-900 dark:text-zinc-100'
								: 'bg-zinc-100/60 dark:bg-zinc-800/40 text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 group-hover:bg-zinc-200/50'}"
						>
							<Icon icon={item.icon} class="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
						</div>
						<div class="min-w-0 flex-1 pt-0.5">
							<div class="text-xs font-medium leading-none">
								{item.label}
							</div>
							<div class="text-[11px] text-zinc-400 dark:text-zinc-500 font-normal truncate mt-1">
								{item.description}
							</div>
						</div>
						{#if active}
							<div class="self-center w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 shrink-0 animate-in fade-in zoom-in-75 duration-200"></div>
						{/if}
					</a>
				{/each}
			</nav>
		</aside>

		<!-- 右侧内容区域插槽 (无边框无背景) -->
		<main class="col-span-1 md:col-span-8 lg:col-span-9 min-w-0">
			{@render children()}
		</main>
	</div>
</div>
