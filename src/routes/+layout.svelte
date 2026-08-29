<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/layout/Header.svelte';
	import MobileDrawer from '$lib/components/layout/MobileDrawer.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';
	import { theme } from '$lib/stores/theme.svelte';

	let { children } = $props();
	let isDrawerOpen = $state(false);
</script>

<div class="min-h-screen flex flex-col bg-zinc-50/50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 antialiased selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900">
	<!-- 顶部 Header（极简仅保留 Logo 和头像） -->
	<Header onAvatarClick={() => (isDrawerOpen = true)} />

	<!-- 移动端与全局设置抽屉 -->
	<MobileDrawer bind:open={isDrawerOpen} />

	<!-- 主工作区：居中单列流 (max-w-3xl sm:max-w-4xl) -->
	<main class="flex-1 mx-auto w-full max-w-3xl sm:max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
		{@render children()}
	</main>

	<!-- 底部栏 -->
	<Footer />

	<!-- 全局浮动通知 -->
	<ToastContainer />
</div>
