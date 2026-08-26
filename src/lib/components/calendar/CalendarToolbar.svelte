<script lang="ts">
	import Icon from '@iconify/svelte';
	import { formatWeekRangeText, formatDateISO } from '$lib/utils/calendar';

	interface Props {
		weekDates: Date[];
		onPrevWeek?: () => void;
		onNextWeek?: () => void;
		onToday?: () => void;
		onSelectDate?: (date: Date) => void;
	}

	let { weekDates, onPrevWeek, onNextWeek, onToday, onSelectDate }: Props = $props();

	const weekRangeText = $derived(formatWeekRangeText(weekDates));
	const currentDateValue = $derived(weekDates[0] ? formatDateISO(weekDates[0]) : '');

	let dateInputRef = $state<HTMLInputElement | null>(null);

	function handleTriggerDatePicker() {
		if (dateInputRef) {
			if ('showPicker' in HTMLInputElement.prototype) {
				try {
					dateInputRef.showPicker();
				} catch {
					dateInputRef.focus();
				}
			} else {
				dateInputRef.focus();
			}
		}
	}

	function handleDateChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.value) {
			const [year, month, day] = target.value.split('-').map(Number);
			const selected = new Date(year, month - 1, day);
			onSelectDate?.(selected);
		}
	}
</script>

<div class="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 select-none">
	<!-- 隐藏的系统日期选择器输入框 -->
	<input
		bind:this={dateInputRef}
		type="date"
		value={currentDateValue}
		onchange={handleDateChange}
		class="sr-only"
		tabindex="-1"
		aria-hidden="true"
	/>

	<!-- 当前周日期区间指示器 (可点击快速挑选日期跳转周) -->
	<button
		type="button"
		onclick={handleTriggerDatePicker}
		title="点击快速选择任意日期跳转"
		class="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:border-blue-400 dark:hover:border-blue-600 text-zinc-800 dark:text-zinc-200 shadow-2xs text-xs sm:text-sm font-semibold transition-all cursor-pointer"
	>
		<Icon icon="lucide:calendar" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 group-hover:scale-110 transition-transform shrink-0" />
		<span class="tracking-tight whitespace-nowrap">{weekRangeText}</span>
		<Icon icon="lucide:chevron-down" class="w-3 h-3 text-zinc-400 group-hover:text-blue-500 transition-colors shrink-0" />
	</button>

	<!-- 紧凑分段导航按钮组 (Segmented Navigation Control) -->
	<div
		class="inline-flex items-center rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5 shadow-2xs text-zinc-700 dark:text-zinc-300 shrink-0"
	>
		<button
			type="button"
			onclick={onPrevWeek}
			aria-label="上一周"
			class="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
		>
			<Icon icon="lucide:chevron-left" class="w-4 h-4" />
		</button>

		<div class="h-3.5 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-0.5"></div>

		<button
			type="button"
			onclick={onToday}
			class="px-2.5 py-1 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
		>
			Today
		</button>

		<div class="h-3.5 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-0.5"></div>

		<button
			type="button"
			onclick={onNextWeek}
			aria-label="下一周"
			class="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
		>
			<Icon icon="lucide:chevron-right" class="w-4 h-4" />
		</button>
	</div>
</div>
