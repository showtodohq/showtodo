import type { ReactionEmoji } from '$lib/types/todo';

export interface ReactionConfig {
	emoji: ReactionEmoji;
	label: string;
	description: string;
	activeClass: string;
}

export const REACTIONS: ReactionConfig[] = [
	{
		emoji: '❤️',
		label: '爱心',
		description: '真心喜欢与支持',
		activeClass: 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/50 dark:border-rose-700'
	},
	{
		emoji: '👍',
		label: '点赞',
		description: '非常赞同与认可',
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
	},
	{
		emoji: '🚀',
		label: '起飞',
		description: '神速推进，直接起飞',
		activeClass: 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/50 dark:border-indigo-700'
	},
	{
		emoji: '🎉',
		label: '庆祝',
		description: '太棒了，值得庆祝',
		activeClass: 'bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-950/50 dark:border-yellow-700'
	},
	{
		emoji: '👀',
		label: '围观',
		description: '正在围观关注这个目标',
		activeClass: 'bg-zinc-100 border-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700'
	}
];
