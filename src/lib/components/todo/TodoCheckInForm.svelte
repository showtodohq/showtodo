<script lang="ts">
	import type { TodoStatus } from '$lib/types/todo';
	import { TODO_STATUS, TODO_STATUSES, getStatusConfig } from '$lib/constants/status';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		currentStatus?: TodoStatus;
		isSubmitting?: boolean;
		onsubmit?: (data: { status: TodoStatus; note: string }) => Promise<void> | void;
	}

	let { currentStatus = TODO_STATUS.PENDING, isSubmitting = false, onsubmit }: Props = $props();

	// 默认情况下编辑打卡日志时，一般状态都是进行中 (in_progress)
	let checkInStatus = $state<TodoStatus>(TODO_STATUS.IN_PROGRESS);
	let checkInNote = $state('');

	$effect(() => {
		checkInStatus = currentStatus === TODO_STATUS.PENDING ? TODO_STATUS.IN_PROGRESS : currentStatus;
	});

	const checkInActionText = $derived(
		checkInStatus === TODO_STATUS.DONE
			? getStatusConfig(TODO_STATUS.DONE).actionLabel
			: checkInStatus === TODO_STATUS.ABANDONED
				? getStatusConfig(TODO_STATUS.ABANDONED).actionLabel
				: checkInStatus === TODO_STATUS.PENDING
					? getStatusConfig(TODO_STATUS.PENDING).actionLabel
					: 'Log Progress'
	);

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			handleSubmit();
		}
	}

	async function handleSubmit(e?: SubmitEvent) {
		e?.preventDefault();
		const note = checkInNote.trim();
		if (!note || isSubmitting) return;

		await onsubmit?.({
			status: checkInStatus,
			note
		});
		checkInNote = '';
	}
</script>

<form
	onsubmit={handleSubmit}
	class="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xs space-y-3"
>
	<div class="flex items-center justify-between flex-wrap gap-2">
		<div class="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
			<span class="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
			<span>Log Progress</span>
		</div>

		<!-- Status segment buttons -->
		<div class="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl text-xs select-none">
			{#each TODO_STATUSES as st}
				<button
					type="button"
					onclick={() => (checkInStatus = st.id)}
					class="flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer {checkInStatus === st.id
						? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}"
					title="{st.label}: {st.description}"
				>
					{#if st.id === TODO_STATUS.PENDING}
						<Icon icon="lucide:circle" class="h-3 w-3" />
					{:else if st.id === TODO_STATUS.IN_PROGRESS}
						<Icon icon="lucide:clock-3" class="h-3 w-3 text-blue-500" />
					{:else if st.id === TODO_STATUS.DONE}
						<Icon icon="lucide:check-circle-2" class="h-3 w-3 text-emerald-500" />
					{:else if st.id === TODO_STATUS.ABANDONED}
						<Icon icon="lucide:x-circle" class="h-3 w-3 text-zinc-400" />
					{/if}
					<span>{st.label}</span>
				</button>
			{/each}
		</div>
	</div>

	<textarea
		bind:value={checkInNote}
		onkeydown={handleKeydown}
		rows="2"
		placeholder="Write something to log your progress... (⌘ + Enter to submit)"
		required
		class="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
	></textarea>

	<div class="flex items-center justify-between text-xs text-zinc-400">
		<span class="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
			⌘ + Enter to submit
		</span>

		<Button
			type="submit"
			size="xs"
			variant="primary"
			loading={isSubmitting}
			disabled={isSubmitting || !checkInNote.trim()}
		>
			{checkInActionText}
		</Button>
	</div>
</form>
