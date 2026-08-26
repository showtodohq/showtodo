<script lang="ts">
	import { CATEGORIES } from '$lib/constants/categories';
	import { TODO_STATUSES } from '$lib/constants/status';
	import { userStore } from '$lib/stores/user.svelte';
	import type { TodoStatus } from '$lib/types/todo';
	import Icon from '@iconify/svelte';

	interface Props {
		selectedStatus: TodoStatus | 'all';
		selectedCategory: string | 'all';
		onlyMine: boolean;
		onStatusChange: (status: TodoStatus | 'all') => void;
		onCategoryChange: (category: string | 'all') => void;
		onOnlyMineChange: (onlyMine: boolean) => void;
	}

	let {
		selectedStatus,
		selectedCategory,
		onlyMine,
		onStatusChange,
		onCategoryChange,
		onOnlyMineChange
	}: Props = $props();
</script>

<div class="space-y-3">
	<!-- Top Bar: Status Tabs & Only Mine Toggle -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
		<!-- Status Tabs -->
		<div class="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
			<button
				type="button"
				onclick={() => onStatusChange('all')}
				class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer {selectedStatus ===
				'all'
					? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
					: 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800'}"
			>
				全部动态
			</button>
			{#each TODO_STATUSES as st}
				<button
					type="button"
					onclick={() => onStatusChange(st.id)}
					class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer {selectedStatus ===
					st.id
						? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
						: 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800'}"
				>
					<span class="w-1.5 h-1.5 rounded-full {st.dotClass}"></span>
					<span>{st.label}</span>
				</button>
			{/each}
		</div>

		<!-- Only Mine Filter (if logged in / has email) -->
		{#if userStore.email}
			<button
				type="button"
				onclick={() => onOnlyMineChange(!onlyMine)}
				class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border {onlyMine
					? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300'
					: 'bg-transparent border-zinc-200/80 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}"
			>
				<Icon icon={onlyMine ? 'lucide:check' : 'lucide:user'} class="w-3.5 h-3.5" />
				<span>只看我的 Todo</span>
			</button>
		{/if}
	</div>

	<!-- Bottom: Category Pills -->
	<div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
		<button
			type="button"
			onclick={() => onCategoryChange('all')}
			class="px-2.5 py-1 rounded-full text-xs transition-colors whitespace-nowrap cursor-pointer {selectedCategory ===
			'all'
				? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 font-medium'
				: 'bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}"
		>
			所有分类
		</button>
		{#each CATEGORIES as cat}
			<button
				type="button"
				onclick={() => onCategoryChange(cat.id)}
				class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors whitespace-nowrap cursor-pointer {selectedCategory ===
				cat.id
					? cat.bgClass + ' ' + cat.textClass + ' font-medium ring-1 ring-current'
					: 'bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}"
			>
				<span class="w-1.5 h-1.5 rounded-full {cat.dotClass}"></span>
				<span>{cat.name}</span>
			</button>
		{/each}
	</div>
</div>
