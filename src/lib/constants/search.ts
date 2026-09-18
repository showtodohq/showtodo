/**
 * 搜索业务领域常量表 (Search Domain Constants)
 * 统一收敛全站搜索相关的配置、键名与文本，彻底杜绝硬编码
 */

/** URL 搜索与筛选参数统一键名 */
export const SEARCH_URL_QUERY_PARAM = 'q' as const;
export const SEARCH_STATUS_QUERY_PARAM = 'status' as const;
export const SEARCH_CATEGORY_QUERY_PARAM = 'category' as const;
export const SEARCH_PEOPLE_QUERY_PARAM = 'min' as const;
export const SEARCH_SORT_QUERY_PARAM = 'sort' as const;

/** 默认输入防抖延时 (ms) */
export const SEARCH_DEFAULT_DEBOUNCE_MS = 300 as const;

/** 搜索框最大输入长度 */
export const SEARCH_MAX_INPUT_LENGTH = 100 as const;

/** 聚焦搜索框的全局/局部快捷键 */
export const SEARCH_FOCUS_SHORTCUT = '/' as const;

/** 退出搜索的快捷键 */
export const SEARCH_ESCAPE_KEY = 'Escape' as const;

/** 各业务场景的规范搜索框占位文本 */
export const SEARCH_PLACEHOLDERS = {
	TRENDING: 'Search trending todos...',
	WORKBENCH: 'Search todos, notes, or keywords...',
	PROFILE: 'Search this user\'s todos...',
	GLOBAL: 'Search todos, topics, or users...'
} as const;

export type SearchScene = keyof typeof SEARCH_PLACEHOLDERS;

/** Trending 排序选项常量表 */
export const TRENDING_SORT_OPTIONS = [
	{ id: 'participants', label: 'Most People' },
	{ id: 'recent', label: 'Recently Active' },
	{ id: 'completion', label: 'Completion Rate' }
] as const;

export type TrendingSortBy = (typeof TRENDING_SORT_OPTIONS)[number]['id'];
