<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ComponentSize } from '$lib/types/common';
	import { cn } from '$lib/utils/cn';

	export interface SelectOption {
		value: string | number;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		value?: string | number;
		options?: SelectOption[];
		label?: string;
		error?: string;
		helperText?: string;
		placeholder?: string;
		size?: ComponentSize;
		disabled?: boolean;
		required?: boolean;
		id?: string;
		name?: string;
		class?: string;
		children?: Snippet;
		onchange?: (event: Event) => void;
	}

	let {
		value = $bindable(''),
		options = [],
		label,
		error,
		helperText,
		placeholder,
		size = 'md',
		disabled = false,
		required = false,
		id,
		name,
		class: className = '',
		children,
		onchange
	}: Props = $props();

	const autoId = $derived(id || (label ? `select-${Math.random().toString(36).substring(2, 7)}` : undefined));

	const sizeClasses: Record<ComponentSize, string> = {
		xs: 'h-7 text-xs px-2 rounded-md',
		sm: 'h-8 text-xs px-2.5 rounded-lg',
		md: 'h-9 text-sm px-3 rounded-lg',
		lg: 'h-11 text-base px-4 rounded-xl'
	};
</script>

<div class="w-full flex flex-col gap-1.5 text-left">
	{#if label}
		<label for={autoId} class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
			{label}
			{#if required}<span class="text-red-500 ml-0.5">*</span>{/if}
		</label>
	{/if}

	<div class="relative w-full">
		<select
			id={autoId}
			{name}
			{disabled}
			{required}
			bind:value
			{onchange}
			class={cn(
				'w-full appearance-none bg-white dark:bg-zinc-900 border text-zinc-900 dark:text-zinc-100 pr-8 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent disabled:opacity-50 disabled:bg-zinc-50 dark:disabled:bg-zinc-950 disabled:cursor-not-allowed cursor-pointer',
				error
					? 'border-red-500 focus:ring-red-500'
					: 'border-zinc-300 dark:border-zinc-700',
				sizeClasses[size],
				className
			)}
		>
			{#if placeholder}
				<option value="" disabled selected={value === ''}>{placeholder}</option>
			{/if}

			{#if children}
				{@render children()}
			{:else}
				{#each options as opt}
					<option value={opt.value} disabled={opt.disabled}>{opt.label}</option>
				{/each}
			{/if}
		</select>

		<div class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
			<svg class="h-4 w-4 fill-current" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
			</svg>
		</div>
	</div>

	{#if error}
		<p class="text-xs text-red-500 dark:text-red-400">{error}</p>
	{:else if helperText}
		<p class="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>
	{/if}
</div>
