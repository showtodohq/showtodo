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
		<div class="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
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
				<span class="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
					Public Todo
				</span>
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
	<footer class="border-t border-zinc-100 dark:border-zinc-800/80 py-6 text-center text-xs text-zinc-400">
		<div class="max-w-4xl mx-auto px-4 flex items-center justify-between">
			<p>© 2026 Public Todo</p>
			<p class="text-[11px] text-zinc-400">
				公开待办广场
			</p>
		</div>
	</footer>
</div>

<!-- Global Toast Container -->
<ToastContainer />
