<script lang="ts">
	import type { TodoStatus } from '$lib/types/todo';
	import { TODO_STATUSES } from '$lib/constants/status';

	interface Props {
		status?: TodoStatus | string;
		isMine?: boolean;
		size?: 'sm' | 'md';
		ontoggle?: (nextStatus: TodoStatus, e?: MouseEvent) => void;
		class?: string;
	}

	let {
		status = 'pending',
		isMine = true,
		size = 'md',
		ontoggle,
		class: className = ''
	}: Props = $props();

	const currentStatus = $derived((status as TodoStatus) || 'pending');

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

	let isMenuOpen = $state(false);
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
		if (currentStatus === 'done' || currentStatus === 'abandoned') {
			next = 'pending';
		} else {
			next = 'done';
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
			class="flex shrink-0 items-center justify-center rounded-full border transition-all duration-150 active:scale-85 cursor-pointer {sizeClasses[
				size
			].box} {currentStatus === 'done'
				? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
				: currentStatus === 'in_progress'
					? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
					: currentStatus === 'abandoned'
						? 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
						: 'border-zinc-600 dark:border-zinc-300 hover:scale-110 hover:border-zinc-900 dark:hover:border-white hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
			title={currentStatus === 'done'
				? '已达成 (点击重开，悬停切换4态)'
				: currentStatus === 'in_progress'
					? '推进中 (点击完成，悬停切换4态)'
					: currentStatus === 'abandoned'
						? '已放弃 (点击重开，悬停切换4态)'
						: '待办中 (点击完成，悬停切换4态)'}
		>
			{#if currentStatus === 'done'}
				<!-- 已完成：加粗打勾 -->
				<svg
					class="{sizeClasses[size].icon} stroke-[3] animate-in zoom-in-50 duration-150"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			{:else if currentStatus === 'in_progress'}
				<!-- 进行中：脉冲时钟/半环 -->
				<div class="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
			{:else if currentStatus === 'abandoned'}
				<!-- 已放弃：极简斜叉 -->
				<svg
					class="{sizeClasses[size].icon} stroke-[2.5]"
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
						class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-100 cursor-pointer {isActive
							? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-2xs'
							: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'}"
						title="{st.label}: {st.description}"
					>
						{#if st.id === 'pending'}
							<span class="h-2 w-2 rounded-full border border-zinc-400"></span>
						{:else if st.id === 'in_progress'}
							<span class="h-2 w-2 rounded-full bg-blue-500"></span>
						{:else if st.id === 'done'}
							<svg class="h-2.5 w-2.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						{:else if st.id === 'abandoned'}
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
		<!-- 他人待办：只读静态 4 态徽标 -->
		{#if currentStatus === 'done'}
			<div
				class="flex shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-600 bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-default select-none shadow-2xs {sizeClasses[
					size
				].box}"
				title="作者已完成此待办（他人）"
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
		{:else if currentStatus === 'in_progress'}
			<div
				class="flex shrink-0 items-center justify-center rounded-full border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 cursor-default select-none {sizeClasses[
					size
				].box}"
				title="作者正在推进此待办（他人）"
			>
				<div class="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></div>
			</div>
		{:else if currentStatus === 'abandoned'}
			<div
				class="flex shrink-0 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default select-none {sizeClasses[
					size
				].box}"
				title="作者已放弃此待办（他人）"
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
				title="待办中（他人待办，只读）"
			></div>
		{/if}
	{/if}
</div>
