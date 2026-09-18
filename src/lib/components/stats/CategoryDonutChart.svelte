<script lang="ts">
	import type { CategoryStatItem } from '$lib/types/stats';
	import { getCategoryConfig } from '$lib/constants/categories';
	import { calculateDonutSlices } from '$lib/utils/chart';
	import CategoryBadge from '$lib/components/todo/CategoryBadge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		categories: CategoryStatItem[];
		totalTodos?: number;
	}

	let { categories = [], totalTodos }: Props = $props();

	// 单一激活状态：当前激活展示的分类 ID（统一承载鼠标悬停与移动端点击）
	let activeCategory = $state<string | null>(null);

	// 当前高亮类别数据
	const activeCategoryData = $derived(
		activeCategory ? categories.find((c) => c.category === activeCategory) ?? null : null
	);

	function handlePointerEnter(catId: string, e: PointerEvent) {
		// 触摸屏直接由 click/tap 处理，忽略合成的 hover 事件
		if (e.pointerType === 'touch') return;
		activeCategory = catId;
	}

	function handlePointerLeave(e: PointerEvent) {
		if (e.pointerType === 'touch') return;
		activeCategory = null;
	}

	function handleToggle(catId: string) {
		// 点击或轻触切换：如果是当前激活项则收回，否则弹出
		activeCategory = activeCategory === catId ? null : catId;
	}

	function handleReset() {
		activeCategory = null;
	}

	const totalSum = $derived(
		totalTodos ?? categories.reduce((sum, item) => sum + (item.total > 0 ? item.total : 0), 0)
	);

	// 计算环形图各扇区 (基于 200x200 画布，径向外弹 7px)
	const slices = $derived(
		calculateDonutSlices(categories, {
			cx: 100,
			cy: 100,
			outerRadius: 82,
			innerRadius: 56,
			padAngle: 0.035,
			popDistance: 7
		})
	);
</script>

{#if categories.length === 0 || totalSum === 0}
	<EmptyState
		title="No category data available"
		class="py-12 border-none bg-transparent"
	>
		{#snippet icon()}
			<Icon icon="lucide:pie-chart" class="h-6 w-6 text-indigo-500" />
		{/snippet}
	</EmptyState>
{:else}
	<div class="flex flex-col lg:flex-row items-center gap-6 lg:gap-10 pt-2 select-none">
	<!-- 左侧：SVG 环形图 (Donut Chart) 与中心 HUD -->
	<div class="relative w-[220px] h-[220px] shrink-0">
		<svg
			viewBox="0 0 200 200"
			class="w-full h-full overflow-visible outline-none focus:outline-none select-none"
			style="outline: none; -webkit-tap-highlight-color: transparent;"
		>
			<!-- 环形底槽 (柔和灰底圈) -->
			<circle
				cx="100"
				cy="100"
				r="69"
				stroke-width="26"
				fill="none"
				class="stroke-zinc-100 dark:stroke-zinc-800/60 opacity-80 pointer-events-none"
			/>

			<!-- 各分类扇区：双层解耦架构 (Ghost Hit-test Proxy + Visual Presentation) -->
			{#each slices as slice (slice.data.category)}
				{@const catConfig = getCategoryConfig(slice.data.category)}
				{@const color = catConfig?.color || '#6B7280'}
				{@const isCurrentActive = activeCategory === slice.data.category}
				{@const isMuted = activeCategory !== null && !isCurrentActive}

				{#if slice.pathData}
					<g class="outline-none select-none">
						<!-- 1. 底层：静止不动的事件命中代理层 (Ghost Hit Target) -->
						<!-- 绝对不参与 translate 位移，加宽 stroke 确保包含边缘裕度，彻底断绝脱靶振荡 -->
						<path
							d={slice.pathData}
							fill="transparent"
							stroke="transparent"
							stroke-width="12"
							stroke-linejoin="round"
							class="cursor-pointer outline-none focus:outline-none"
							style="outline: none; -webkit-tap-highlight-color: transparent;"
							role="button"
							tabindex="0"
							aria-label={`${catConfig?.name || slice.data.category}: ${slice.data.total} (${slice.percentage}%)`}
							onpointerenter={(e) => handlePointerEnter(slice.data.category, e)}
							onpointerleave={handlePointerLeave}
							onclick={() => handleToggle(slice.data.category)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									handleToggle(slice.data.category);
								}
							}}
						/>

						<!-- Visual Presentation Layer -->
						<path
							d={slice.pathData}
							fill={color}
							stroke={isCurrentActive ? '#ffffff' : 'transparent'}
							stroke-width={isCurrentActive ? 2 : 0}
							class="pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
							style="
								transform: translate({isCurrentActive ? slice.dx : 0}px, {isCurrentActive ? slice.dy : 0}px);
								opacity: {isMuted ? 0.35 : 1};
								filter: {isCurrentActive ? `drop-shadow(0 4px 10px ${color}77)` : 'none'};
							"
						/>
					</g>
				{/if}
			{/each}
		</svg>

		<!-- Center HUD -->
		<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
			<button
				type="button"
				tabindex={activeCategory ? 0 : -1}
				onclick={handleReset}
				title={activeCategory ? 'Reset to overall view' : undefined}
				class="w-[112px] h-[112px] rounded-full flex flex-col items-center justify-center p-2 text-center transition-all duration-200 outline-none focus:outline-none select-none {activeCategory
					? 'cursor-pointer pointer-events-auto hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50'
					: 'pointer-events-none'}"
				style="outline: none; -webkit-tap-highlight-color: transparent;"
			>
				{#if activeCategoryData}
					{@const activeConfig = getCategoryConfig(activeCategoryData.category)}
					<div class="space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
						<div class="flex items-center justify-center gap-1">
							<span
								class="h-2 w-2 rounded-full"
								style="background-color: {activeConfig?.color || '#6B7280'};"
							></span>
							<span class="text-xs font-bold text-zinc-800 dark:text-zinc-200">
								{activeConfig?.name || activeCategoryData.category}
							</span>
						</div>
						<div
							class="text-2xl font-black font-mono tracking-tight"
							style="color: {activeConfig?.color || '#6B7280'};"
						>
							{activeCategoryData.total.toLocaleString()}
						</div>
						<div class="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
							<span class="font-bold">{activeCategoryData.percentage}% share</span>
							<span class="opacity-60">·</span>
							<span class="text-emerald-600 dark:text-emerald-400 font-semibold">{activeCategoryData.completionRate}% completed</span>
						</div>
					</div>
				{:else}
					<div class="space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
						<div class="text-[10px] text-zinc-400 font-medium">Public Todos</div>
						<div class="text-2xl sm:text-3xl font-black font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">
							{totalSum.toLocaleString()}
						</div>
						<div class="text-[10px] font-mono text-zinc-400">
							{categories.length} categories
						</div>
					</div>
				{/if}
			</button>
		</div>
	</div>

	<!-- Right grid of categories -->
	<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 flex-1 w-full min-w-0">
		{#each categories as cat (cat.category)}
			{@const catConfig = getCategoryConfig(cat.category)}
			{@const color = catConfig?.color || '#6B7280'}
			{@const isCurrentActive = activeCategory === cat.category}
			{@const isMuted = activeCategory !== null && !isCurrentActive}

			<div
				role="button"
				tabindex="0"
				onpointerenter={(e) => handlePointerEnter(cat.category, e)}
				onpointerleave={handlePointerLeave}
				onclick={() => handleToggle(cat.category)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleToggle(cat.category);
					}
				}}
				class="p-2.5 rounded-xl border transition-all duration-200 cursor-pointer space-y-2 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none {isCurrentActive
					? 'bg-zinc-100/95 dark:bg-zinc-800/90 border-zinc-400 dark:border-zinc-600 shadow-xs ring-1 ring-zinc-300 dark:ring-zinc-700'
					: 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-800/60 hover:border-zinc-300/80'}"
				style="opacity: {isMuted ? 0.35 : 1}; outline: none; -webkit-tap-highlight-color: transparent;"
			>
				<div class="flex items-center justify-between text-xs">
					<CategoryBadge category={cat.category} mode="pill" />
					<div class="font-mono text-right">
						<span class="font-bold text-zinc-800 dark:text-zinc-200 text-xs">
							{cat.completed}
						</span>
						<span class="text-zinc-400 text-[11px]"> / {cat.total}</span>
						<span class="text-zinc-400 text-[10px] ml-0.5">({cat.percentage}%)</span>
					</div>
				</div>

				<div class="h-1.5 w-full bg-zinc-200/70 dark:bg-zinc-800 rounded-full overflow-hidden flex">
					<div
						class="h-full rounded-full transition-all duration-300"
						style="width: {cat.completionRate}%; background-color: {color};"
					></div>
				</div>

				<div class="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
					<span>Completion</span>
					<span class="font-semibold text-emerald-600 dark:text-emerald-400">{cat.completionRate}%</span>
				</div>
			</div>
		{/each}
	</div>
</div>
{/if}
