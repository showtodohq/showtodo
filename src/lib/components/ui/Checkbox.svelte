<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		checked?: boolean;
		label?: string;
		disabled?: boolean;
		id?: string;
		name?: string;
		class?: string;
		children?: Snippet;
		onchange?: (event: Event) => void;
	}

	let {
		checked = $bindable(false),
		label,
		disabled = false,
		id,
		name,
		class: className = '',
		children,
		onchange
	}: Props = $props();

	const autoId = $derived(id || (label ? `chk-${Math.random().toString(36).substring(2, 7)}` : undefined));
</script>

<label
	for={autoId}
	class={cn(
		'inline-flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-800 dark:text-zinc-200',
		disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
		className
	)}
>
	<input
		id={autoId}
		{name}
		type="checkbox"
		{disabled}
		bind:checked
		{onchange}
		class="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-900 dark:focus:ring-zinc-100 bg-white dark:bg-zinc-900 transition-colors"
	/>
	{#if children}
		{@render children()}
	{:else if label}
		<span>{label}</span>
	{/if}
</label>
