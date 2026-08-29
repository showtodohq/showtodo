<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ComponentSize } from '$lib/types/common';
	import { cn } from '$lib/utils/cn';

	interface Props {
		value?: string;
		type?: string;
		placeholder?: string;
		label?: string;
		error?: string;
		helperText?: string;
		size?: ComponentSize;
		disabled?: boolean;
		required?: boolean;
		id?: string;
		name?: string;
		class?: string;
		leftIcon?: Snippet;
		rightIcon?: Snippet;
		oninput?: (event: Event) => void;
		onkeydown?: (event: KeyboardEvent) => void;
		onblur?: (event: FocusEvent) => void;
	}

	let {
		value = $bindable(''),
		type = 'text',
		placeholder = '',
		label,
		error,
		helperText,
		size = 'md',
		disabled = false,
		required = false,
		id,
		name,
		class: className = '',
		leftIcon,
		rightIcon,
		oninput,
		onkeydown,
		onblur
	}: Props = $props();

	const autoId = $derived(id || (label ? `input-${Math.random().toString(36).substring(2, 7)}` : undefined));

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

	<div class="relative flex items-center w-full">
		{#if leftIcon}
			<div class="absolute left-3 flex items-center justify-center text-zinc-400 pointer-events-none">
				{@render leftIcon()}
			</div>
		{/if}

		<input
			id={autoId}
			{name}
			{type}
			{placeholder}
			{disabled}
			{required}
			bind:value
			{oninput}
			{onkeydown}
			{onblur}
			class={cn(
				'w-full bg-white dark:bg-zinc-900 border text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent disabled:opacity-50 disabled:bg-zinc-50 dark:disabled:bg-zinc-950 disabled:cursor-not-allowed',
				error
					? 'border-red-500 focus:ring-red-500'
					: 'border-zinc-300 dark:border-zinc-700',
				sizeClasses[size],
				leftIcon ? 'pl-9' : '',
				rightIcon ? 'pr-9' : '',
				className
			)}
		/>

		{#if rightIcon}
			<div class="absolute right-3 flex items-center justify-center text-zinc-400 pointer-events-none">
				{@render rightIcon()}
			</div>
		{/if}
	</div>

	{#if error}
		<p class="text-xs text-red-500 dark:text-red-400">{error}</p>
	{:else if helperText}
		<p class="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>
	{/if}
</div>
