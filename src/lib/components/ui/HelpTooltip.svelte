<script lang="ts">
	import type { Snippet } from 'svelte';
	import Popover from '$lib/components/ui/Popover.svelte';
	import {
		POPOVER_PLACEMENT,
		POPOVER_TRIGGER,
		POPOVER_ROLE,
		type PopoverPlacement,
		type PopoverTrigger
	} from '$lib/constants/popover';

	interface Props {
		title?: string;
		text?: string;
		iconClass?: string;
		ariaLabel?: string;
		placement?: PopoverPlacement;
		trigger?: PopoverTrigger;
		offset?: number;
		defaultOpen?: boolean;
		class?: string;
		panelClass?: string;
		content?: Snippet<[{ close: () => void }]>;
		children?: Snippet<[{ close: () => void }]>;
	}

	let {
		title,
		text,
		iconClass = 'w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors',
		ariaLabel = 'More information',
		placement = POPOVER_PLACEMENT.TOP,
		trigger = POPOVER_TRIGGER.CLICK,
		offset = 6,
		defaultOpen = false,
		class: className = '',
		panelClass = '',
		content,
		children: customChildren
	}: Props = $props();

	const renderContent = $derived(content || customChildren);
</script>

<Popover
	{placement}
	{trigger}
	role={POPOVER_ROLE.DIALOG}
	{offset}
	{defaultOpen}
>
	{#snippet triggerSnippet({ triggerProps })}
		<button
			type="button"
			{...triggerProps}
			class="inline-flex items-center justify-center p-0.5 rounded-full hover:bg-zinc-200/60 dark:hover:bg-zinc-800 cursor-pointer focus:outline-hidden focus-visible:ring-1 focus-visible:ring-zinc-400 transition-colors {className}"
			aria-label={ariaLabel}
			title={ariaLabel}
		>
			<svg class={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		</button>
	{/snippet}

	{#snippet children({ close })}
		<div
			class="w-64 max-w-xs sm:w-72 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs p-3 shadow-xl text-xs space-y-2 leading-relaxed text-zinc-600 dark:text-zinc-300 animate-in fade-in zoom-in-95 duration-100 {panelClass}"
		>
			{#if title}
				<div class="flex items-center justify-between gap-1.5 pb-1 border-b border-zinc-100 dark:border-zinc-800/80">
					<div class="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
						<svg class="w-3.5 h-3.5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span>{title}</span>
					</div>
					<button
						type="button"
						onclick={close}
						class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded p-0.5 cursor-pointer leading-none"
						aria-label="Close tooltip"
					>
						<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{/if}

			{#if text}
				<p class="text-zinc-600 dark:text-zinc-300 leading-normal">
					{text}
				</p>
			{/if}

			{#if renderContent}
				{@render renderContent({ close })}
			{/if}
		</div>
	{/snippet}
</Popover>
