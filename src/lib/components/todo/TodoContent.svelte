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
		size?: 'xs' | 'sm' | 'base';
		truncate?: boolean;
		class?: string;
	}

	let {
		content,
		status = TODO_STATUS.PENDING,
		size = 'sm',
		truncate = false,
		class: className = ''
	}: Props = $props();

	const isDone = $derived(isStatusDone(status));
	const isAbandoned = $derived(isStatusAbandoned(status));
	const isInProgress = $derived(isStatusInProgress(status));

	const sizeClasses = {
		xs: 'text-xs leading-normal',
		sm: 'text-[15px] leading-snug',
		base: 'text-base leading-relaxed'
	};
</script>

<p
	class="transition-colors duration-150 {sizeClasses[size]} {truncate
		? 'truncate'
		: 'break-words'} {isDone
		? 'line-through decoration-zinc-400 dark:decoration-zinc-500 text-zinc-500 dark:text-zinc-400 font-normal'
		: isAbandoned
			? 'line-through decoration-zinc-300 dark:decoration-zinc-700 text-zinc-400 dark:text-zinc-500 opacity-60 font-normal'
			: 'text-zinc-900 dark:text-zinc-100 font-medium'} {className}"
>
	{content}
</p>
