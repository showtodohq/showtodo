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
		label: 'Heart',
		description: 'Love and support',
		activeClass: 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/50 dark:border-rose-700'
	},
	{
		emoji: '👍',
		label: 'Like',
		description: 'Agree and endorse',
		activeClass: 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/50 dark:border-blue-700'
	},
	{
		emoji: '🔥',
		label: 'Fire',
		description: 'Keep pushing, root for you',
		activeClass: 'bg-orange-50 border-orange-300 text-orange-700 dark:bg-orange-950/50 dark:border-orange-700'
	},
	{
		emoji: '💪',
		label: 'Strong',
		description: 'Full of strength and resolve',
		activeClass: 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-700'
	},
	{
		emoji: '👏',
		label: 'Clap',
		description: 'Applause and cheers',
		activeClass: 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/50 dark:border-amber-700'
	},
	{
		emoji: '🚀',
		label: 'Rocket',
		description: 'Fast-track progress, blast off',
		activeClass: 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/50 dark:border-indigo-700'
	},
	{
		emoji: '🎉',
		label: 'Celebrate',
		description: 'Awesome, celebrate',
		activeClass: 'bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-950/50 dark:border-yellow-700'
	},
	{
		emoji: '👀',
		label: 'Watching',
		description: 'Following this goal',
		activeClass: 'bg-zinc-100 border-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700'
	}
];
