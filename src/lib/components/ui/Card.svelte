<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		hoverable?: boolean;
		class?: string;
		header?: Snippet;
		children?: Snippet;
		footer?: Snippet;
		onclick?: (event: MouseEvent) => void;
	}

	let {
		hoverable = false,
		class: className = '',
		header,
		children,
		footer,
		onclick
	}: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	role={onclick ? 'button' : undefined}
	tabindex={onclick ? 0 : undefined}
	{onclick}
	onkeydown={(e) => {
		if (onclick && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			onclick(e as unknown as MouseEvent);
		}
	}}
	class={cn(
		'rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-xs transition-all duration-200 overflow-hidden text-left',
		hoverable
			? 'hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md cursor-pointer'
			: '',
		className
	)}
>
	{#if header}
		<div class="border-b border-zinc-100 dark:border-zinc-800/80 px-4 py-3 sm:px-5">
			{@render header()}
		</div>
	{/if}

	{#if children}
		<div class="p-4 sm:p-5">
			{@render children()}
		</div>
	{/if}

	{#if footer}
		<div class="border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-3 sm:px-5">
			{@render footer()}
		</div>
	{/if}
</div>
