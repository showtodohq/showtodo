<script lang="ts">
	import { cn } from '$lib/utils/cn';

	interface Props {
		value?: string;
		placeholder?: string;
		label?: string;
		error?: string;
		helperText?: string;
		rows?: number;
		maxLength?: number;
		disabled?: boolean;
		required?: boolean;
		id?: string;
		name?: string;
		class?: string;
		oninput?: (event: Event) => void;
		onblur?: (event: FocusEvent) => void;
	}

	let {
		value = $bindable(''),
		placeholder = '',
		label,
		error,
		helperText,
		rows = 3,
		maxLength,
		disabled = false,
		required = false,
		id,
		name,
		class: className = '',
		oninput,
		onblur
	}: Props = $props();

	const autoId = $derived(id || (label ? `textarea-${Math.random().toString(36).substring(2, 7)}` : undefined));
</script>

<div class="w-full flex flex-col gap-1.5 text-left">
	{#if label || maxLength}
		<div class="flex items-center justify-between">
			{#if label}
				<label for={autoId} class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
					{label}
					{#if required}<span class="text-red-500 ml-0.5">*</span>{/if}
				</label>
			{/if}
			{#if maxLength}
				<span class="text-[11px] text-zinc-400 font-mono">
					{value.length}/{maxLength}
				</span>
			{/if}
		</div>
	{/if}

	<textarea
		id={autoId}
		{name}
		{rows}
		maxlength={maxLength}
		{placeholder}
		{disabled}
		{required}
		bind:value
		{oninput}
		{onblur}
		class={cn(
			'w-full p-2.5 text-sm bg-white dark:bg-zinc-900 border text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent disabled:opacity-50 disabled:bg-zinc-50 dark:disabled:bg-zinc-950 disabled:cursor-not-allowed resize-y',
			error
				? 'border-red-500 focus:ring-red-500'
				: 'border-zinc-300 dark:border-zinc-700',
			className
		)}
	></textarea>

	{#if error}
		<p class="text-xs text-red-500 dark:text-red-400">{error}</p>
	{:else if helperText}
		<p class="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>
	{/if}
</div>
