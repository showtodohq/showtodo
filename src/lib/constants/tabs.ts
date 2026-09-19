/**
 * 选项卡与视图切换领域常量类 (Tabs Domain Constants)
 * 统一收敛全站 Tab 选项枚举与配置，并复用既有领域常量，彻底杜绝重复定义与硬编码
 */

import { TODO_STATUSES, type TodoStatus } from './status';
export { TRENDING_SORT_OPTIONS, type TrendingSortBy } from './search';

export interface TabConfig<T extends string = string> {
	id: T;
	label: string;
	description?: string;
	iconName?: string;
}

/**
 * 个人待办清单视图模式
 */
export const TODOLIST_VIEW_MODES = {
	STREAM: 'stream',
	KANBAN: 'kanban',
	CALENDAR: 'calendar'
} as const;

export type TodoListViewMode = (typeof TODOLIST_VIEW_MODES)[keyof typeof TODOLIST_VIEW_MODES];

export const TODOLIST_VIEW_TABS: readonly TabConfig<TodoListViewMode>[] = [
	{ id: TODOLIST_VIEW_MODES.STREAM, label: 'Stream' },
	{ id: TODOLIST_VIEW_MODES.KANBAN, label: 'Kanban' },
	{ id: TODOLIST_VIEW_MODES.CALENDAR, label: 'Calendar' }
] as const;

/**
 * 待办列表状态过滤模式
 * 基于已有的 TODO_STATUSES 权威领域常量动态衍生，杜绝重复硬编码
 */
export const TODO_STATUS_FILTER_ALL = 'all' as const;
export type TodoStatusFilterMode = typeof TODO_STATUS_FILTER_ALL | TodoStatus;

export const TODO_STATUS_FILTER_TABS: readonly TabConfig<TodoStatusFilterMode>[] = [
	{ id: TODO_STATUS_FILTER_ALL, label: 'All' },
	...TODO_STATUSES.map((st) => ({
		id: st.id,
		label: st.label
	}))
] as const;

/**
 * 热门话题范围模式
 */
export const TRENDING_SCOPE_MODES = {
	ALL: 'all',
	TODAY: 'today',
	MINE: 'mine'
} as const;

export type TrendingScopeMode = (typeof TRENDING_SCOPE_MODES)[keyof typeof TRENDING_SCOPE_MODES];

export const TRENDING_SCOPE_TABS: readonly TabConfig<TrendingScopeMode>[] = [
	{ id: TRENDING_SCOPE_MODES.ALL, label: 'All' },
	{ id: TRENDING_SCOPE_MODES.TODAY, label: 'Today' },
	{ id: TRENDING_SCOPE_MODES.MINE, label: 'Mine' }
] as const;

/**
 * 主题切换模式
 */
export const THEME_MODES = {
	LIGHT: 'light',
	DARK: 'dark',
	SYSTEM: 'system'
} as const;

export type ThemeMode = (typeof THEME_MODES)[keyof typeof THEME_MODES];

export const THEME_MODE_TABS: readonly TabConfig<ThemeMode>[] = [
	{ id: THEME_MODES.LIGHT, label: 'Light' },
	{ id: THEME_MODES.DARK, label: 'Dark' },
	{ id: THEME_MODES.SYSTEM, label: 'System' }
] as const;

/**
 * 话题详情参与者列表范围模式
 */
export const TOPIC_PARTICIPANT_MODES = {
	TODAY: 'today',
	ALL: 'all'
} as const;

export type TopicParticipantMode = (typeof TOPIC_PARTICIPANT_MODES)[keyof typeof TOPIC_PARTICIPANT_MODES];

export const TOPIC_PARTICIPANT_TABS: readonly TabConfig<TopicParticipantMode>[] = [
	{ id: TOPIC_PARTICIPANT_MODES.TODAY, label: 'Today' },
	{ id: TOPIC_PARTICIPANT_MODES.ALL, label: 'All' }
] as const;
