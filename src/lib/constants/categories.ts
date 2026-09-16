import type { CategoryId } from '$lib/types/todo';

export interface CategoryConfig {
	id: CategoryId;
	name: string;
	color: string;
	bgClass: string;
	textClass: string;
	borderClass: string;
	dotClass: string;
	icon: string;
	pillClass: string;
}

export const CATEGORIES: CategoryConfig[] = [
	{
		id: 'study',
		name: 'Study',
		color: '#3B82F6',
		bgClass: 'bg-blue-50 dark:bg-blue-950/40',
		textClass: 'text-blue-700 dark:text-blue-300',
		borderClass: 'border-blue-200 dark:border-blue-800/60',
		dotClass: 'bg-blue-500',
		icon: 'lucide:book-open',
		pillClass: 'bg-blue-50/90 hover:bg-blue-100/80 text-blue-900 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 dark:text-blue-200 border-blue-200/80 dark:border-blue-800/60'
	},
	{
		id: 'fitness',
		name: 'Fitness',
		color: '#22C55E',
		bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
		textClass: 'text-emerald-700 dark:text-emerald-300',
		borderClass: 'border-emerald-200 dark:border-emerald-800/60',
		dotClass: 'bg-emerald-500',
		icon: 'lucide:activity',
		pillClass: 'bg-emerald-50/90 hover:bg-emerald-100/80 text-emerald-900 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:text-emerald-200 border-emerald-200/80 dark:border-emerald-800/60'
	},
	{
		id: 'finance',
		name: 'Finance',
		color: '#F59E0B',
		bgClass: 'bg-amber-50 dark:bg-amber-950/40',
		textClass: 'text-amber-700 dark:text-amber-300',
		borderClass: 'border-amber-200 dark:border-amber-800/60',
		dotClass: 'bg-amber-500',
		icon: 'lucide:wallet',
		pillClass: 'bg-amber-50/90 hover:bg-amber-100/80 text-amber-900 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-200 border-amber-200/80 dark:border-amber-800/60'
	},
	{
		id: 'dev',
		name: 'Dev',
		color: '#8B5CF6',
		bgClass: 'bg-purple-50 dark:bg-purple-950/40',
		textClass: 'text-purple-700 dark:text-purple-300',
		borderClass: 'border-purple-200 dark:border-purple-800/60',
		dotClass: 'bg-purple-500',
		icon: 'lucide:code-2',
		pillClass: 'bg-purple-50/90 hover:bg-purple-100/80 text-purple-900 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 dark:text-purple-200 border-purple-200/80 dark:border-purple-800/60'
	},
	{
		id: 'life',
		name: 'Life',
		color: '#EC4899',
		bgClass: 'bg-pink-50 dark:bg-pink-950/40',
		textClass: 'text-pink-700 dark:text-pink-300',
		borderClass: 'border-pink-200 dark:border-pink-800/60',
		dotClass: 'bg-pink-500',
		icon: 'lucide:sparkles',
		pillClass: 'bg-pink-50/90 hover:bg-pink-100/80 text-pink-900 dark:bg-pink-950/40 dark:hover:bg-pink-900/50 dark:text-pink-200 border-pink-200/80 dark:border-pink-800/60'
	},
	{
		id: 'other',
		name: 'Other',
		color: '#6B7280',
		bgClass: 'bg-zinc-100 dark:bg-zinc-800/60',
		textClass: 'text-zinc-700 dark:text-zinc-300',
		borderClass: 'border-zinc-200 dark:border-zinc-700',
		dotClass: 'bg-zinc-500',
		icon: 'lucide:tag',
		pillClass: 'bg-zinc-100/90 hover:bg-zinc-200/80 text-zinc-800 dark:bg-zinc-800/60 dark:hover:bg-zinc-700/60 dark:text-zinc-200 border-zinc-200/80 dark:border-zinc-700'
	}
];

export const CATEGORY_MAP = new Map<string, CategoryConfig>(
	CATEGORIES.map((cat) => [cat.id, cat])
);

export function getCategoryConfig(id: string | null | undefined): CategoryConfig | undefined {
	if (!id) return undefined;
	return CATEGORY_MAP.get(id);
}
