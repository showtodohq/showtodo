<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface TabOption<V extends string = string> {
		id: V;
		label: string;
		badge?: number | string;
		icon?: Snippet;
		hideLabelOnMobile?: boolean;
	}
</script>

<script lang="ts" generics="T extends string = string">
	import { cn } from '$lib/utils/cn';

	interface Props {
		options: readonly TabOption<T>[];
		value: T;
		onchange?: (value: T) => void;
		size?: 'xs' | 'sm' | 'md';
		variant?: 'segmented' | 'pill';
		class?: string;
	}

	let {
		options,
		value,
		onchange,
		size = 'sm',
		variant = 'segmented',
		class: className = ''
	}: Props = $props();

	function handleKeyDown(e: KeyboardEvent, index: number) {
		let nextIndex = index;
		if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
			e.preventDefault();
			nextIndex = (index + 1) % options.length;
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			e.preventDefault();
			nextIndex = (index - 1 + options.length) % options.length;
		} else if (e.key === 'Home') {
			e.preventDefault();
			nextIndex = 0;
		} else if (e.key === 'End') {
			e.preventDefault();
			nextIndex = options.length - 1;
		}

		if (nextIndex !== index) {
			const nextOpt = options[nextIndex];
			onchange?.(nextOpt.id);
			const parent = (e.currentTarget as HTMLElement).parentElement;
			const targetBtn = parent?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex];
			targetBtn?.focus();
		}
	}

	const containerSizeClasses = {
		xs: 'p-0.5 gap-0.5',
		sm: 'p-1 gap-1',
		md: 'p-1.5 gap-1.5'
	};

	const itemSizeClasses = {
		xs: 'px-2 py-0.5 text-xs',
		sm: 'px-2.5 py-1 text-xs',
		md: 'px-3.5 py-1.5 text-sm'
	};

	const variantContainerClasses = {
		segmented: 'rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-zinc-700/50',
		pill: 'rounded-full bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-zinc-700/50'
	};

	const variantItemClasses = {
		segmented: 'rounded-lg',
		pill: 'rounded-full'
	};
</script>

<div
	role="tablist"
	class={cn(
		'inline-flex items-center select-none',
		variantContainerClasses[variant],
		containerSizeClasses[size],
		className
	)}
>
	{#each options as opt, idx (opt.id)}
		{@const active = opt.id === value}
		<button
			type="button"
			role="tab"
			aria-selected={active}
			tabindex={active ? 0 : -1}
			onclick={() => onchange?.(opt.id)}
			onkeydown={(e) => handleKeyDown(e, idx)}
			class={cn(
				'relative inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100',
				variantItemClasses[variant],
				itemSizeClasses[size],
				active
					? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
					: 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50'
			)}
		>
			{#if opt.icon}
				{@render opt.icon()}
			{/if}

			<span class={cn(opt.hideLabelOnMobile && 'hidden sm:inline')}>{opt.label}</span>

			{#if opt.badge !== undefined}
				<span
					class={cn(
						'ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-tight',
						active
							? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
							: 'bg-zinc-200/70 dark:bg-zinc-700/70 text-zinc-600 dark:text-zinc-400'
					)}
				>
					{opt.badge}
				</span>
			{/if}
		</button>
	{/each}
</div>
