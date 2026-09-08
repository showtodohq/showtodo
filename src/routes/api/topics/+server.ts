import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as todoService from '$lib/server/services/todo.service';
import { handleError } from '$lib/server/errors';
import {
	validateDate,
	validateCategory,
	validateLimit
} from '$lib/server/validation';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const categoryParam = url.searchParams.get('category');
		const category = categoryParam && categoryParam !== 'all' ? (validateCategory(categoryParam) ?? undefined) : undefined;
		
		const scopeParam = url.searchParams.get('scope');
		const scope = scopeParam === 'mine' ? 'mine' : 'all';

		const sortByParam = url.searchParams.get('sortBy');
		const sortBy = sortByParam === 'recent' || sortByParam === 'completion' ? sortByParam : 'participants';

		const timeRangeParam = url.searchParams.get('timeRange');
		const timeRange = timeRangeParam === 'today' ? 'today' : 'all';

		const dateParam = url.searchParams.get('date');
		const targetDate = dateParam ? validateDate(dateParam) : undefined;

		const searchParam = url.searchParams.get('search');
		const search = searchParam ? searchParam.trim().slice(0, 100) : undefined;

		const minParticipantsParam = url.searchParams.get('minParticipants');
		const minParticipants = minParticipantsParam ? Math.max(parseInt(minParticipantsParam, 10) || 1, 1) : 1;

		const currentUserId = url.searchParams.get('currentUserId') ?? undefined;
		const limit = validateLimit(url.searchParams.get('limit') ?? undefined, 100, 20);
		const offsetParam = url.searchParams.get('offset');
		const offset = offsetParam ? Math.max(parseInt(offsetParam, 10) || 0, 0) : 0;

		const startDateFrom = url.searchParams.get('startDateFrom') || undefined;
		const startDateTo = url.searchParams.get('startDateTo') || undefined;

		const result = await todoService.listTopics(db, {
			category,
			scope,
			sortBy,
			timeRange,
			targetDate,
			search,
			minParticipants,
			currentUserId,
			limit,
			offset,
			startDateFrom,
			startDateTo
		});

		return json(result);
	} catch (e) {
		return handleError(e);
	}
};
