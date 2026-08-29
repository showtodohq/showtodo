<script lang="ts">
	import { toast } from '$lib/stores/toast.svelte';
	import Toast from './Toast.svelte';
</script>

<!-- 全局浮动 Toast 容器：顶部居中定位 -->
<div
	aria-live="polite"
	class="pointer-events-none fixed top-4 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4"
>
	{#each toast.toasts as item (item.id)}
		<Toast {item} />
	{/each}
</div>
