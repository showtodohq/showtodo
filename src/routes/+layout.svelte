<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import ToastContainer from '$lib/components/common/ToastContainer.svelte';
	import UserIdentityBar from '$lib/components/user/UserIdentityBar.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import Icon from '@iconify/svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Public Todo</title>
	<meta
		name="description"
		content="公开可围观的极简待办清单应用"
	/>
</svelte:head>

<div class="min-h-screen flex flex-col justify-between">
	<!-- Navbar Header -->
	<header
		class="sticky top-0 z-30 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md"
	>
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
			<!-- Logo -->
			<a
				href="/"
				class="flex items-center gap-2.5 group transition-opacity hover:opacity-90"
			>
				<div
					class="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-xs"
				>
					<Icon icon="lucide:check-square" class="w-3.5 h-3.5" />
				</div>
				<span class="font-bold text-sm sm:text-base tracking-tight text-zinc-900 dark:text-zinc-100">
					Public Todo
				</span>
			</a>

			<!-- Right Actions: Add Todo Button + User Identity -->
			<div class="flex items-center gap-2.5 sm:gap-3">
				<button
					type="button"
					onclick={() => uiStore.openCreateTodo()}
					class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95 group"
				>
					<Icon icon="lucide:plus" class="w-3.5 h-3.5 transition-transform group-hover:rotate-90" />
					<span>发布待办</span>
				</button>

				<UserIdentityBar />
			</div>
		</div>
	</header>

	<!-- Main Body -->
	<main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t border-zinc-100 dark:border-zinc-800/80 py-6 text-center text-xs text-zinc-400">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
			<p>© 2026 Public Todo</p>
			<p class="text-[11px] text-zinc-400">
				公开待办协同日历广场
			</p>
		</div>
	</footer>
</div>

<!-- Global Toast Container -->
<ToastContainer />
