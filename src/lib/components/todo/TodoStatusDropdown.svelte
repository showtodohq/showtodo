<script lang="ts">
	import type { TodoStatus } from '$lib/types/todo';
	import { TODO_STATUSES, getStatusConfig } from '$lib/constants/status';
	import Popover from '$lib/components/ui/Popover.svelte';
	import {
		POPOVER_PLACEMENT,
		POPOVER_TRIGGER,
		POPOVER_ROLE,
		type PopoverPlacement
	} from '$lib/constants/popover';
	import TodoStatusIcon from '$lib/components/todo/TodoStatusIcon.svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		status: TodoStatus;
		disabled?: boolean;
		placement?: PopoverPlacement;
		defaultOpen?: boolean;
		open?: boolean;
		class?: string;
		onchange?: (nextStatus: TodoStatus, e?: MouseEvent) => void;
	}

	let {
		status,
		disabled = false,
		placement = POPOVER_PLACEMENT.TOP_END,
		defaultOpen = false,
		open = $bindable(undefined),
		class: className = '',
		onchange
	}: Props = $props();

	const currentStatusConfig = $derived(getStatusConfig(status));
</script>

<Popover
	{placement}
	trigger={POPOVER_TRIGGER.CLICK}
	role={POPOVER_ROLE.MENU}
	offset={6}
	{disabled}
	{defaultOpen}
	bind:open
>
	{#snippet triggerSnippet({ triggerProps })}
		<button
			type="button"
			{...triggerProps}
			{disabled}
			class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition-colors cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed {className}"
			title={disabled ? currentStatusConfig.label : 'Change status'}
		>
			<TodoStatusIcon {status} size="xs" class={currentStatusConfig.actionColorClass} />
			<span>{currentStatusConfig.label}</span>
			{#if !disabled}
				<svg class="h-3 w-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			{/if}
		</button>
	{/snippet}

	{#snippet children({ close })}
		<div
			class="w-32 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1.5 shadow-xl text-xs animate-in fade-in zoom-in-95 duration-100 space-y-0.5"
		>
			<div class="px-2 py-1 text-[10px] text-zinc-400 font-medium">
				Move to
			</div>
			{#each TODO_STATUSES as targetSt}
				<button
					type="button"
					onclick={(e) => {
						onchange?.(targetSt.id, e);
						close();
					}}
					class="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer flex items-center justify-between {status === targetSt.id ? 'font-semibold bg-zinc-50 dark:bg-zinc-800/50' : ''}"
				>
					<span class="flex items-center gap-2">
						<TodoStatusIcon status={targetSt.id} size="xs" class={targetSt.actionColorClass} />
						<span>{targetSt.label}</span>
					</span>
					{#if status === targetSt.id}
						<Icon icon="lucide:check" class="h-3.5 w-3.5 text-zinc-400" />
					{/if}
				</button>
			{/each}
		</div>
	{/snippet}
</Popover>
