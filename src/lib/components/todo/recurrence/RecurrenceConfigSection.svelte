<script lang="ts">
	import {
		ALL_RECURRENCE_FREQUENCIES,
		RECURRENCE_FREQUENCY_LABELS,
		DAYS_OF_WEEK_CONFIG,
		RECURRENCE_END_CONDITIONS,
		RECURRENCE_HELP_TEXTS,
		type RecurrenceFrequency,
		type RecurrenceEndCondition
	} from '$lib/constants/recurrence';
	import HelpTooltip from '$lib/components/ui/HelpTooltip.svelte';
	import { POPOVER_PLACEMENT } from '$lib/constants/popover';
	import Icon from '@iconify/svelte';

	interface Props {
		isRecurring: boolean;
		frequency: RecurrenceFrequency;
		interval: number;
		daysOfWeek: number[];
		dayOfMonth: number;
		endCondition: RecurrenceEndCondition;
		endAfterOccurrences?: number;
		endDate?: string;
	}

	let {
		isRecurring = $bindable(false),
		frequency = $bindable('daily'),
		interval = $bindable(1),
		daysOfWeek = $bindable([1, 2, 3, 4, 5]),
		dayOfMonth = $bindable(1),
		endCondition = $bindable('never'),
		endAfterOccurrences = $bindable(30),
		endDate = $bindable('')
	}: Props = $props();

	function toggleDayOfWeek(day: number) {
		if (daysOfWeek.includes(day)) {
			if (daysOfWeek.length > 1) {
				daysOfWeek = daysOfWeek.filter((d) => d !== day);
			}
		} else {
			daysOfWeek = [...daysOfWeek, day].sort((a, b) => a - b);
		}
	}
</script>

<div class="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-3 sm:p-3.5 space-y-3">
	<!-- 顶部开关 -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-1.5">
			<Icon icon="lucide:repeat" class="w-4 h-4 text-zinc-600 dark:text-zinc-300 shrink-0" />
			<span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Repeat (Recurring Habit)</span>
			<HelpTooltip
				title={RECURRENCE_HELP_TEXTS.INTERACTION_TITLE}
				placement={POPOVER_PLACEMENT.BOTTOM_START}
				ariaLabel="Learn how schedule and recurrence interact"
			>
				{#snippet content()}
					<ul class="list-disc list-inside space-y-1.5 pl-0.5 leading-relaxed text-[11px] text-zinc-600 dark:text-zinc-300">
						<li>
							<strong class="text-zinc-800 dark:text-zinc-200">Schedule:</strong> {RECURRENCE_HELP_TEXTS.SCHEDULE_EXPLANATION}
						</li>
						<li>
							<strong class="text-zinc-800 dark:text-zinc-200">End condition:</strong> {RECURRENCE_HELP_TEXTS.END_CONDITION_EXPLANATION}
						</li>
					</ul>
				{/snippet}
			</HelpTooltip>
		</div>
		<label class="relative inline-flex items-center cursor-pointer">
			<input
				type="checkbox"
				bind:checked={isRecurring}
				class="sr-only peer"
			/>
			<div class="w-9 h-5 bg-zinc-200 peer-focus:outline-hidden rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-zinc-900 dark:peer-checked:bg-zinc-100"></div>
		</label>
	</div>

	<!-- 展开的详细重复设置 -->
	{#if isRecurring}
		<div class="space-y-3 pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/80 text-xs">
			<!-- 频次选择 -->
			<div class="space-y-1.5">
				<span class="block font-medium text-zinc-600 dark:text-zinc-400">Frequency</span>
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
					{#each ALL_RECURRENCE_FREQUENCIES.filter((f) => f !== 'custom_cron') as freq}
						<button
							type="button"
							onclick={() => (frequency = freq)}
							class="px-2.5 py-1.5 rounded-lg border text-center transition-all cursor-pointer font-medium text-xs
								{frequency === freq
									? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-2xs font-semibold'
									: 'bg-white dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-700/80 hover:border-zinc-300'}"
						>
							{RECURRENCE_FREQUENCY_LABELS[freq]}
						</button>
					{/each}
				</div>
			</div>

			<!-- 每周重复时的星期选择器 -->
			{#if frequency === 'weekly'}
				<div class="space-y-1.5">
					<span class="block font-medium text-zinc-600 dark:text-zinc-400">Repeat on</span>
					<div class="flex items-center gap-1.5 flex-wrap">
						{#each DAYS_OF_WEEK_CONFIG as item}
							<button
								type="button"
								onclick={() => toggleDayOfWeek(item.day)}
								class="h-7 w-7 rounded-full text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer
									{daysOfWeek.includes(item.day)
										? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
										: 'bg-white dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'}"
								title={item.label}
							>
								{item.shortLabel}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 每月重复时的日期选择器 -->
			{#if frequency === 'monthly'}
				<div class="flex items-center gap-2">
					<label for="monthly-day-input" class="font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">Day</label>
					<input
						id="monthly-day-input"
						type="number"
						min="1"
						max="31"
						bind:value={dayOfMonth}
						class="w-14 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center font-mono text-xs"
					/>
					<span class="text-zinc-500 dark:text-zinc-400">of each month</span>
				</div>
			{/if}

			<!-- 结束条件 -->
			<div class="space-y-1.5 pt-1">
				<span class="block font-medium text-zinc-600 dark:text-zinc-400">End condition</span>
				<div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
					<label class="flex items-center gap-1.5 cursor-pointer">
						<input
							type="radio"
							name="endCondition"
							value="never"
							bind:group={endCondition}
							class="text-zinc-900 focus:ring-zinc-900"
						/>
						<span class="text-zinc-700 dark:text-zinc-300">Never</span>
					</label>
					<label class="flex items-center gap-1.5 cursor-pointer">
						<input
							type="radio"
							name="endCondition"
							value="by_count"
							bind:group={endCondition}
							class="text-zinc-900 focus:ring-zinc-900"
						/>
						<span class="text-zinc-700 dark:text-zinc-300">After</span>
						<input
							type="number"
							min="1"
							max="365"
							bind:value={endAfterOccurrences}
							disabled={endCondition !== 'by_count'}
							class="w-14 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center font-mono text-xs disabled:opacity-50"
						/>
						<span class="text-zinc-700 dark:text-zinc-300">occurrences</span>
					</label>
					<label class="flex items-center gap-1.5 cursor-pointer">
						<input
							type="radio"
							name="endCondition"
							value="by_date"
							bind:group={endCondition}
							class="text-zinc-900 focus:ring-zinc-900"
						/>
						<span class="text-zinc-700 dark:text-zinc-300">Until</span>
						<input
							type="date"
							bind:value={endDate}
							disabled={endCondition !== 'by_date'}
							class="px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-xs disabled:opacity-50"
						/>
					</label>
				</div>
			</div>
		</div>
	{/if}
</div>
