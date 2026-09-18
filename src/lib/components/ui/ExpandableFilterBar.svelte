<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		SEARCH_FOCUS_SHORTCUT,
		SEARCH_ESCAPE_KEY,
		SEARCH_PLACEHOLDERS
	} from '$lib/constants/search';
	import SearchInput from '$lib/components/ui/SearchInput.svelte';
	import Icon from '@iconify/svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		/** 绑定搜索关键词 */
		query?: string;
		/** 搜索占位符 */
		placeholder?: string;
		/** 是否存在任意外部激活的筛选条件（如分类、状态等） */
		hasActiveFilters?: boolean;
		/** 处于摘要态时显示的文本摘要（如 "健身 · 进行中"） */
		summaryText?: string;
		/** 行 1 左侧常驻插槽 (如视图切换器、大 Tab) */
		leading?: Snippet;
		/** 行 1 右侧常驻插槽 (如指标统计) */
		trailing?: Snippet;
		/** 行 2 展开态下注入的业务维度微胶囊插槽 (另起一行) */
		filters?: Snippet;
		/** 尺寸规格 */
		size?: 'sm' | 'md';
		/** 是否开启全局快捷键（'/' 自动展开聚焦） */
		enableGlobalShortcut?: boolean;
		/** 自定义容器类名 */
		class?: string;
		/** 搜索关键词变动回调 */
		onsearch?: (q: string) => void;
		/** 一键重置全部条件回调 */
		onclearall?: () => void;
	}

	let {
		query = $bindable(''),
		placeholder = SEARCH_PLACEHOLDERS.WORKBENCH,
		hasActiveFilters = false,
		summaryText,
		leading,
		trailing,
		filters,
		size = 'sm',
		enableGlobalShortcut = true,
		class: className = '',
		onsearch,
		onclearall
	}: Props = $props();

	let containerRef = $state<HTMLDivElement | null>(null);
	let isExpanded = $state(false);

	// 派生状态计算
	const hasActive = $derived(Boolean(query?.trim()) || hasActiveFilters);
	const isSummary = $derived(!isExpanded && hasActive);

	// 动态摘要显示内容
	const displaySummary = $derived.by(() => {
		if (summaryText) return summaryText;
		if (query?.trim()) return `"${query.trim()}"`;
		return 'Filtered';
	});

	function openExpanded() {
		isExpanded = true;
	}

	function closeExpanded() {
		isExpanded = false;
	}

	function toggleExpanded() {
		isExpanded = !isExpanded;
	}

	function handleClearAll(e?: MouseEvent) {
		e?.stopPropagation();
		query = '';
		onclearall?.();
		onsearch?.('');
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
		if (e.key === SEARCH_ESCAPE_KEY && isExpanded) {
			e.preventDefault();
			closeExpanded();
			return;
		}

		if (!enableGlobalShortcut || isExpanded) return;

		const target = e.target as HTMLElement | null;
		const isInputActive =
			target?.tagName === 'INPUT' ||
			target?.tagName === 'TEXTAREA' ||
			target?.tagName === 'SELECT' ||
			target?.isContentEditable;

		if (isInputActive) return;

		if (e.key === SEARCH_FOCUS_SHORTCUT && !e.metaKey && !e.ctrlKey && !e.altKey) {
			e.preventDefault();
			openExpanded();
		}
	}

	function handleClickOutside(e: MouseEvent) {
		if (!isExpanded || !containerRef) return;
		const target = e.target as Node | null;
		if (target && !containerRef.contains(target)) {
			closeExpanded();
		}
	}
</script>

<svelte:window onkeydown={handleGlobalKeydown} onclick={handleClickOutside} />

<div
	bind:this={containerRef}
	class={cn('w-full relative transition-all', className)}
>
	<!-- 行 1: 始终保持规整单行，左侧 leading (主操作) + 右侧紧凑搜索 Trigger 胶囊与 trailing (绝不另起一行，绝不挤压变形) -->
	<div class="flex items-center justify-between gap-3 w-full">
		<!-- 左区: leading 插槽 (视图切换器 / 模块主 Tabs) -->
		<div class="flex items-center gap-2 min-w-0">
			{#if leading}
				{@render leading()}
			{/if}
		</div>

		<!-- 右区: 紧凑搜索 Trigger 胶囊 + trailing 插槽 (如指标统计) -->
		<div class="flex items-center gap-2 shrink-0 ml-auto">
			{#if isSummary}
				<!-- 激活摘要态微胶囊 (外层匹配 rounded-2xl p-1 底座规范，内部为高亮微徽标 + 一键清除) -->
				<div class="inline-flex items-center rounded-2xl bg-zinc-100/90 dark:bg-zinc-800/80 p-1 text-xs font-medium shadow-2xs shrink-0 animate-in fade-in duration-150">
					<div
						class="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs text-xs font-medium transition-all group"
					>
						<button
							type="button"
							onclick={openExpanded}
							class="inline-flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
							title="Click to edit search and filters"
						>
							<Icon icon="lucide:search" class="h-3.5 w-3.5 text-indigo-500 shrink-0" />
							<span class="max-w-[150px] sm:max-w-[220px] truncate">{displaySummary}</span>
						</button>

						<button
							type="button"
							onclick={handleClearAll}
							class="h-4.5 w-4.5 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ml-0.5 shrink-0"
							title="Reset all filters"
							aria-label="Reset all filters"
						>
							<Icon icon="lucide:x" class="h-3 w-3" />
						</button>
					</div>
				</div>
			{:else}
				<!-- 默认收缩态 Trigger (外层采用同样的 rounded-2xl p-1 底座包裹，与左侧切换器高度完全对齐，内部独立卡片按钮) -->
				<div class="inline-flex items-center rounded-2xl bg-zinc-100/90 dark:bg-zinc-800/80 p-1 text-xs font-medium shadow-2xs shrink-0">
					<button
						type="button"
						onclick={toggleExpanded}
						class="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl font-medium transition-all cursor-pointer group {isExpanded
							? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
							: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-900/50'}"
						title={isExpanded ? 'Collapse filters' : 'Search and filter (Press /)'}
						aria-label={isExpanded ? 'Collapse filters' : 'Open search and filter panel'}
					>
						<Icon icon="lucide:search" class="h-3.5 w-3.5 transition-transform group-hover:scale-110 shrink-0 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 {isExpanded ? 'text-indigo-500' : ''}" />
						<span class="hidden sm:inline text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 font-medium">Search</span>
						{#if enableGlobalShortcut && !isExpanded}
							<kbd class="hidden md:inline-flex items-center justify-center h-4 min-w-4 px-1 rounded bg-zinc-200/70 dark:bg-zinc-700/70 text-[9px] font-mono text-zinc-400 dark:text-zinc-400 leading-none ml-0.5">
								{SEARCH_FOCUS_SHORTCUT}
							</kbd>
						{/if}
					</button>
				</div>
			{/if}

			<!-- 右区 trailing 插槽 (如指标统计) -->
			{#if trailing}
				{@render trailing()}
			{/if}
		</div>
	</div>

	<!-- 悬浮浮层 (Popover): 绝对定位悬浮于文档流之上，零页面布局抖动 (0 CLS)，全面适配移动端 Touch 体验 -->
	{#if isExpanded}
		<div
			class="absolute top-full left-0 right-0 mt-2 z-40 w-full rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl p-3 sm:p-3.5 shadow-2xl transition-all space-y-2.5 animate-in fade-in zoom-in-98 duration-150 ring-1 ring-black/5 dark:ring-white/5"
		>
			<!-- 顶部搜索行: 搜索框 + 重置 + 收起按钮 -->
			<div class="flex items-center gap-2">
				<div class="flex-1 min-w-0">
					<SearchInput
						bind:value={query}
						{placeholder}
						autofocus={true}
						size="sm"
						{onsearch}
						onclear={() => onsearch?.('')}
					/>
				</div>

				{#if hasActive}
					<button
						type="button"
						onclick={handleClearAll}
						class="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 px-2.5 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0 whitespace-nowrap font-medium"
					>
						Reset
					</button>
				{/if}

				<button
					type="button"
					onclick={closeExpanded}
					class="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
					title="Collapse panel (Esc)"
					aria-label="Collapse panel"
				>
					<Icon icon="lucide:chevron-up" class="h-4 w-4" />
				</button>
			</div>

			<!-- 底部维度插槽: 注入各页面特定的微标签组 (支持小屏横向平滑滚动，带自适应滚动遮罩) -->
			{#if filters}
				<div class="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2 overflow-x-auto max-w-full pb-0.5">
					{@render filters()}
				</div>
			{/if}
		</div>
	{/if}
</div>
