<script lang="ts">
	import type { TodoStatus } from '$lib/types/todo';

	interface Props {
		content: string;
		status?: TodoStatus | string;
		size?: 'xs' | 'sm' | 'base';
		truncate?: boolean;
		class?: string;
	}

	let {
		content,
		status = 'pending',
		size = 'sm',
		truncate = false,
		class: className = ''
	}: Props = $props();

	const isDone = $derived(status === 'done');
	const isAbandoned = $derived(status === 'abandoned');
	const isInProgress = $derived(status === 'in_progress');

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
