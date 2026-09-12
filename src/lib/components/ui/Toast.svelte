<script lang="ts">
	import type { ToastItem } from '$lib/stores/toast.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { cn } from '$lib/utils/cn';
	import Icon from '@iconify/svelte';

	interface Props {
		item: ToastItem;
	}

	let { item }: Props = $props();

	const typeConfig = {
		success: {
			border: 'border-emerald-500/30 dark:border-emerald-500/40',
			bg: 'bg-white dark:bg-zinc-900',
			iconColor: 'text-emerald-500',
			icon: 'lucide:check-circle-2'
		},
		error: {
			border: 'border-red-500/30 dark:border-red-500/40',
			bg: 'bg-white dark:bg-zinc-900',
			iconColor: 'text-red-500',
			icon: 'lucide:alert-circle'
		},
		warning: {
			border: 'border-amber-500/30 dark:border-amber-500/40',
			bg: 'bg-white dark:bg-zinc-900',
			iconColor: 'text-amber-500',
			icon: 'lucide:alert-triangle'
		},
		info: {
			border: 'border-zinc-300 dark:border-zinc-700',
			bg: 'bg-white dark:bg-zinc-900',
			iconColor: 'text-zinc-500 dark:text-zinc-400',
			icon: 'lucide:info'
		}
	};

	const currentType = $derived(typeConfig[item.type] || typeConfig.info);
</script>

<div
	role="status"
	class={cn(
		'pointer-events-auto flex items-center gap-3 rounded-xl border p-3 shadow-lg backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-top-2',
		currentType.border,
		currentType.bg
	)}
>
	<div
		class={cn(
			'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
			currentType.iconColor,
			'bg-zinc-100 dark:bg-zinc-800'
		)}
	>
		<Icon icon={currentType.icon} class="h-3.5 w-3.5" />
	</div>

	<p class="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
		{item.message}
	</p>

	<button
		type="button"
		onclick={() => toast.dismiss(item.id)}
		class="ml-auto rounded-md p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
		aria-label="Dismiss toast"
	>
		<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
		</svg>
	</button>
</div>
