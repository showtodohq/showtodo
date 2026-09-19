<script lang="ts">
	import type { TodoStatus } from '$lib/types/todo';
	import {
		TODO_STATUS,
		isStatusDone,
		isStatusAbandoned,
		isStatusInProgress
	} from '$lib/constants/status';

	interface Props {
		content: string;
		status?: TodoStatus | string;
		size?: 'xs' | 'sm' | 'base' | 'lg';
		as?: 'p' | 'h1' | 'h2' | 'span';
		truncate?: boolean;
		class?: string;
	}

	let {
		content,
		status = TODO_STATUS.PENDING,
		size = 'sm',
		as = 'p',
		truncate = false,
		class: className = ''
	}: Props = $props();

	const isDone = $derived(isStatusDone(status));
	const isAbandoned = $derived(isStatusAbandoned(status));
	const isInProgress = $derived(isStatusInProgress(status));

	const sizeClasses = {
		xs: 'text-xs leading-normal',
		sm: 'text-[15px] leading-snug',
		base: 'text-base leading-relaxed',
		lg: 'text-xl sm:text-2xl tracking-tight leading-snug'
	};

	const weightClass = $derived(
		isDone || isAbandoned
			? 'font-normal'
			: size === 'lg'
				? 'font-bold'
				: 'font-medium'
	);

	const stateClass = $derived(
		isDone
			? 'line-through decoration-zinc-400 dark:decoration-zinc-500 text-zinc-400 dark:text-zinc-500'
			: isAbandoned
				? 'line-through decoration-zinc-300 dark:decoration-zinc-700 text-zinc-400 dark:text-zinc-500 opacity-60'
				: 'text-zinc-900 dark:text-zinc-100'
	);
</script>

<svelte:element
	this={as}
	class="transition-colors duration-150 {sizeClasses[size]} {weightClass} {stateClass} {truncate
		? 'truncate'
		: 'break-words'} {className}"
>
	{content}
</svelte:element>
