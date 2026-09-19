<script lang="ts">
	import type { HeatmapDayItem } from '$lib/types/stats';
	import { parseLocalDate } from '$lib/utils/format';
	import { ACTIVITY_CONFIG } from '$lib/constants/activity';

	interface Props {
		days?: HeatmapDayItem[];
		compact?: boolean;
	}

	let { days = [], compact = false }: Props = $props();

	// 根容器与横向滚动容器引用
	let rootEl = $state<HTMLElement | null>(null);
	let scrollContainer = $state<HTMLElement | null>(null);

	// 悬浮 Tooltip 状态
	let hoveredDay = $state<HeatmapDayItem | null>(null);
	let tooltipPos = $state<{ x: number; y: number; showBelow: boolean }>({ x: 0, y: 0, showBelow: false });

	// 将连续的天按“周”划分成列 (每周 7 行，周一至周日)
	interface WeekColumn {
		monthLabel?: string;
		days: (HeatmapDayItem | null)[];
	}

	function generateFallbackDays(count: number): HeatmapDayItem[] {
		const res: HeatmapDayItem[] = [];
		const now = new Date();
		for (let i = count - 1; i >= 0; i--) {
			const d = new Date(now);
			d.setDate(d.getDate() - i);
			const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			res.push({
				date: dateStr,
				count: 0,
				level: 0,
				created: 0,
				completed: 0,
				notes: 0
			});
		}
		return res;
	}

	const isDataEmpty = $derived(!days || days.length === 0);
	const effectiveDays = $derived.by(() => {
		if (days && days.length > 0) return days;
		return generateFallbackDays(compact ? 120 : 365);
	});

	const weeks = $derived.by(() => {
		// 获取客户端当前本地日期的 YYYY-MM-DD，严格过滤掉未来的未到来日期
		const now = new Date();
		const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
		const targetDays = effectiveDays.filter((d) => d.date <= todayStr);
		if (targetDays.length === 0) return [];

		const cols: WeekColumn[] = [];
		let currentWeekDays: (HeatmapDayItem | null)[] = [];
		let lastMonth = -1;

		// 计算首日的星期几 (0: 周日, 1: 周一, ... 6: 周六) -> 调整为周一开始 (0: 周一, ... 6: 周日)
		const firstDate = parseLocalDate(targetDays[0].date);
		const rawDay = firstDate.getDay();
		const firstDayOfWeek = isNaN(rawDay) ? 0 : (rawDay + 6) % 7; // 周一为 0

		// 首周前面填充空白 cell
		for (let i = 0; i < firstDayOfWeek; i++) {
			currentWeekDays.push(null);
		}

		for (let i = 0; i < targetDays.length; i++) {
			const item = targetDays[i];
			const d = parseLocalDate(item.date);
			const month = d.getMonth();

			currentWeekDays.push(item);

			// 当周满 7 天，推入一列
			if (currentWeekDays.length === 7) {
				let monthLabel: string | undefined = undefined;
				if (month !== lastMonth) {
					monthLabel = d.toLocaleString('en-US', { month: 'short' });
					lastMonth = month;
				}
				cols.push({ monthLabel, days: currentWeekDays });
				currentWeekDays = [];
			}
		}

		// 处理最后一周剩余的 cell (未到来的未来日期填充 null 保持对齐)
		if (currentWeekDays.length > 0) {
			while (currentWeekDays.length < 7) {
				currentWeekDays.push(null);
			}
			cols.push({ days: currentWeekDays });
		}

		return cols;
	});

	// 初次挂载或数据就绪后，滚动容器自动对齐至最右侧（聚焦今天）
	$effect(() => {
		if (weeks.length > 0 && scrollContainer) {
			requestAnimationFrame(() => {
				if (scrollContainer) {
					scrollContainer.scrollLeft = scrollContainer.scrollWidth;
				}
			});
		}
	});

	function formatTooltipDate(dateStr: string): string {
		try {
			const d = parseLocalDate(dateStr);
			if (isNaN(d.getTime())) return dateStr;
			return d.toLocaleDateString('en-US', {
				weekday: 'short',
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return dateStr;
		}
	}

	function handleMouseEnter(e: MouseEvent, day: HeatmapDayItem) {
		hoveredDay = day;
		const target = e.currentTarget as HTMLElement;
		if (!rootEl) return;

		const rootRect = rootEl.getBoundingClientRect();
		const targetRect = target.getBoundingClientRect();

		// 计算目标格子中心相对于 rootEl 的 X 轴距离
		const targetCenterX = targetRect.left - rootRect.left + targetRect.width / 2;
		// 计算目标格子顶部相对于 rootEl 的 Y 轴距离
		const targetTopY = targetRect.top - rootRect.top;

		// 水平防溢出 Clamping：Tooltip 宽度约 192px (w-48)，半宽取 96px + 4px 边距
		const halfTooltipWidth = 96;
		const minX = halfTooltipWidth + 4;
		const maxX = Math.max(minX, rootRect.width - halfTooltipWidth - 4);
		const clampedX = Math.max(minX, Math.min(maxX, targetCenterX));

		// 垂直方向判断：确保格子上方有充足空间容纳吸顶导航栏 (56px) + Tooltip 展开高度 (约 136px) + 安全间距 (18px) = 210px
		// 若距离视口顶端不足 210px，向上弹出将会撞击或重叠吸顶导航栏，此时平滑翻转至下方
		const NAVBAR_HEIGHT = 56;
		const TOOLTIP_TOTAL_HEIGHT = 144;
		const VIEWPORT_PADDING = 10;
		const MIN_TOP_SPACE = NAVBAR_HEIGHT + TOOLTIP_TOTAL_HEIGHT + VIEWPORT_PADDING; // 210px

		const showBelow = targetRect.top < MIN_TOP_SPACE;
		const y = showBelow ? targetTopY + targetRect.height + 8 : targetTopY - 8;

		tooltipPos = {
			x: clampedX,
			y,
			showBelow
		};
	}

	function handleMouseLeave() {
		hoveredDay = null;
	}

	const weekdayLabels = ['M', '', 'W', '', 'F', '', 'S'];
</script>

<div class="relative w-full" bind:this={rootEl}>
	<!-- Heatmap container -->
	<div
		bind:this={scrollContainer}
		class="overflow-x-auto scroll-smooth no-scrollbar pb-1 {compact ? '' : 'sm:px-1'}"
	>
		<div class="inline-flex flex-col gap-1.5 min-w-max select-none">
			<!-- Month labels -->
			<div class="flex text-[10px] text-zinc-400 dark:text-zinc-500 font-medium {compact ? 'pl-0' : 'pl-[22px]'} h-4">
				{#each weeks as week, idx (idx)}
					<div class="w-3 shrink-0 relative mr-1">
						{#if week.monthLabel}
							<span class="absolute left-0 top-0 whitespace-nowrap text-[10px] leading-none select-none">
								{week.monthLabel}
							</span>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Grid: Weekday labels + cells -->
			<div class="flex gap-1.5 items-start">
				{#if !compact}
					<div class="flex flex-col gap-1 text-[9px] text-zinc-400 dark:text-zinc-500 font-mono pr-1 pt-0.5 shrink-0">
						{#each weekdayLabels as label, i (i)}
							<div class="h-3 w-3 flex items-center justify-end leading-none">
								{label}
							</div>
						{/each}
					</div>
				{/if}

				<!-- Dot columns -->
				<div class="flex gap-1">
					{#each weeks as week, wIdx (wIdx)}
						<div class="flex flex-col gap-1">
							{#each week.days as day, dIdx (dIdx)}
								{#if day}
									<div
										role="button"
										tabindex="0"
										aria-label={`${day.date}: ${day.count} activities`}
										onmouseenter={(e) => handleMouseEnter(e, day)}
										onmouseleave={handleMouseLeave}
										class="h-3 w-3 rounded-xs transition-all cursor-pointer border {day.level === 0
											? 'bg-zinc-100/90 dark:bg-zinc-800/60 border-zinc-200/70 dark:border-zinc-800/80 hover:border-zinc-400'
											: day.level === 1
												? 'bg-emerald-200 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-900 hover:border-emerald-400'
												: day.level === 2
													? 'bg-emerald-300 dark:bg-emerald-800 border-emerald-400 dark:border-emerald-700 hover:border-emerald-500'
													: day.level === 3
														? 'bg-emerald-500 dark:bg-emerald-600 border-emerald-600 dark:border-emerald-500 hover:border-emerald-400'
														: 'bg-emerald-600 dark:bg-emerald-400 border-emerald-700 dark:border-emerald-300 hover:border-emerald-200 shadow-2xs'}"
									></div>
								{:else}
									<div class="h-3 w-3 rounded-xs opacity-0 pointer-events-none"></div>
								{/if}
							{/each}
						</div>
					{/each}
				</div>
			</div>

			<!-- Legend -->
			<div class="flex items-center justify-between pt-1 text-[10px] text-zinc-400 font-medium {compact ? 'text-[9px]' : ''}">
				{#if !compact}
					<div>
						<span>Activity · Past year</span>
						{#if isDataEmpty}
							<span class="text-zinc-400/80 dark:text-zinc-500 ml-1 font-normal">· No records</span>
						{/if}
					</div>
				{/if}
				<div class="flex items-center gap-1.5 ml-auto">
					<span>Less</span>
					<div class="flex items-center gap-1">
						<span class="h-2.5 w-2.5 rounded-xs bg-zinc-100/90 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-800/80"></span>
						<span class="h-2.5 w-2.5 rounded-xs bg-emerald-200 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-900"></span>
						<span class="h-2.5 w-2.5 rounded-xs bg-emerald-300 dark:bg-emerald-800 border border-emerald-400 dark:border-emerald-700"></span>
						<span class="h-2.5 w-2.5 rounded-xs bg-emerald-500 dark:bg-emerald-600 border border-emerald-600 dark:border-emerald-500"></span>
						<span class="h-2.5 w-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-400 border border-emerald-700 dark:border-emerald-300"></span>
					</div>
					<span>More</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Tooltip popup -->
	{#if hoveredDay}
		<div
			class="absolute z-50 pointer-events-none -translate-x-1/2 w-48 px-3 py-2.5 rounded-xl bg-zinc-900/95 dark:bg-zinc-100/95 backdrop-blur-md text-white dark:text-zinc-900 text-xs shadow-xl ring-1 ring-zinc-800/80 dark:ring-zinc-200/80 transition-all duration-75 select-none whitespace-nowrap {tooltipPos.showBelow ? 'translate-y-0' : '-translate-y-full'}"
			style="left: {tooltipPos.x}px; top: {tooltipPos.y}px;"
		>
			<div class="flex items-center justify-between gap-2 pb-1.5 mb-2 border-b border-zinc-800 dark:border-zinc-200/90 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
				<span>{formatTooltipDate(hoveredDay.date)}</span>
			</div>
			{#if hoveredDay.count === 0}
				<div class="text-[11px] text-zinc-400 dark:text-zinc-500 py-0.5">
					No {ACTIVITY_CONFIG.total.label.toLowerCase()}
				</div>
			{:else}
				<div class="space-y-1.5 text-[11px]">
					<div class="flex items-center justify-between gap-3">
						<span class="text-zinc-300 dark:text-zinc-600 font-medium">{ACTIVITY_CONFIG.total.label}</span>
						<span class="font-mono font-semibold text-emerald-400 dark:text-emerald-600 shrink-0">{hoveredDay.count} {ACTIVITY_CONFIG.total.unit}</span>
					</div>
					<div class="flex items-center justify-between gap-3">
						<span class="text-zinc-400 dark:text-zinc-500">{ACTIVITY_CONFIG.created.label}</span>
						<span class="font-mono text-zinc-200 dark:text-zinc-700 shrink-0">{hoveredDay.created} {ACTIVITY_CONFIG.created.unit}</span>
					</div>
					<div class="flex items-center justify-between gap-3">
						<span class="text-zinc-400 dark:text-zinc-500">{ACTIVITY_CONFIG.completed.label}</span>
						<span class="font-mono text-zinc-200 dark:text-zinc-700 shrink-0">{hoveredDay.completed} {ACTIVITY_CONFIG.completed.unit}</span>
					</div>
					{#if hoveredDay.notes > 0}
						<div class="flex items-center justify-between gap-3">
							<span class="text-zinc-400 dark:text-zinc-500">{ACTIVITY_CONFIG.notes.label}</span>
							<span class="font-mono text-zinc-200 dark:text-zinc-700 shrink-0">{hoveredDay.notes} {ACTIVITY_CONFIG.notes.unit}</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
