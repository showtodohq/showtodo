import type { TodoStatus } from '$lib/types/todo';

export interface StatusConfig {
	id: TodoStatus;
	label: string;
	description: string;
	bgClass: string;
	textClass: string;
	borderClass: string;
	dotClass: string;
	icon: string;
}

export const TODO_STATUSES: StatusConfig[] = [
	{
		id: 'pending',
		label: '待办',
		description: '已规划，尚未开始',
		bgClass: 'bg-zinc-100 dark:bg-zinc-800',
		textClass: 'text-zinc-700 dark:text-zinc-300',
		borderClass: 'border-zinc-200 dark:border-zinc-700',
		dotClass: 'bg-zinc-400',
		icon: 'lucide:circle-dashed'
	},
	{
		id: 'in_progress',
		label: '进行中',
		description: '正在积极推进中',
		bgClass: 'bg-blue-50 dark:bg-blue-950/40',
		textClass: 'text-blue-700 dark:text-blue-300',
		borderClass: 'border-blue-200 dark:border-blue-800/60',
		dotClass: 'bg-blue-500 animate-pulse',
		icon: 'lucide:timer'
	},
	{
		id: 'done',
		label: '已完成',
		description: '已达成目标',
		bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
		textClass: 'text-emerald-700 dark:text-emerald-300',
		borderClass: 'border-emerald-200 dark:border-emerald-800/60',
		dotClass: 'bg-emerald-500',
		icon: 'lucide:check-circle-2'
	},
	{
		id: 'abandoned',
		label: '已放弃',
		description: '目标已终止或取消',
		bgClass: 'bg-rose-50 dark:bg-rose-950/40',
		textClass: 'text-rose-700 dark:text-rose-300',
		borderClass: 'border-rose-200 dark:border-rose-800/60',
		dotClass: 'bg-rose-400',
		icon: 'lucide:x-circle'
	}
];

export const STATUS_MAP = new Map<TodoStatus, StatusConfig>(
	TODO_STATUSES.map((st) => [st.id, st])
);

export function getStatusConfig(status: TodoStatus | string): StatusConfig {
	return (
		STATUS_MAP.get(status as TodoStatus) || {
			id: 'pending',
			label: status,
			description: '',
			bgClass: 'bg-zinc-100',
			textClass: 'text-zinc-700',
			borderClass: 'border-zinc-200',
			dotClass: 'bg-zinc-400',
			icon: 'lucide:circle'
		}
	);
}

/**
 * 状态机合法流转规则表
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<TodoStatus, TodoStatus[]> = {
	pending: ['in_progress', 'done', 'abandoned'],
	in_progress: ['done', 'abandoned'],
	done: [],
	abandoned: []
};

export function canTransitionTo(current: TodoStatus, target: TodoStatus): boolean {
	if (current === target) return true;
	return ALLOWED_STATUS_TRANSITIONS[current]?.includes(target) ?? false;
}
