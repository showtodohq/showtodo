<script lang="ts">
	import type { TodoStatus } from '$lib/types/todo';

	interface Props {
		status?: TodoStatus | string;
		isMine?: boolean;
		size?: 'sm' | 'md';
		ontoggle?: (e: MouseEvent) => void;
		class?: string;
	}

	let {
		status = 'pending',
		isMine = true,
		size = 'md',
		ontoggle,
		class: className = ''
	}: Props = $props();

	const isDone = $derived(status === 'done');

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
</script>

{#if isMine}
	<!-- 当前用户本人待办：带果冻弹性打勾动画与 hover 效果 -->
	<button
		type="button"
		onclick={(e) => ontoggle?.(e)}
		class="flex shrink-0 items-center justify-center rounded-full border transition-all duration-150 active:scale-85 cursor-pointer {sizeClasses[
			size
		].box} {isDone
			? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
			: 'border-zinc-600 dark:border-zinc-300 hover:scale-110 hover:border-zinc-900 dark:hover:border-white hover:bg-zinc-100 dark:hover:bg-zinc-800'} {className}"
		aria-label={isDone ? '标记为未完成' : '标记为已完成'}
		title={isDone ? '点击标记为未完成' : '点击完成待办（我发布的）'}
	>
		{#if isDone}
			<svg
				class="{sizeClasses[size].icon} stroke-[3] animate-in zoom-in-50 duration-150"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
		{/if}
	</button>
{:else if isDone}
	<!-- 他人待办：已达成状态（清晰浅灰底 + 深灰实心勾） -->
	<div
		class="flex shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-600 bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-default select-none shadow-2xs {sizeClasses[
			size
		].box} {className}"
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
{:else}
	<!-- 他人待办：未完成状态（虚线圆圈，区分只读状态） -->
	<div
		class="shrink-0 rounded-full border border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50/80 dark:bg-zinc-800/40 cursor-default select-none {sizeClasses[
			size
		].box} {className}"
		title="待办中（他人待办，只读）"
	></div>
{/if}
