<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ComponentSize, ComponentVariant } from '$lib/types/common';
	import { cn } from '$lib/utils/cn';
	import Spinner from './Spinner.svelte';

	interface Props {
		variant?: ComponentVariant;
		size?: ComponentSize;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		loading?: boolean;
		title?: string;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
		leftIcon?: Snippet;
		rightIcon?: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		loading = false,
		title,
		class: className = '',
		onclick,
		children,
		leftIcon,
		rightIcon
	}: Props = $props();

	const variantClasses: Record<ComponentVariant, string> = {
		primary:
			'bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:active:bg-zinc-300 shadow-xs border border-transparent',
		secondary:
			'bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80 active:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700/80 dark:active:bg-zinc-700 border border-transparent',
		outline:
			'border border-zinc-300 bg-transparent text-zinc-900 hover:bg-zinc-100/80 active:bg-zinc-200 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800/80 dark:active:bg-zinc-800 shadow-xs',
		ghost:
			'bg-transparent text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 border border-transparent',
		danger:
			'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500 shadow-xs border border-transparent',
		success:
			'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xs border border-transparent',
		warning:
			'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 shadow-xs border border-transparent'
	};

	const sizeClasses: Record<ComponentSize, string> = {
		xs: 'h-7 px-2 text-xs gap-1 rounded-md font-medium',
		sm: 'h-8 px-2.5 text-xs gap-1.5 rounded-lg font-medium',
		md: 'h-9 px-3.5 text-sm gap-2 rounded-lg font-medium',
		lg: 'h-11 px-5 text-base gap-2.5 rounded-xl font-semibold'
	};
</script>

<button
	{type}
	{title}
	disabled={disabled || loading}
	{onclick}
	class={cn(
		'inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
		variantClasses[variant],
		sizeClasses[size],
		className
	)}
>
	{#if loading}
		<Spinner size={size === 'lg' ? 'md' : 'sm'} class="text-current" />
	{:else if leftIcon}
		{@render leftIcon()}
	{/if}

	{#if children}
		{@render children()}
	{/if}

	{#if !loading && rightIcon}
		{@render rightIcon()}
	{/if}
</button>
