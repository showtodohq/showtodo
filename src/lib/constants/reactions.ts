import type { ReactionEmoji } from '$lib/types/todo';

export interface ReactionConfig {
	emoji: ReactionEmoji;
	label: string;
	description: string;
	activeClass: string;
}

export const REACTIONS: ReactionConfig[] = [
	{
		emoji: '👀',
		label: '围观',
		description: '正在围观关注这个目标',
		activeClass: 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/50 dark:border-blue-700'
	},
	{
		emoji: '🔥',
		label: '冲',
		description: '加油冲，看好你',
		activeClass: 'bg-orange-50 border-orange-300 text-orange-700 dark:bg-orange-950/50 dark:border-orange-700'
	},
	{
		emoji: '💪',
		label: '给力',
		description: '充满力量与决心',
		activeClass: 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-700'
	},
	{
		emoji: '👏',
		label: '鼓掌',
		description: '为你鼓掌喝彩',
		activeClass: 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/50 dark:border-amber-700'
	}
];
