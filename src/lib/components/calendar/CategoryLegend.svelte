<script lang="ts">
	import { CATEGORIES } from '$lib/constants/categories';

	interface Props {
		selectedCategory?: string | 'all';
		onSelectCategory?: (category: string | 'all') => void;
	}

	let { selectedCategory = 'all', onSelectCategory }: Props = $props();

	function handleToggle(catId: string) {
		if (selectedCategory === catId) {
			onSelectCategory?.('all');
		} else {
			onSelectCategory?.(catId);
		}
	}
</script>

<div class="flex flex-wrap items-center justify-center gap-2 sm:gap-4 py-3 select-none text-xs">
	{#each CATEGORIES as cat (cat.id)}
		{@const isActive = selectedCategory === cat.id}
		<button
			type="button"
			onclick={() => handleToggle(cat.id)}
			class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer {isActive
				? 'border-zinc-800 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
				: 'border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
		>
			<span class="w-2 h-2 rounded-full {cat.dotClass}"></span>
			<span class="font-medium text-[11px] sm:text-xs">{cat.name}</span>
		</button>
	{/each}
</div>
