/**
 * 日历领域常量类 (Calendar Domain Constants)
 * 统一收敛日历视图中的尺寸、状态角标样式及显示规则，杜绝各业务层硬编码
 */

export const CALENDAR_BADGE_STYLE = {
	/** 全部完成时的样式：柔和的低饱和绿色/中性灰，传达无负荷感 */
	ALL_DONE: {
		className:
			'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-semibold',
		labelSuffix: 'all completed'
	},
	/** 含有未完成待办时的样式：高反差醒目色，强调注意力 */
	HAS_PENDING: {
		className:
			'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-2xs',
		labelSuffix: 'pending tasks'
	}
} as const;

export const CALENDAR_LAYOUT = {
	/** 单元格响应式高度与内边距 (移动端紧凑高信噪比，桌面端保持舒适卡片展开) */
	CELL_CONTAINER_CLASS:
		'min-h-[56px] sm:min-h-[116px] p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl flex flex-col text-left transition-all cursor-pointer relative group',
	/** 移动端格子高度与内边距 */
	MOBILE_CELL_CLASS: 'min-h-[56px] p-1.5 rounded-xl',
	/** 桌面端格子高度与内边距 */
	DESKTOP_CELL_CLASS: 'sm:min-h-[116px] sm:p-2.5 sm:rounded-2xl',
	/** 桌面端右上角数量角标 (移动端隐藏) */
	DESKTOP_TOP_COUNT_CLASS: 'hidden sm:inline-block text-[10px] font-mono text-zinc-400',
	/** 移动端居中容器：在移动端占据主体空间并居中对齐，桌面端隐藏 */
	MOBILE_CENTER_CONTAINER_CLASS: 'flex sm:hidden flex-1 items-center justify-center w-full py-0.5',
	/** 移动端居中放大的数量角标基础样式 */
	MOBILE_CENTER_BADGE_CLASS:
		'inline-flex items-center justify-center min-w-[24px] h-[24px] px-1.5 rounded-full text-xs font-mono font-bold leading-none shadow-2xs transition-transform',
	/** 桌面端详细条目列表容器 (移动端隐藏，避免小可视区域文字被挤压截断) */
	DESKTOP_TODO_LIST_CLASS: 'hidden sm:block space-y-1 flex-1 w-full overflow-hidden'
} as const;
