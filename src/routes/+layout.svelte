<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/state';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';
	import TopProgressBar from '$lib/components/ui/TopProgressBar.svelte';
	import CreateTodoModal from '$lib/components/todo/CreateTodoModal.svelte';
	import { progressStore } from '$lib/stores/progress.svelte';
	let { children } = $props();

	let isNavigating = false;
	$effect(() => {
		if (navigating.to) {
			if (!isNavigating) {
				isNavigating = true;
				progressStore.start();
			}
		} else {
			if (isNavigating) {
				isNavigating = false;
				progressStore.done();
			}
		}
	});
</script>

<div class="min-h-screen flex flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 antialiased selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900">
	<!-- 顶部极细流光加载条 -->
	<TopProgressBar />

	<!-- 顶部 Header（集成 Apple / Linear 风格 UserPopover） -->
	<Header />

	<!-- 主工作区：单列居中流 -->
	<main class="flex-1 w-full max-w-3xl sm:max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
		{@render children()}
	</main>

	<!-- 极简底部栏 -->
	<Footer />

	<!-- 全局浮动 Toast 容器 -->
	<ToastContainer />

	<!-- 全局发布 Todo 弹窗 -->
	<CreateTodoModal />
</div>
