<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/services/api';
	import type { DailyCard } from '$lib/types/todo';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	let cards = $state<DailyCard[]>([]);
	let loading = $state(true);

	function getTodayString(): string {
		const now = new Date();
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, '0');
		const d = String(now.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	onMount(async () => {
		try {
			const res = await api.getDailyCards({ date: getTodayString() });
			cards = res.cards || [];
		} catch (error) {
			console.error('Failed to load daily cards:', error);
		} finally {
			loading = false;
		}
	});
</script>

<div class="w-full">
	{#if loading}
		<div class="flex justify-center py-12 text-zinc-400">
			<Spinner size="md" />
		</div>
	{:else if cards.length === 0}
		<div class="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 py-12 text-center text-xs text-zinc-400">
			今日暂无待办
		</div>
	{:else}
		<!-- 纯粹聚合列表：仅展示 Todo 内容 -->
		<ul class="divide-y divide-zinc-100 dark:divide-zinc-800/80 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
			{#each cards as card (card.topicHash)}
				<li class="px-5 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
					{card.content}
				</li>
			{/each}
		</ul>
	{/if}
</div>
