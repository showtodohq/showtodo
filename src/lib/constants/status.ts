/**
 * 待办状态领域常量类 (Todo Status Domain Constants)
 * 统一收敛系统待办状态标识，杜绝各业务层硬编码
 */
export const TODO_STATUS = {
	PENDING: 'pending',
	IN_PROGRESS: 'in_progress',
	DONE: 'done',
	ABANDONED: 'abandoned'
} as const;

export type TodoStatus = (typeof TODO_STATUS)[keyof typeof TODO_STATUS];
export type TodoStatusCode = TodoStatus;

/**
 * 全站合法的待办状态清单
 */
export const ALL_TODO_STATUSES: readonly TodoStatus[] = [
	TODO_STATUS.PENDING,
	TODO_STATUS.IN_PROGRESS,
	TODO_STATUS.DONE,
	TODO_STATUS.ABANDONED
] as const;

/**
 * 领域状态判断谓词 (Domain Status Predicates)
 */
export const isStatusDone = (status?: TodoStatus | string | null): boolean => status === TODO_STATUS.DONE;
export const isStatusInProgress = (status?: TodoStatus | string | null): boolean => status === TODO_STATUS.IN_PROGRESS;
export const isStatusPending = (status?: TodoStatus | string | null): boolean => status === TODO_STATUS.PENDING;
export const isStatusAbandoned = (status?: TodoStatus | string | null): boolean => status === TODO_STATUS.ABANDONED;
export const isStatusCompletedOrAbandoned = (status?: TodoStatus | string | null): boolean =>
	status === TODO_STATUS.DONE || status === TODO_STATUS.ABANDONED;

export interface StatusConfig {
	id: TodoStatus;
	label: string;
	actionLabel: string;
	shortActionLabel: string;
	description: string;
	bgClass: string;
	textClass: string;
	borderClass: string;
	actionColorClass: string;
	actionButtonClass: string;
	// 详情弹窗专用的状态按钮样式
	activeButtonClass: string;
	inactiveButtonClass: string;
}

/**
 * 统一状态图标尺寸规格表 (杜绝组件内硬编码)
 */
export const TODO_STATUS_ICON_SIZES = {
	xs: 'h-2.5 w-2.5',
	sm: 'h-3.5 w-3.5',
	md: 'h-4 w-4',
	lg: 'h-5 w-5'
} as const;

export type TodoStatusIconSize = keyof typeof TODO_STATUS_ICON_SIZES;

export const TODO_STATUSES: StatusConfig[] = [
	{
		id: TODO_STATUS.PENDING,
		label: 'Pending',
		actionLabel: 'Set to Pending',
		shortActionLabel: 'Pending',
		description: 'Planned, not started yet',
		bgClass: 'bg-zinc-100 dark:bg-zinc-800',
		textClass: 'text-zinc-700 dark:text-zinc-300',
		borderClass: 'border-zinc-200 dark:border-zinc-700',
		actionColorClass: 'text-zinc-400 dark:text-zinc-500',
		actionButtonClass:
			'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
		activeButtonClass:
			'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs font-semibold',
		inactiveButtonClass:
			'bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
	},
	{
		id: TODO_STATUS.IN_PROGRESS,
		label: 'In Progress',
		actionLabel: 'Start Working',
		shortActionLabel: 'In Progress',
		description: 'Actively in progress',
		bgClass: 'bg-blue-50 dark:bg-blue-950/40',
		textClass: 'text-blue-700 dark:text-blue-300',
		borderClass: 'border-blue-200 dark:border-blue-800/60',
		actionColorClass: 'text-blue-600 dark:text-blue-400',
		actionButtonClass:
			'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60',
		activeButtonClass: 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold',
		inactiveButtonClass:
			'bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
	},
	{
		id: TODO_STATUS.DONE,
		label: 'Completed',
		actionLabel: 'Mark Completed',
		shortActionLabel: 'Completed',
		description: 'Todo goal completed',
		bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
		textClass: 'text-emerald-700 dark:text-emerald-300',
		borderClass: 'border-emerald-200 dark:border-emerald-800/60',
		actionColorClass: 'text-emerald-600 dark:text-emerald-400',
		actionButtonClass:
			'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60',
		activeButtonClass: 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-semibold',
		inactiveButtonClass:
			'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
	},
	{
		id: TODO_STATUS.ABANDONED,
		label: 'Abandoned',
		actionLabel: 'Mark Abandoned',
		shortActionLabel: 'Abandoned',
		description: 'Goal abandoned or postponed',
		bgClass: 'bg-zinc-100 dark:bg-zinc-800/60',
		textClass: 'text-zinc-600 dark:text-zinc-400',
		borderClass: 'border-zinc-200 dark:border-zinc-700',
		actionColorClass: 'text-zinc-500 dark:text-zinc-400',
		actionButtonClass:
			'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700',
		activeButtonClass: 'bg-zinc-600 text-white border-zinc-600 shadow-xs font-semibold',
		inactiveButtonClass:
			'bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
	}
];

export const STATUS_MAP = new Map<TodoStatus, StatusConfig>(
	TODO_STATUSES.map((st) => [st.id, st])
);

export function getStatusConfig(status: TodoStatus | string): StatusConfig {
	return (
		STATUS_MAP.get(status as TodoStatus) || {
			id: TODO_STATUS.PENDING,
			label: status,
			actionLabel: status,
			shortActionLabel: status,
			description: '',
			bgClass: 'bg-zinc-100',
			textClass: 'text-zinc-700',
			borderClass: 'border-zinc-200',
			actionColorClass: 'text-zinc-400',
			actionButtonClass: 'bg-zinc-100 text-zinc-700',
			activeButtonClass: 'bg-zinc-900 text-white border-zinc-900',
			inactiveButtonClass: 'bg-zinc-50 text-zinc-700 border-zinc-200'
		}
	);
}

/**
 * 状态机合法流转规则表
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<TodoStatus, TodoStatus[]> = {
	[TODO_STATUS.PENDING]: [TODO_STATUS.IN_PROGRESS, TODO_STATUS.DONE, TODO_STATUS.ABANDONED],
	[TODO_STATUS.IN_PROGRESS]: [TODO_STATUS.PENDING, TODO_STATUS.DONE, TODO_STATUS.ABANDONED],
	[TODO_STATUS.DONE]: [TODO_STATUS.IN_PROGRESS, TODO_STATUS.PENDING, TODO_STATUS.ABANDONED],
	[TODO_STATUS.ABANDONED]: [TODO_STATUS.PENDING, TODO_STATUS.IN_PROGRESS, TODO_STATUS.DONE]
};

export function canTransitionTo(current: TodoStatus, target: TodoStatus): boolean {
	if (current === target) return true;
	return ALLOWED_STATUS_TRANSITIONS[current]?.includes(target) ?? false;
}

export function getAllowedNextStatuses(current: TodoStatus): StatusConfig[] {
	const allowedTargetIds = ALLOWED_STATUS_TRANSITIONS[current] || [];
	return allowedTargetIds
		.map((id) => STATUS_MAP.get(id))
		.filter((config): config is StatusConfig => Boolean(config));
}

export function getAllStatusesWithState(current: TodoStatus) {
	const allowedTargetIds = ALLOWED_STATUS_TRANSITIONS[current] || [];
	return TODO_STATUSES.map((config) => ({
		...config,
		isCurrent: config.id === current,
		isAllowed: config.id === current || allowedTargetIds.includes(config.id)
	}));
}
