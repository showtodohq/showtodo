/**
 * 待办动态打卡行为常量 (Activity Domain Constants)
 *
 * 遵循 DDD 原则，将全站用户在待办上发生的打卡行为（事件）统一收敛在此：
 * - 待办客体实体状态采用量词【项】（如 8 项已完成，见 status.ts）；
 * - 用户主体操作打卡采用量词【次】（如 完成打卡 10 次，累计打卡 25 次）。
 */

export interface ActivityDimensionConfig {
	label: string;
	actionLabel: string;
	unit: string;
	description: string;
}

export const ACTIVITY_CONFIG = {
	total: {
		label: 'Activities',
		actionLabel: 'Total Activities',
		unit: 'times',
		description: 'Total action footprint count'
	},
	created: {
		label: 'Created',
		actionLabel: 'Create Todo',
		unit: 'times',
		description: 'Create and post new todo'
	},
	completed: {
		label: 'Completed',
		actionLabel: 'Mark Completed',
		unit: 'times',
		description: 'Mark todo as completed'
	},
	notes: {
		label: 'Updates',
		actionLabel: 'Log Note',
		unit: 'times',
		description: 'Progress note recorded'
	}
} as const;
