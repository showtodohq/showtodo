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
		label: '足迹',
		actionLabel: '累计足迹',
		unit: '次',
		description: '全量行动足迹总数'
	},
	created: {
		label: '新建',
		actionLabel: '新建待办',
		unit: '次',
		description: '创建并发布新待办'
	},
	completed: {
		label: '完成',
		actionLabel: '标记完成',
		unit: '次',
		description: '将待办流转标记为已完成'
	},
	notes: {
		label: '进展',
		actionLabel: '进展打卡',
		unit: '次',
		description: '记录待办推进过程的进度笔记'
	}
} as const;
