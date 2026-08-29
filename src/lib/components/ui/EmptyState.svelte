<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		title: string;
		description?: string;
		class?: string;
		icon?: Snippet;
		actions?: Snippet;
	}

	let {
		title,
		description,
		class: className = '',
		icon,
		actions
	}: Props = $props();
</script>

<div
	class={cn(
		'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50',
		className
	)}
>
	{#if icon}
		<div class="mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
			{@render icon()}
		</div>
	{:else}
		<div class="mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
			<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
			</svg>
		</div>
	{/if}

	<h4 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
		{title}
	</h4>

	{#if description}
		<p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
			{description}
		</p>
	{/if}

	{#if actions}
		<div class="mt-4 flex items-center gap-2">
			{@render actions()}
		</div>
	{/if}
</div>
