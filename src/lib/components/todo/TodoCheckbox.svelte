<script lang="ts">
	import type { TodoStatus } from '$lib/types/todo';
	import { TODO_STATUS, TODO_STATUSES, getStatusConfig } from '$lib/constants/status';
	import { POPOVER_PLACEMENT, POPOVER_TRIGGER, POPOVER_ROLE } from '$lib/constants/popover';
	import Popover from '$lib/components/ui/Popover.svelte';
	import TodoStatusIcon from '$lib/components/todo/TodoStatusIcon.svelte';

	interface Props {
		status?: TodoStatus | string;
		isMine?: boolean;
		size?: 'sm' | 'md';
		defaultOpen?: boolean;
		ontoggle?: (nextStatus: TodoStatus, e?: MouseEvent) => void;
		class?: string;
	}

	let {
		status = TODO_STATUS.PENDING,
		isMine = true,
		size = 'md',
		defaultOpen = false,
		ontoggle,
		class: className = ''
	}: Props = $props();

	const currentStatus = $derived((status as TodoStatus) || TODO_STATUS.PENDING);

	const sizeClasses = {
		sm: {
			box: 'h-4 w-4',
			icon: 'h-2.5 w-2.5'
		},
		md: {
			box: 'h-4.5 w-4.5',
			icon: 'h-2.5 w-2.5'
		}
	};

	// 快速二元一键打卡：未完成/进行中 -> 一键完成；已完成/已放弃 -> 一键回退待办
	function handleQuickClick(e: MouseEvent, close?: () => void) {
		let next: TodoStatus;
		if (currentStatus === TODO_STATUS.DONE || currentStatus === TODO_STATUS.ABANDONED) {
			next = TODO_STATUS.PENDING;
		} else {
			next = TODO_STATUS.DONE;
		}
		close?.();
		ontoggle?.(next, e);
	}

	// 从悬浮微菜单直接选择特定状态
	function handleSelectStatus(targetStatus: TodoStatus, e: MouseEvent, close?: () => void) {
		close?.();
		if (targetStatus === currentStatus) return;
		ontoggle?.(targetStatus, e);
	}
</script>

<div
	class="relative inline-flex items-center {className}"
	role="group"
	aria-label="Todo status controller"
>
	{#if isMine}
		<!-- 当前用户本人待办：基于原生 Popover API 的 4 态选择器与二元快捷打卡 -->
		<Popover
			placement={POPOVER_PLACEMENT.TOP_END}
			trigger={POPOVER_TRIGGER.HOVER}
			role={POPOVER_ROLE.MENU}
			offset={8}
			{defaultOpen}
		>
			{#snippet triggerSnippet({ isOpen, close, triggerProps })}
				<button
					type="button"
					{...triggerProps}
					onclick={(e) => handleQuickClick(e, close)}
					class="relative flex shrink-0 items-center justify-center rounded-full border overflow-hidden transition-all duration-150 active:scale-85 cursor-pointer {sizeClasses[
						size
					].box} {currentStatus === TODO_STATUS.DONE
						? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
						: currentStatus === TODO_STATUS.IN_PROGRESS
							? 'border-zinc-900 dark:border-zinc-100 bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100'
							: currentStatus === TODO_STATUS.ABANDONED
								? 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
								: 'border-zinc-600 dark:border-zinc-300 hover:scale-110 hover:border-zinc-900 dark:hover:border-white hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
					title={getStatusConfig(currentStatus).label}
				>
					{#if currentStatus === TODO_STATUS.DONE}
						<svg
							class="{sizeClasses[size].icon} stroke-[3] animate-in zoom-in-50 duration-150"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
						</svg>
					{:else if currentStatus === TODO_STATUS.IN_PROGRESS}
						<svg
							class="absolute inset-0 h-full w-full animate-in zoom-in-50 duration-150"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path d="M12 12 L12 0 A12 12 0 0 1 24 12 Z" />
						</svg>
					{:else if currentStatus === TODO_STATUS.ABANDONED}
						<svg
							class="{sizeClasses[size].icon} stroke-[2.5] animate-in zoom-in-50 duration-150"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					{/if}
				</button>
			{/snippet}

			{#snippet children({ close })}
				<!-- 悬停 4 态极简微型选择器 (置于浏览器 Top Layer，彻底免疫父级裁剪) -->
				<div
					class="relative flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200/90 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150 select-none whitespace-nowrap"
				>
					{#each TODO_STATUSES as st}
						{@const isActive = st.id === currentStatus}
						<button
							type="button"
							onclick={(e) => handleSelectStatus(st.id, e, close)}
							class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-100 cursor-pointer {isActive
								? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-2xs'
								: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'}"
							title="{st.label}: {st.description}"
						>
							<TodoStatusIcon status={st.id} size="xs" />
							<span class="text-[11px] leading-none">{st.shortActionLabel}</span>
						</button>
					{/each}

					<!-- 底部小箭头 -->
					<div
						class="absolute -bottom-1 right-2.5 w-2 h-2 rotate-45 bg-white dark:bg-zinc-900 border-r border-b border-zinc-200/90 dark:border-zinc-800"
					></div>
				</div>
			{/snippet}
		</Popover>
	{:else}
		{#if currentStatus === TODO_STATUS.DONE}
			<div
				class="flex shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-600 bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-default select-none shadow-2xs {sizeClasses[
					size
				].box}"
				title="Author completed this todo (others)"
			>
				<svg
					class="{sizeClasses[size].icon} stroke-[2.5]"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			</div>
		{:else if currentStatus === TODO_STATUS.IN_PROGRESS}
			<div
				class="relative flex shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-200/50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 overflow-hidden cursor-default select-none {sizeClasses[
					size
				].box}"
				title="Author is working on this todo (others)"
			>
				<svg
					class="absolute inset-0 h-full w-full"
					viewBox="0 0 24 24"
					fill="currentColor"
				>
					<path d="M12 12 L12 0 A12 12 0 0 1 24 12 Z" />
				</svg>
			</div>
		{:else if currentStatus === TODO_STATUS.ABANDONED}
			<div
				class="flex shrink-0 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default select-none {sizeClasses[
					size
				].box}"
				title="Author abandoned this todo (others)"
			>
				<svg
					class="{sizeClasses[size].icon} stroke-[2]"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</div>
		{:else}
			<div
				class="shrink-0 rounded-full border border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50/80 dark:bg-zinc-800/40 cursor-default select-none {sizeClasses[
					size
				].box}"
				title="Pending (read-only)"
			></div>
		{/if}
	{/if}
</div>
