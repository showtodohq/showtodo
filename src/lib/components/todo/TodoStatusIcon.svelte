<script lang="ts">
	import {
		TODO_STATUS,
		TODO_STATUS_ICON_SIZES,
		type TodoStatus,
		type TodoStatusIconSize
	} from '$lib/constants/status';
	import { cn } from '$lib/utils/cn';

	interface Props {
		/** 待办领域状态 (pending | in_progress | done | abandoned) */
		status?: TodoStatus | string;
		/** 图标预设尺寸规格 (xs: 10px, sm: 14px, md: 16px, lg: 20px) */
		size?: TodoStatusIconSize;
		/** 自定义类名 (如颜色类、外边距等) */
		class?: string;
	}

	let {
		status = TODO_STATUS.PENDING,
		size = 'sm',
		class: className = ''
	}: Props = $props();

	const currentStatus = $derived((status as TodoStatus) || TODO_STATUS.PENDING);
	const sizeClass = $derived(TODO_STATUS_ICON_SIZES[size] || TODO_STATUS_ICON_SIZES.sm);
	const mergedClass = $derived(cn(sizeClass, 'shrink-0', className));
</script>

{#if currentStatus === TODO_STATUS.DONE}
	<!-- Completed: 极简折线对勾 -->
	<svg
		class={mergedClass}
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
		stroke-width="3"
		aria-hidden="true"
	>
		<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
	</svg>
{:else if currentStatus === TODO_STATUS.IN_PROGRESS}
	<!-- In Progress: 几何仪表盘/饼图进度 -->
	<svg
		class={mergedClass}
		viewBox="0 0 24 24"
		fill="none"
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.2" />
		<path d="M12 12 L12 3 A9 9 0 0 1 21 12 Z" fill="currentColor" />
	</svg>
{:else if currentStatus === TODO_STATUS.ABANDONED}
	<!-- Abandoned: 极简叉号 -->
	<svg
		class={mergedClass}
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
		stroke-width="2.5"
		aria-hidden="true"
	>
		<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
	</svg>
{:else}
	<!-- Pending: 实线规整空心圆 -->
	<svg
		class={mergedClass}
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
		stroke-width="2.2"
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="9" />
	</svg>
{/if}
