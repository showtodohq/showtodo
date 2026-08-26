<script lang="ts">
	import { toast } from '$lib/stores/toast.svelte';
	import Icon from '@iconify/svelte';

	const typeIcons = {
		success: 'lucide:check-circle-2',
		error: 'lucide:alert-circle',
		warning: 'lucide:alert-triangle',
		info: 'lucide:info'
	};

	const typeStyles = {
		success:
			'bg-emerald-50/95 border-emerald-200 text-emerald-900 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-200',
		error:
			'bg-rose-50/95 border-rose-200 text-rose-900 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-200',
		warning:
			'bg-amber-50/95 border-amber-200 text-amber-900 dark:bg-amber-950/90 dark:border-amber-800 dark:text-amber-200',
		info: 'bg-zinc-900/95 border-zinc-700 text-white dark:bg-zinc-100/95 dark:border-zinc-300 dark:text-zinc-900'
	};
</script>

<div
	class="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
	aria-live="polite"
>
	{#each toast.toasts as item (item.id)}
		<div
			class="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-200 animate-in slide-in-from-bottom-2 {typeStyles[
				item.type
			]}"
		>
			<div class="flex items-center gap-2.5 min-w-0">
				<Icon icon={typeIcons[item.type]} class="w-4 h-4 shrink-0" />
				<p class="text-sm font-medium leading-snug break-words">
					{item.message}
				</p>
			</div>
			<button
				type="button"
				class="shrink-0 p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
				onclick={() => toast.dismiss(item.id)}
				aria-label="关闭提示"
			>
				<Icon icon="lucide:x" class="w-3.5 h-3.5" />
			</button>
		</div>
	{/each}
</div>
