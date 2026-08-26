<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import ToastContainer from '$lib/components/common/ToastContainer.svelte';
	import UserIdentityBar from '$lib/components/user/UserIdentityBar.svelte';
	import Icon from '@iconify/svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Public Todo — 公开可围观的 Todo List</title>
	<meta
		name="description"
		content="所有人都可以发布、任何人都可以公开围观互动的极简 Todo 目标应用。"
	/>
</svelte:head>

<div class="min-h-screen flex flex-col justify-between">
	<!-- Navbar Header -->
	<header
		class="sticky top-0 z-30 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md"
	>
		<div class="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
			<!-- Logo -->
			<a
				href="/"
				class="flex items-center gap-2.5 group transition-opacity hover:opacity-90"
			>
				<div
					class="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-xs"
				>
					<Icon icon="lucide:check-square" class="w-4 h-4" />
				</div>
				<div class="flex flex-col">
					<span class="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
						Public Todo
						<span
							class="text-[10px] font-normal px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
						>
							MVP
						</span>
					</span>
					<span class="text-[10px] text-zinc-400 -mt-0.5 hidden sm:inline">
						公开可围观的待办清单
					</span>
				</div>
			</a>

			<!-- Right Actions: Identity -->
			<div class="flex items-center gap-3">
				<UserIdentityBar />
			</div>
		</div>
	</header>

	<!-- Main Body -->
	<main class="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t border-zinc-200/60 dark:border-zinc-800/60 py-6 text-center text-xs text-zinc-400">
		<div class="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
			<p>© 2026 Public Todo. 所有 Todo 均永久公开可见.</p>
			<p class="flex items-center gap-1">
				Powered by
				<span class="font-semibold text-zinc-600 dark:text-zinc-300">Svelte 5</span>
				&
				<span class="font-semibold text-zinc-600 dark:text-zinc-300">SvelteKit</span>
			</p>
		</div>
	</footer>
</div>

<!-- Global Toast Container -->
<ToastContainer />
