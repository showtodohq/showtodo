<script lang="ts">
	import UserPopover from '$lib/components/layout/UserPopover.svelte';

	let scrollY = $state(0);
	const isScrolled = $derived(scrollY > 12);
</script>

<svelte:window bind:scrollY />

<header
	class="sticky top-0 z-30 h-14 transition-all duration-200 {isScrolled
		? 'border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shadow-2xs'
		: 'border-b border-transparent bg-transparent'}"
>
	<div class="mx-auto flex h-full max-w-3xl sm:max-w-4xl items-center justify-between px-4 sm:px-6">
		<!-- 左侧：品牌 Logo 与产品名称 -->
		<a href="/" class="flex items-center gap-2.5 group transition-opacity hover:opacity-90">
			<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-mono text-xs font-bold shadow-xs">
				PT
			</div>
			<span class="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
				ptdl-alpha
			</span>
		</a>

		<!-- 右侧：Apple / Linear 风格用户身份与偏好 Popover -->
		<UserPopover />
	</div>
</header>

