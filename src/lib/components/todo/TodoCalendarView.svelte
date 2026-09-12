<script lang="ts">
	import type { createMyTodosResource, CalendarDayCell } from '$lib/stores/resources/use-my-todos.svelte';
	import { getStatusConfig } from '$lib/constants/status';
	import TodoItem from '$lib/components/todo/TodoItem.svelte';

	interface Props {
		resource: ReturnType<typeof createMyTodosResource>;
	}

	let { resource }: Props = $props();

	const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

	const monthTitle = $derived(
		`${resource.calendarYear} 年 ${resource.calendarMonth + 1} 月`
	);

	const monthTodos = $derived.by(() => {
		const res = [];
		for (const cell of resource.monthCalendarDays) {
			if (cell.isCurrentMonth) {
				res.push(...cell.todos);
			}
		}
		return res;
	});

	const monthTotal = $derived(monthTodos.length);
	const monthDone = $derived(monthTodos.filter((t) => t.status === 'done').length);

	function onSelectDay(cell: CalendarDayCell) {
		resource.selectCalendarDate(cell.dateStr);
	}
</script>

<!-- Google 日历经典开阔布局结构：零外层死板大框，纯净大间距留白与全站中性灰阶美学 -->
<div class="space-y-6 sm:space-y-8">
	<!-- 顶部控制栏 (今天快捷键 + 翻页箭头 + 大标题 + 统计) -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<!-- 左侧：今天按钮 + 翻页箭头 + 优雅月份标题 -->
		<div class="flex items-center gap-3">
			<!-- 「今天」按钮 (中性软灰，无硬边框) -->
			<button
				type="button"
				onclick={() => resource.resetToCurrentMonth()}
				class="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
			>
				今天
			</button>

			<!-- 翻页箭头 -->
			<div class="flex items-center gap-0.5">
				<button
					type="button"
					onclick={() => resource.prevMonth()}
					class="h-8 w-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
					title="上个月"
					aria-label="Previous month"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				</button>
				<button
					type="button"
					onclick={() => resource.nextMonth()}
					class="h-8 w-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
					title="下个月"
					aria-label="Next month"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</button>
			</div>

			<h2 class="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 ml-1">
				{monthTitle}
			</h2>
		</div>

		<!-- 右侧：当月数据概览 -->
		<div class="text-xs font-mono text-zinc-400">
			本月共 <strong class="text-zinc-800 dark:text-zinc-200 font-semibold">{monthTotal}</strong> 项待办
			{#if monthTotal > 0}
				<span> · 已完成 <strong class="text-zinc-800 dark:text-zinc-200 font-semibold">{monthDone}</strong> 项</span>
			{/if}
		</div>
	</div>

	<!-- Google 日历结构：完全开放的画布式日历网格 (彻底剔除外层卡片框与硬边框) -->
	<div class="space-y-2">
		<!-- 星期表头 (轻盈通透、无任何线条割裂) -->
		<div class="grid grid-cols-7 text-center py-1 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
			{#each WEEKDAYS as wd}
				<div>{wd}</div>
			{/each}
		</div>

		<!-- 42 天矩阵单元格：独立开阔的圆角软背景网格 (gap 排布，无厚重表格线) -->
		<div class="grid grid-cols-7 gap-1.5 sm:gap-2">
			{#each resource.monthCalendarDays as cell (cell.dateStr)}
				{@const isSelected = cell.dateStr === resource.selectedCalendarDate}
				<button
					type="button"
					onclick={() => onSelectDay(cell)}
					class="min-h-[96px] sm:min-h-[116px] p-2 sm:p-2.5 rounded-2xl flex flex-col text-left transition-all cursor-pointer relative group {isSelected
						? 'bg-zinc-200/80 dark:bg-zinc-800/90 shadow-2xs'
						: 'bg-zinc-100/50 dark:bg-zinc-900/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/70'} {cell.isCurrentMonth
						? ''
						: 'opacity-35'}"
				>
					<!-- 日期标号：左上方自然排列 (今天采用全站统一的中性黑白圆徽章，拒绝突兀刺眼的亮蓝) -->
					<div class="flex items-center justify-between mb-1.5 w-full">
						{#if cell.isToday}
							<div
								class="h-5 w-5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center text-[11px] font-bold shadow-xs"
								title="今天"
							>
								{cell.dayNum}
							</div>
						{:else}
							<span
								class="text-xs font-mono font-medium {cell.isCurrentMonth
									? 'text-zinc-700 dark:text-zinc-300'
									: 'text-zinc-400 dark:text-zinc-600'}"
							>
								{cell.dayNum}
							</span>
						{/if}

						{#if cell.todos.length > 0}
							<span class="text-[10px] font-mono text-zinc-400">
								{cell.todos.length}
							</span>
						{/if}
					</div>

					<!-- Google 日历条带状事件流 (使用全站极简中性微卡片，绝无高饱和杂色) -->
					<div class="space-y-1 flex-1 w-full overflow-hidden">
						{#each cell.todos.slice(0, 3) as todo (todo.id)}
							{@const stConfig = getStatusConfig(todo.status)}
							<div
								class="w-full px-2 py-0.5 rounded-lg text-[11px] font-medium truncate flex items-center gap-1.5 bg-white/90 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 shadow-2xs transition-all {todo.status === 'done' || todo.status === 'abandoned'
									? 'line-through text-zinc-400 dark:text-zinc-500 opacity-60'
									: ''}"
								title={todo.content}
							>
								<span class="h-1.5 w-1.5 rounded-full shrink-0 {stConfig.dotClass}"></span>
								<span class="truncate">{todo.content}</span>
							</div>
						{/each}

						{#if cell.todos.length > 3}
							<div class="text-[10px] font-mono text-zinc-400 pl-1">
								+{cell.todos.length - 3} 更多
							</div>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- 底部所选日期待办详细透视 (彻底去边框、纯大间距留白排布) -->
	{#if resource.selectedCalendarDate}
		<div class="space-y-4 pt-4 sm:pt-6">
			<div class="flex items-center justify-between px-1">
				<h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
					{resource.selectedCalendarDate} 待办事项 ({resource.selectedDateTodos.length})
				</h3>
			</div>

			{#if resource.selectedDateTodos.length === 0}
				<div
					class="py-16 text-center text-xs text-zinc-400"
				>
					该日期暂无待办事项
				</div>
			{:else}
				<div class="space-y-1.5 sm:space-y-2">
					{#each resource.selectedDateTodos as todo (todo.id)}
						<TodoItem
							{todo}
							isMine={true}
							ontoggle={(t, next, e) => resource.handleToggle(t, next, e)}
						/>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
