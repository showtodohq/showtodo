/**
 * 周期性待办领域常量与单一信源 (Recurrence Domain Constants & SSOT)
 * 统一收敛所有频次、状态、结束条件枚举及默认配置，杜绝各业务层硬编码
 */

// 1. 重复频次枚举
export const RECURRENCE_FREQUENCIES = {
	DAILY: 'daily',
	WEEKDAYS: 'weekdays',
	WEEKLY: 'weekly',
	MONTHLY: 'monthly',
	CUSTOM_CRON: 'custom_cron'
} as const;

export type RecurrenceFrequency =
	(typeof RECURRENCE_FREQUENCIES)[keyof typeof RECURRENCE_FREQUENCIES];

export const ALL_RECURRENCE_FREQUENCIES: readonly RecurrenceFrequency[] = [
	RECURRENCE_FREQUENCIES.DAILY,
	RECURRENCE_FREQUENCIES.WEEKDAYS,
	RECURRENCE_FREQUENCIES.WEEKLY,
	RECURRENCE_FREQUENCIES.MONTHLY,
	RECURRENCE_FREQUENCIES.CUSTOM_CRON
] as const;

// 2. 周期规则状态枚举
export const RECURRENCE_STATUSES = {
	ACTIVE: 'active',
	PAUSED: 'paused',
	DORMANT: 'dormant',
	COMPLETED: 'completed',
	ARCHIVED: 'archived'
} as const;

export type RecurrenceStatus =
	(typeof RECURRENCE_STATUSES)[keyof typeof RECURRENCE_STATUSES];

export const ALL_RECURRENCE_STATUSES: readonly RecurrenceStatus[] = [
	RECURRENCE_STATUSES.ACTIVE,
	RECURRENCE_STATUSES.PAUSED,
	RECURRENCE_STATUSES.DORMANT,
	RECURRENCE_STATUSES.COMPLETED,
	RECURRENCE_STATUSES.ARCHIVED
] as const;

// 3. 结束条件枚举
export const RECURRENCE_END_CONDITIONS = {
	NEVER: 'never',
	BY_COUNT: 'by_count',
	BY_DATE: 'by_date'
} as const;

export type RecurrenceEndCondition =
	(typeof RECURRENCE_END_CONDITIONS)[keyof typeof RECURRENCE_END_CONDITIONS];

export const ALL_RECURRENCE_END_CONDITIONS: readonly RecurrenceEndCondition[] = [
	RECURRENCE_END_CONDITIONS.NEVER,
	RECURRENCE_END_CONDITIONS.BY_COUNT,
	RECURRENCE_END_CONDITIONS.BY_DATE
] as const;

// 4. 业务阈值配置 (单一信源)
export const RECURRENCE_CONFIG = {
	/** 连续未完成触发冷休眠的缺席期数阈值 */
	CONSECUTIVE_MISSES_DORMANT_THRESHOLD: 7,
	/** 跨自然日打卡缓冲宽限期（小时） */
	GRACE_PERIOD_HOURS: 4,
	/** 长期未登录时允许追溯补齐的最大期数上限（防写雪崩） */
	MAX_CATCH_UP_CYCLES: 3,
	/** 默认间隔步长 */
	DEFAULT_INTERVAL: 1
} as const;

// 5. 频次与状态的人性化文案映射 (English UI Consistent)
export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
	[RECURRENCE_FREQUENCIES.DAILY]: 'Daily',
	[RECURRENCE_FREQUENCIES.WEEKDAYS]: 'Weekdays',
	[RECURRENCE_FREQUENCIES.WEEKLY]: 'Weekly',
	[RECURRENCE_FREQUENCIES.MONTHLY]: 'Monthly',
	[RECURRENCE_FREQUENCIES.CUSTOM_CRON]: 'Custom (Cron)'
};

export const RECURRENCE_STATUS_CONFIG: Record<
	RecurrenceStatus,
	{ label: string; badgeClass: string; description: string }
> = {
	[RECURRENCE_STATUSES.ACTIVE]: {
		label: 'Active',
		badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
		description: 'Rule is active and generating todos on schedule'
	},
	[RECURRENCE_STATUSES.PAUSED]: {
		label: 'Paused',
		badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
		description: 'Manually paused; generation paused and streak preserved'
	},
	[RECURRENCE_STATUSES.DORMANT]: {
		label: 'Dormant',
		badgeClass: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
		description: 'In cold sleep after consecutive misses; auto-reactivates upon activity'
	},
	[RECURRENCE_STATUSES.COMPLETED]: {
		label: 'Completed',
		badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
		description: 'Reached target occurrences or end date'
	},
	[RECURRENCE_STATUSES.ARCHIVED]: {
		label: 'Archived',
		badgeClass: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
		description: 'Archived and no longer in rotation'
	}
};

// 6. 星期几映射 (0=Sun, 1=Mon, ... 6=Sat)
export const DAYS_OF_WEEK_CONFIG = [
	{ day: 1, label: 'Monday', shortLabel: 'M' },
	{ day: 2, label: 'Tuesday', shortLabel: 'T' },
	{ day: 3, label: 'Wednesday', shortLabel: 'W' },
	{ day: 4, label: 'Thursday', shortLabel: 'T' },
	{ day: 5, label: 'Friday', shortLabel: 'F' },
	{ day: 6, label: 'Saturday', shortLabel: 'S' },
	{ day: 0, label: 'Sunday', shortLabel: 'S' }
] as const;

// 7. 领域谓词工具
export const isRecurrenceActive = (status?: RecurrenceStatus | string | null): boolean =>
	status === RECURRENCE_STATUSES.ACTIVE;
export const isRecurrencePaused = (status?: RecurrenceStatus | string | null): boolean =>
	status === RECURRENCE_STATUSES.PAUSED;
export const isRecurrenceDormant = (status?: RecurrenceStatus | string | null): boolean =>
	status === RECURRENCE_STATUSES.DORMANT;

// 8. 周期规则帮助与引导文案 (单一信源，用于 Tooltip 悬浮或点击说明)
export const RECURRENCE_HELP_TEXTS = {
	INTERACTION_TITLE: 'Schedule & Recurrence Interaction',
	SCHEDULE_EXPLANATION:
		"Schedule (Start & Due Date) sets each cycle's daily time window (e.g. 09:00 ~ 18:00). If start date is in the future, the rule starts on that date.",
	END_CONDITION_EXPLANATION:
		'End Condition limits the overall lifetime of the recurring series.',
	MATERIALIZED_TITLE: 'Recurring Habit Linked',
	MATERIALIZED_EXPLANATION: (frequency: string = 'daily') =>
		`Materialized from a ${frequency} recurring rule. Updating the recurrence rules below will apply to future scheduled occurrences of this habit.`
} as const;

