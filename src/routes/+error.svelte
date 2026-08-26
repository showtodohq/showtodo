<script lang="ts">
	import { page } from '$app/state';
	import Icon from '@iconify/svelte';
</script>

<div class="py-16 text-center space-y-4">
	<div
		class="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 mx-auto flex items-center justify-center shadow-xs"
	>
		<Icon icon="lucide:compass" class="w-8 h-8" />
	</div>

	<div class="space-y-1">
		<h1 class="text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
			{page.status}
		</h1>
		<p class="text-sm text-zinc-500">
			{page.error?.message || '您访问的页面或资源未找到'}
		</p>
	</div>

	<div class="pt-4">
		<a
			href="/"
			class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity"
		>
			<Icon icon="lucide:home" class="w-4 h-4" />
			<span>返回待办广场</span>
		</a>
	</div>
</div>
