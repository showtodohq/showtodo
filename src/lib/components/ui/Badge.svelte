<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ComponentSize } from '$lib/types/common';
	import { cn } from '$lib/utils/cn';

	export type BadgeVariant =
		| 'neutral'
		| 'primary'
		| 'success'
		| 'warning'
		| 'danger'
		| 'purple'
		| 'pink'
		| 'outline';

	interface Props {
		variant?: BadgeVariant;
		size?: ComponentSize;
		dot?: boolean;
		class?: string;
		children?: Snippet;
	}

	let {
		variant = 'neutral',
		size = 'sm',
		dot = false,
		class: className = '',
		children
	}: Props = $props();

	const variantClasses: Record<BadgeVariant, { badge: string; dot: string }> = {
		neutral: {
			badge: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-700',
			dot: 'bg-zinc-500'
		},
		primary: {
			badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
			dot: 'bg-blue-500'
		},
		success: {
			badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
			dot: 'bg-emerald-500'
		},
		warning: {
			badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
			dot: 'bg-amber-500'
		},
		danger: {
			badge: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800',
			dot: 'bg-red-500'
		},
		purple: {
			badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
			dot: 'bg-purple-500'
		},
		pink: {
			badge: 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800',
			dot: 'bg-pink-500'
		},
		outline: {
			badge: 'bg-transparent text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700',
			dot: 'bg-zinc-400'
		}
	};

	const sizeClasses: Record<ComponentSize, string> = {
		xs: 'text-[10px] px-1.5 py-0.2 rounded font-medium gap-1',
		sm: 'text-xs px-2 py-0.5 rounded-md font-medium gap-1.5',
		md: 'text-xs px-2.5 py-1 rounded-lg font-medium gap-1.5',
		lg: 'text-sm px-3 py-1 rounded-lg font-semibold gap-2'
	};
</script>

<span
	class={cn(
		'inline-flex items-center border select-none font-medium',
		variantClasses[variant].badge,
		sizeClasses[size],
		className
	)}
>
	{#if dot}
		<span class={cn('h-1.5 w-1.5 rounded-full shrink-0', variantClasses[variant].dot)}></span>
	{/if}

	{#if children}
		{@render children()}
	{/if}
</span>
