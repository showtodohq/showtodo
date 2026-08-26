<script lang="ts">
	import type { Todo } from '$lib/types/todo';
	import { getCategoryConfig } from '$lib/constants/categories';

	interface Props {
		todo: Todo;
		onClick?: (todo: Todo) => void;
	}

	let { todo, onClick }: Props = $props();

	const categoryConfig = $derived(getCategoryConfig(todo.category));
	const isDone = $derived(todo.status === 'done' || todo.status === 'abandoned');
	const isInProgress = $derived(todo.status === 'in_progress');

	const pillClasses = $derived(() => {
		const base =
			'group w-full text-left px-2.5 py-1.5 rounded-lg text-xs leading-snug font-medium transition-all duration-150 border select-none cursor-pointer block truncate shadow-2xs';

		// 默认分类配色
		const colorClass =
			categoryConfig?.pillClass ||
			'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 dark:bg-zinc-800/60 dark:hover:bg-zinc-700/60 dark:text-zinc-200 border-zinc-200/80 dark:border-zinc-700';

		if (isInProgress) {
			return `${base} ${colorClass} animate-pulse-glow ring-1 ring-blue-400/40`;
		}

		if (isDone) {
			return `${base} ${colorClass} line-through opacity-60 saturate-50`;
		}

		return `${base} ${colorClass} hover:translate-y-[-1px] hover:shadow-xs`;
	});
</script>

<button
	type="button"
	class={pillClasses()}
	onclick={() => onClick?.(todo)}
	title={todo.content}
>
	<span class="block truncate">
		{todo.content}
	</span>
</button>
