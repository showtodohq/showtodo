<script lang="ts">
	import type { TodoStatus } from '$lib/types/todo';
	import { TODO_STATUS, TODO_STATUSES, getStatusConfig } from '$lib/constants/status';

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

	// svelte-ignore state_referenced_locally
	let isMenuOpen = $state(defaultOpen);
	let menuCloseTimeout: ReturnType<typeof setTimeout> | null = null;

	function handleMouseEnter() {
		if (!isMine) return;
		if (menuCloseTimeout) {
			clearTimeout(menuCloseTimeout);
			menuCloseTimeout = null;
		}
		isMenuOpen = true;
	}

	function handleMouseLeave() {
		menuCloseTimeout = setTimeout(() => {
			isMenuOpen = false;
		}, 250);
	}

	// 快速二元一键打卡：未完成/进行中 -> 一键完成；已完成/已放弃 -> 一键回退待办
	function handleQuickClick(e: MouseEvent) {
		let next: TodoStatus;
		if (currentStatus === TODO_STATUS.DONE || currentStatus === TODO_STATUS.ABANDONED) {
			next = TODO_STATUS.PENDING;
		} else {
			next = TODO_STATUS.DONE;
		}
		isMenuOpen = false;
		ontoggle?.(next, e);
	}

	// 从悬浮微菜单直接选择特定状态
	function handleSelectStatus(targetStatus: TodoStatus, e: MouseEvent) {
		isMenuOpen = false;
		if (targetStatus === currentStatus) return;
		ontoggle?.(targetStatus, e);
	}
</script>

<div
	class="relative inline-flex items-center {className}"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	role="group"
	aria-label="Todo status controller"
>
	{#if isMine}
		<!-- 当前用户本人待办：可点击交互 + 悬停弹出 4 态选择器 -->
		<button
			type="button"
			onclick={handleQuickClick}
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

		<!-- 悬停 4 态极简微型选择器 (正上方弹出胶囊条) -->
		{#if isMenuOpen}
			<div
				class="absolute bottom-full right-0 mb-2 z-50 flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200/90 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150 select-none whitespace-nowrap"
			>
				{#each TODO_STATUSES as st}
					{@const isActive = st.id === currentStatus}
					<button
						type="button"
						onclick={(e) => handleSelectStatus(st.id, e)}
						class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-100 cursor-pointer {isActive
							? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-2xs'
							: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'}"
						title="{st.label}: {st.description}"
					>
						{#if st.id === TODO_STATUS.PENDING}
							<!-- 待办：标准空心正圆矢量 SVG (继承 currentColor) -->
							<svg class="h-2.5 w-2.5 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<circle cx="12" cy="12" r="9" />
							</svg>
						{:else if st.id === TODO_STATUS.IN_PROGRESS}
							<!-- 进行中：标准 ◔ 四分之一填充圆 (外环 + 右上角 1/4 扇形填充，继承 currentColor) -->
							<svg class="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none">
								<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.2" />
								<path d="M12 12 L12 3 A9 9 0 0 1 21 12 Z" fill="currentColor" />
							</svg>
						{:else if st.id === TODO_STATUS.DONE}
							<!-- 已完成：加粗打勾矢量 SVG -->
							<svg class="h-2.5 w-2.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						{:else if st.id === TODO_STATUS.ABANDONED}
							<!-- 已放弃：极简叉号矢量 SVG -->
							<svg class="h-2.5 w-2.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						{/if}
						<span class="text-[11px] leading-none">{st.shortActionLabel}</span>
					</button>
				{/each}

				<!-- 底部小箭头 -->
				<div
					class="absolute -bottom-1 right-2.5 w-2 h-2 rotate-45 bg-white dark:bg-zinc-900 border-r border-b border-zinc-200/90 dark:border-zinc-800"
				></div>
			</div>
		{/if}
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
