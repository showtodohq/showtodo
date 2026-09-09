<script lang="ts">
	import type { HeatmapDayItem } from '$lib/types/stats';
	import { parseLocalDate } from '$lib/utils/format';

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

	const weeks = $derived.by(() => {
		if (!days || days.length === 0) return [];

		// 获取客户端当前本地日期的 YYYY-MM-DD，严格过滤掉未来的未到来日期
		const now = new Date();
		const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
		const targetDays = days.filter((d) => d.date <= todayStr);
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

		// 水平防溢出 Clamping：限制中心在 [80, rootWidth - 80] 避免两侧切边
		const minX = 80;
		const maxX = Math.max(minX, rootRect.width - 80);
		const clampedX = Math.max(minX, Math.min(maxX, targetCenterX));

		// 垂直方向判断：若上方空间不足 46px 则翻转至格子下方
		const showBelow = targetTopY < 46;
		const y = showBelow ? targetTopY + targetRect.height + 6 : targetTopY - 6;

		tooltipPos = {
			x: clampedX,
			y,
			showBelow
		};
	}

	function handleMouseLeave() {
		hoveredDay = null;
	}

	const weekdayLabels = ['一', '', '三', '', '五', '', '日'];
</script>

<div class="relative w-full" bind:this={rootEl}>
	<!-- 热力图容器 (支持在窄屏横向平滑滚动，默认滚动条完全隐藏) -->
	<div
		bind:this={scrollContainer}
		class="overflow-x-auto scroll-smooth no-scrollbar pb-1 {compact ? '' : 'sm:px-1'}"
	>
		<div class="inline-flex flex-col gap-1.5 min-w-max select-none">
			<!-- 月份标签行 (对齐每列 16px 步长，禁止换行和截断) -->
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

			<!-- 网格主体：左侧星期标签 + 右侧点阵列 -->
			<div class="flex gap-1.5 items-start">
				<!-- 星期指示标签 (周一/三/五/日，非紧凑模式展示) -->
				{#if !compact}
					<div class="flex flex-col gap-1 text-[9px] text-zinc-400 dark:text-zinc-500 font-mono pr-1 pt-0.5 shrink-0">
						{#each weekdayLabels as label, i (i)}
							<div class="h-3 w-3 flex items-center justify-end leading-none">
								{label}
							</div>
						{/each}
					</div>
				{/if}

				<!-- 点阵列 (按周) -->
				<div class="flex gap-1">
					{#each weeks as week, wIdx (wIdx)}
						<div class="flex flex-col gap-1">
							{#each week.days as day, dIdx (dIdx)}
								{#if day}
									<!-- 色阶等级样式：自带细腻边框，保证在任何浅色底和深色底清晰可辨 -->
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
									<!-- 未到来的未来日期或首周空白：纯透明占位，不可悬浮，不可交互 -->
									<div class="h-3 w-3 rounded-xs opacity-0 pointer-events-none"></div>
								{/if}
							{/each}
						</div>
					{/each}
				</div>
			</div>

			<!-- 底部图例说明 -->
			<div class="flex items-center justify-between pt-1 text-[10px] text-zinc-400 font-medium {compact ? 'text-[9px]' : ''}">
				{#if !compact}
					<div>
						<span>全站活跃心跳 · 最近一年</span>
					</div>
				{/if}
				<div class="flex items-center gap-1.5 ml-auto">
					<span>少</span>
					<div class="flex items-center gap-1">
						<span class="h-2.5 w-2.5 rounded-xs bg-zinc-100/90 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-800/80"></span>
						<span class="h-2.5 w-2.5 rounded-xs bg-emerald-200 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-900"></span>
						<span class="h-2.5 w-2.5 rounded-xs bg-emerald-300 dark:bg-emerald-800 border border-emerald-400 dark:border-emerald-700"></span>
						<span class="h-2.5 w-2.5 rounded-xs bg-emerald-500 dark:bg-emerald-600 border border-emerald-600 dark:border-emerald-500"></span>
						<span class="h-2.5 w-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-400 border border-emerald-700 dark:border-emerald-300"></span>
					</div>
					<span>多</span>
				</div>
			</div>
		</div>
	</div>

	<!-- 悬浮 Tooltip (基于 rootEl 绝对定位，彻底避开 backdrop-blur 包含块陷阱与边缘截断) -->
	{#if hoveredDay}
		<div
			class="absolute z-50 pointer-events-none -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900 text-xs shadow-lg backdrop-blur-xs transition-all duration-75 space-y-0.5 whitespace-nowrap select-none {tooltipPos.showBelow ? 'translate-y-0' : '-translate-y-full'}"
			style="left: {tooltipPos.x}px; top: {tooltipPos.y}px;"
		>
			<div class="font-semibold font-mono text-[11px] text-zinc-200 dark:text-zinc-700">
				{hoveredDay.date}
			</div>
			<div class="text-[11px] flex items-center gap-2">
				<span>活跃度: <strong class="text-emerald-400 dark:text-emerald-600 font-bold">{hoveredDay.count}</strong></span>
				{#if hoveredDay.completed > 0}
					<span class="text-zinc-300 dark:text-zinc-600">· 达成 {hoveredDay.completed}</span>
				{/if}
				{#if hoveredDay.created > 0}
					<span class="text-zinc-300 dark:text-zinc-600">· 新建 {hoveredDay.created}</span>
				{/if}
			</div>
		</div>
	{/if}
</div>
