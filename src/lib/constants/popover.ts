/**
 * 全站 Popover 核心常量表 (Domain Constants)
 * 严格遵循 DDD 原则，杜绝全站散落硬编码
 */

export const POPOVER_PLACEMENT = {
	TOP: 'top',
	BOTTOM: 'bottom',
	LEFT: 'left',
	RIGHT: 'right',
	TOP_START: 'top-start',
	TOP_END: 'top-end',
	BOTTOM_START: 'bottom-start',
	BOTTOM_END: 'bottom-end'
} as const;

export type PopoverPlacement = (typeof POPOVER_PLACEMENT)[keyof typeof POPOVER_PLACEMENT];

export const POPOVER_TRIGGER = {
	CLICK: 'click',
	HOVER: 'hover',
	MANUAL: 'manual'
} as const;

export type PopoverTrigger = (typeof POPOVER_TRIGGER)[keyof typeof POPOVER_TRIGGER];

export const POPOVER_TIMING = {
	HOVER_OPEN_DELAY: 80,
	HOVER_CLOSE_DELAY: 220,
	TRANSITION_DURATION: 150
} as const;

export const POPOVER_COLLISION = {
	VIEWPORT_PADDING: 12,
	MIN_SPACE_FOR_TOP: 90,
	MIN_SPACE_FOR_BOTTOM: 90
} as const;

export const POPOVER_ROLE = {
	MENU: 'menu',
	DIALOG: 'dialog',
	TOOLTIP: 'tooltip'
} as const;

export type PopoverRole = (typeof POPOVER_ROLE)[keyof typeof POPOVER_ROLE];
