import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as todoService from '$lib/server/services/todo.service';
import * as statsService from '$lib/server/services/stats.service';
import { validateCategory } from '$lib/server/validation';
import { getLocalDayAsUtcRange, getTodayString } from '$lib/utils/format';
import type { CategoryId, Todo, ReactionEmoji } from '$lib/types/todo';

export const load: PageServerLoad = async ({ url }) => {
	const categoryParam = url.searchParams.get('category');
	const category = categoryParam ? ((validateCategory(categoryParam) ?? null) as CategoryId | null) : null;

	const { startDateFrom, startDateTo } = getLocalDayAsUtcRange();

	const [feedResult, statsResult, trendingResult] = await Promise.all([
		todoService.list(db, {
			category: category ?? undefined,
			limit: 20
		}),
		statsService.getGlobalStats(db, 365),
		todoService.listDailyCards(db, {
			targetDate: getTodayString(),
			startDateFrom,
			startDateTo,
			limit: 10,
			sortBy: 'participants'
		})
	]);

	const trendingCards = (trendingResult.cards || [])
		.sort((a, b) => b.totalParticipants - a.totalParticipants)
		.slice(0, 5);

	const todos: Todo[] = feedResult.todos.map((todo) => ({
		...todo,
		startDate: todo.startDate instanceof Date ? todo.startDate.toISOString() : String(todo.startDate),
		dueDate: todo.dueDate instanceof Date ? todo.dueDate.toISOString() : (todo.dueDate ? String(todo.dueDate) : null),
		createdAt: todo.createdAt instanceof Date ? todo.createdAt.toISOString() : String(todo.createdAt),
		updatedAt: todo.updatedAt instanceof Date ? todo.updatedAt.toISOString() : String(todo.updatedAt),
		myReactions: (todo.myReactions || []) as ReactionEmoji[]
	}));

	return {
		feed: {
			todos,
			nextCursor: feedResult.nextCursor,
			category
		},
		stats: statsResult,
		trendingCards
	};
};
