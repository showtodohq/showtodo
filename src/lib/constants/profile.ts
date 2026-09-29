/**
 * Profile page action buttons and view constants
 */
export const PROFILE_ACTIONS = {
	TODOLIST: {
		LABEL: 'Todo List',
		TITLE: 'View Todo List (Kanban & Calendar)',
		ICON: 'lucide:check-square'
	},
	EDIT: {
		LABEL: 'Edit Profile',
		SHORT_LABEL: 'Edit',
		TITLE: 'Edit Profile',
		ICON: 'lucide:pencil'
	}
} as const;

/**
 * Shared action button styling (Single Source of Truth)
 * Aligns profile action buttons and settings page action buttons with consistent visual language:
 * Secondary variant, soft transparent background, micro-interaction scale, group hover effects.
 */
export const PROFILE_ACTION_BUTTON_CLASS =
	'text-xs border-0 bg-zinc-100/70 hover:bg-zinc-200/70 active:bg-zinc-200 text-zinc-700 hover:text-zinc-900 dark:bg-zinc-800/50 dark:hover:bg-zinc-700/60 dark:text-zinc-300 dark:hover:text-zinc-100 shadow-none transition-all duration-200 ease-out active:scale-[0.98] group';

export const PROFILE_ACTION_ICON_CLASS =
	'h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 group-hover:scale-110';
