<script lang="ts">
	import type { CategoryId } from '$lib/types/todo';
	import { getCategoryConfig } from '$lib/constants/categories';

	interface Props {
		category?: CategoryId | string | null;
		mode?: 'pill' | 'dot';
		class?: string;
	}

	let { category, mode = 'pill', class: className = '' }: Props = $props();

	const catConfig = $derived(getCategoryConfig(category));
</script>

{#if catConfig}
	{#if mode === 'pill'}
		<!-- 胶囊模式：微底色 + 颜色圆点 + 分类名称 -->
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
	{:else if mode === 'dot'}
		<!-- 圆点模式：单个颜色小圆点 -->
		<span
			class="h-1.5 w-1.5 rounded-full shrink-0 select-none {className}"
			style="background-color: {catConfig.color};"
			title="分类: {catConfig.name}"
		></span>
	{/if}
{/if}
