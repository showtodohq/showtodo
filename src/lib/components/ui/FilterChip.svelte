<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		selected?: boolean;
		dotClass?: string;
		dotColor?: string;
		title?: string;
		ariaLabel?: string;
		class?: string;
		badge?: string | number;
		onclick?: () => void;
		leading?: Snippet;
		children?: Snippet;
	}

	let {
		selected = false,
		dotClass,
		dotColor,
		title,
		ariaLabel,
		class: className = '',
		badge,
		onclick,
		leading,
		children
	}: Props = $props();
</script>

<button
	type="button"
	{title}
	aria-label={ariaLabel || title}
	aria-pressed={selected}
	{onclick}
	class={cn(
		'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer select-none',
		selected
			? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs font-semibold'
			: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80',
		className
	)}
>
	{#if dotColor}
		<span class="h-1.5 w-1.5 rounded-full shrink-0" style="background-color: {dotColor};"></span>
	{:else if dotClass}
		<span class={cn('h-1.5 w-1.5 rounded-full shrink-0', dotClass)}></span>
	{:else if leading}
		{@render leading()}
	{/if}

	{#if children}
		{@render children()}
	{/if}

	{#if badge !== undefined && badge !== null}
		<span
			class={cn(
				'text-[10px] font-mono px-1 rounded-full leading-tight',
				selected
					? 'bg-zinc-800 text-zinc-300 dark:bg-zinc-200 dark:text-zinc-700'
					: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
			)}
		>
			{badge}
		</span>
	{/if}
</button>
