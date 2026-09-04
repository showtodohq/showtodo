<script lang="ts">
	import type { CategoryId } from '$lib/types/todo';
	import { getCategoryConfig } from '$lib/constants/categories';

	interface Props {
		category?: CategoryId | string | null;
		mode?: 'pill' | 'dot';
		onclick?: (category: CategoryId | string, e: MouseEvent) => void;
		class?: string;
	}

	let { category, mode = 'pill', onclick, class: className = '' }: Props = $props();

	const catConfig = $derived(getCategoryConfig(category));

	function handleClick(e: MouseEvent) {
		if (!onclick || !category) return;
		e.stopPropagation();
		onclick(category, e);
	}
</script>

{#if catConfig}
	{#if mode === 'pill'}
		{#if onclick}
			<!-- 可点击胶囊按钮 -->
			<button
				type="button"
				onclick={handleClick}
				class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium select-none transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95 hover:opacity-90 {className}"
				style="background-color: {catConfig.color}15; color: {catConfig.color};"
				title="点击按「{catConfig.name}」筛选"
			>
				<span
					class="h-1.5 w-1.5 rounded-full shrink-0"
					style="background-color: {catConfig.color};"
				></span>
				{catConfig.name}
			</button>
		{:else}
			<!-- 普通静态展示胶囊 -->
			<span
				class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium select-none {className}"
				style="background-color: {catConfig.color}15; color: {catConfig.color};"
				title="分类: {catConfig.name}"
			>
				<span
					class="h-1.5 w-1.5 rounded-full shrink-0"
					style="background-color: {catConfig.color};"
				></span>
				{catConfig.name}
			</span>
		{/if}
	{:else if mode === 'dot'}
		<!-- 圆点模式：单个颜色小圆点 -->
		<span
			class="h-1.5 w-1.5 rounded-full shrink-0 select-none {className}"
			style="background-color: {catConfig.color};"
			title="分类: {catConfig.name}"
		></span>
	{/if}
{/if}
