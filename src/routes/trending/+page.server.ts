import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as todoService from '$lib/server/services/todo.service';
import { validateCategory } from '$lib/server/validation';

export const load: PageServerLoad = async ({ url }) => {
	const categoryParam = url.searchParams.get('category');
	const category = categoryParam && categoryParam !== 'all' ? (validateCategory(categoryParam) ?? undefined) : undefined;
	const scopeParam = url.searchParams.get('scope');
	const scope = scopeParam === 'mine' ? 'mine' : 'all';
	const sortByParam = url.searchParams.get('sort') || url.searchParams.get('sortBy');
	const sortBy = sortByParam === 'recent' || sortByParam === 'completion' ? sortByParam : 'participants';
	const timeRangeParam = url.searchParams.get('tab') || url.searchParams.get('timeRange');
	const timeRange = timeRangeParam === 'today' ? 'today' : 'all';
	const search = url.searchParams.get('q') || url.searchParams.get('search') || undefined;
	const minParticipantsParam = url.searchParams.get('min') || url.searchParams.get('minParticipants');
	const minParticipants = minParticipantsParam ? Math.max(parseInt(minParticipantsParam, 10) || 1, 1) : 1;

	const result = await todoService.listTopics(db, {
		category,
		scope,
		sortBy,
		timeRange,
		search: search ? search.trim().slice(0, 100) : undefined,
		minParticipants,
		limit: 15,
		offset: 0
	});

	return {
		topics: result.topics,
		total: result.total
	};
};
