<script lang="ts">
	import type { TodoStatus } from '$lib/types/todo';
	import { TODO_STATUSES, getStatusConfig } from '$lib/constants/status';
	import Popover from '$lib/components/ui/Popover.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
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
		todoTitle?: string;
		onchange?: (nextStatus: TodoStatus, e?: MouseEvent) => void;
		onlogprogress?: (data: { status: TodoStatus; note: string }) => Promise<void> | void;
	}

	let {
		status,
		disabled = false,
		placement = POPOVER_PLACEMENT.TOP_END,
		defaultOpen = false,
		open = $bindable(undefined),
		class: className = '',
		todoTitle,
		onchange,
		onlogprogress
	}: Props = $props();

	const currentStatusConfig = $derived(getStatusConfig(status));

	// Modal 弹窗相关状态
	let isModalOpen = $state(false);
	let modalTargetStatus = $state<TodoStatus>(TODO_STATUSES[0].id);
	let modalNote = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (!isModalOpen) {
			modalTargetStatus = status;
		}
	});

	function handleOpenModal(targetSt: TodoStatus, e: MouseEvent, closePopover: () => void) {
		e.stopPropagation();
		modalTargetStatus = targetSt;
		modalNote = '';
		closePopover();
		isModalOpen = true;
	}

	function handleModalKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			handleSubmitModal();
		}
	}

	async function handleSubmitModal(e?: SubmitEvent) {
		e?.preventDefault();
		const note = modalNote.trim();
		if (!note || isSubmitting) return;

		isSubmitting = true;
		try {
			await onlogprogress?.({
				status: modalTargetStatus,
				note
			});
			isModalOpen = false;
			modalNote = '';
		} finally {
			isSubmitting = false;
		}
	}
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
			class="w-36 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1.5 shadow-xl text-xs animate-in fade-in zoom-in-95 duration-100 space-y-0.5"
		>
			<div class="px-2 py-1 text-[10px] text-zinc-400 font-medium">
				Move to
			</div>
			{#each TODO_STATUSES as targetSt}
				<div
					class="group/item flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors {status === targetSt.id ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''}"
				>
					<button
						type="button"
						onclick={(e) => {
							onchange?.(targetSt.id, e);
							close();
						}}
						class="flex-1 min-w-0 text-left flex items-center gap-2 cursor-pointer focus:outline-hidden {status === targetSt.id ? 'font-semibold' : ''}"
					>
						<TodoStatusIcon status={targetSt.id} size="xs" class={targetSt.actionColorClass} />
						<span class="truncate">{targetSt.label}</span>
					</button>

					<div class="flex items-center shrink-0 ml-1">
						{#if onlogprogress}
							<button
								type="button"
								onclick={(e) => handleOpenModal(targetSt.id, e, close)}
								class="p-1 rounded-lg text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-all opacity-60 group-hover/item:opacity-100 cursor-pointer"
								title="Log progress with this status"
								aria-label="Log progress with this status"
							>
								<Icon icon="lucide:message-square-plus" class="h-3.5 w-3.5" />
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/snippet}
</Popover>

{#if onlogprogress}
	<Modal
		bind:open={isModalOpen}
		title="Log Progress"
		description={todoTitle ? `Add progress note for "${todoTitle}"` : 'Update status and add a progress note'}
		size="sm"
	>
		<form onsubmit={handleSubmitModal} class="space-y-4">
			<!-- Target status segment control -->
			<div class="space-y-1.5">
				<span class="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
					Target Status
				</span>
				<div class="grid grid-cols-2 gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl text-xs select-none">
					{#each TODO_STATUSES as st}
						<button
							type="button"
							onclick={() => (modalTargetStatus = st.id)}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer {modalTargetStatus === st.id
								? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
								: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}"
						>
							<TodoStatusIcon status={st.id} size="xs" class={st.actionColorClass} />
							<span class="truncate">{st.label}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Progress note textarea -->
			<label class="block space-y-1.5">
				<span class="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
					Progress Note
				</span>
				<textarea
					bind:value={modalNote}
					onkeydown={handleModalKeydown}
					rows="3"
					placeholder="Log thoughts, milestone progress, or next steps... (⌘ + Enter to submit)"
					required
					class="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
				></textarea>
			</label>
			<div class="text-[10px] font-mono text-zinc-400 text-right -mt-2">
				⌘ + Enter to submit
			</div>

			<!-- Action buttons -->
			<div class="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
				<Button
					type="button"
					variant="ghost"
					size="xs"
					disabled={isSubmitting}
					onclick={() => (isModalOpen = false)}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					variant="primary"
					size="xs"
					loading={isSubmitting}
					disabled={isSubmitting || !modalNote.trim()}
				>
					Save & Update
				</Button>
			</div>
		</form>
	</Modal>
{/if}
