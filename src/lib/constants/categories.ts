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
}

export const CATEGORIES: CategoryConfig[] = [
	{
		id: 'study',
		name: '学习',
		color: '#3B82F6',
		bgClass: 'bg-blue-50 dark:bg-blue-950/40',
		textClass: 'text-blue-700 dark:text-blue-300',
		borderClass: 'border-blue-200 dark:border-blue-800/60',
		dotClass: 'bg-blue-500',
		icon: 'lucide:book-open'
	},
	{
		id: 'fitness',
		name: '健身',
		color: '#22C55E',
		bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
		textClass: 'text-emerald-700 dark:text-emerald-300',
		borderClass: 'border-emerald-200 dark:border-emerald-800/60',
		dotClass: 'bg-emerald-500',
		icon: 'lucide:activity'
	},
	{
		id: 'finance',
		name: '理财',
		color: '#F59E0B',
		bgClass: 'bg-amber-50 dark:bg-amber-950/40',
		textClass: 'text-amber-700 dark:text-amber-300',
		borderClass: 'border-amber-200 dark:border-amber-800/60',
		dotClass: 'bg-amber-500',
		icon: 'lucide:wallet'
	},
	{
		id: 'dev',
		name: '开发',
		color: '#8B5CF6',
		bgClass: 'bg-purple-50 dark:bg-purple-950/40',
		textClass: 'text-purple-700 dark:text-purple-300',
		borderClass: 'border-purple-200 dark:border-purple-800/60',
		dotClass: 'bg-purple-500',
		icon: 'lucide:code-2'
	},
	{
		id: 'life',
		name: '生活',
		color: '#EC4899',
		bgClass: 'bg-pink-50 dark:bg-pink-950/40',
		textClass: 'text-pink-700 dark:text-pink-300',
		borderClass: 'border-pink-200 dark:border-pink-800/60',
		dotClass: 'bg-pink-500',
		icon: 'lucide:sparkles'
	},
	{
		id: 'other',
		name: '其他',
		color: '#6B7280',
		bgClass: 'bg-zinc-100 dark:bg-zinc-800/60',
		textClass: 'text-zinc-700 dark:text-zinc-300',
		borderClass: 'border-zinc-200 dark:border-zinc-700',
		dotClass: 'bg-zinc-500',
		icon: 'lucide:tag'
	}
];

export const CATEGORY_MAP = new Map<string, CategoryConfig>(
	CATEGORIES.map((cat) => [cat.id, cat])
);

export function getCategoryConfig(id: string | null | undefined): CategoryConfig | undefined {
	if (!id) return undefined;
	return CATEGORY_MAP.get(id);
}
