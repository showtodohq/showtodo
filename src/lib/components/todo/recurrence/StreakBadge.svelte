<script lang="ts">
	import {
		RECURRENCE_FREQUENCY_LABELS,
		type RecurrenceFrequency
	} from '$lib/constants/recurrence';
	import Icon from '@iconify/svelte';

	interface Props {
		frequency?: RecurrenceFrequency | string | null;
		cycleIndex?: number | null;
		currentStreak?: number | null;
		maxStreak?: number | null;
		slotKey?: string | null;
		isVirtual?: boolean;
		size?: 'sm' | 'md';
	}

	let {
		frequency,
		cycleIndex,
		currentStreak = 0,
		maxStreak = 0,
		slotKey,
		isVirtual = false,
		size = 'sm'
	}: Props = $props();

	const label = $derived(
		frequency && frequency in RECURRENCE_FREQUENCY_LABELS
			? RECURRENCE_FREQUENCY_LABELS[frequency as RecurrenceFrequency]
			: 'Recurring'
	);

	const isSmall = $derived(size === 'sm');
</script>

{#if frequency || isVirtual}
	<div class="inline-flex items-center gap-1.5 flex-wrap">
		<!-- 周期标识标签 -->
		<span
			class="inline-flex items-center gap-1 rounded-md font-medium transition-colors
				{isVirtual
					? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-dashed border-purple-500/30'
					: 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/50'}
				{isSmall ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}"
			title={isVirtual ? 'Future planned occurrence' : `${label}${cycleIndex ? ` · #${cycleIndex}` : ''}`}
		>
			<Icon
				icon={isVirtual ? 'lucide:calendar-clock' : 'lucide:repeat'}
				class="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0"
			/>
			<span>{isVirtual ? 'Planned' : label}</span>
			{#if cycleIndex && !isVirtual}
				<span class="text-zinc-400 dark:text-zinc-500 font-mono text-[10px]">#{cycleIndex}</span>
			{/if}
		</span>

		<!-- 连胜勋章 -->
		{#if currentStreak && currentStreak > 0 && !isVirtual}
			<span
				class="inline-flex items-center gap-0.5 rounded-md font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse
					{isSmall ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}"
				title={`Current streak: ${currentStreak} (Best: ${maxStreak})`}
			>
				<span>🔥</span>
				<span class="font-mono">{currentStreak}</span>
				<span class="text-[10px]">streak</span>
			</span>
		{/if}
	</div>
{/if}
