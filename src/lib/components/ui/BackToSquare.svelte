<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<div class="flex items-center justify-between">
	<button
		type="button"
		onclick={() => (history.length > 1 ? history.back() : goto('/'))}
		class="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
	>
		<span>←</span>
		<span>返回广场</span>
	</button>
</div>
