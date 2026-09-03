import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as todoService from '$lib/server/services/todo.service';
import { handleError, AppError } from '$lib/server/errors';
import {
	validateDate,
	validateCategory,
	validateBoolean,
	validateLimit
} from '$lib/server/validation';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const dateParam = url.searchParams.get('date');
		if (!dateParam) {
			throw new AppError('VALIDATION_ERROR', 'date parameter is required');
		}

		const date = validateDate(dateParam);
		const categoryParam = url.searchParams.get('category');
		const category = categoryParam ? (validateCategory(categoryParam) ?? undefined) : undefined;
		const onlyMineParam = url.searchParams.get('onlyMine');
		const onlyMine = onlyMineParam !== null ? validateBoolean(onlyMineParam, false) : false;
		const currentUserId = url.searchParams.get('currentUserId') ?? undefined;
		const limit = validateLimit(url.searchParams.get('limit') ?? undefined);
		const offsetParam = url.searchParams.get('offset');
		const offset = offsetParam ? Math.max(parseInt(offsetParam, 10) || 0, 0) : 0;
		const sortByParam = url.searchParams.get('sortBy');
		const sortBy = sortByParam === 'participants' ? 'participants' : 'time';

		const result = await todoService.listDailyCards(db, {
			targetDate: date,
			category,
			onlyMine,
			currentUserId,
			limit,
			offset,
			sortBy
		});

		return json(result);
	} catch (e) {
		return handleError(e);
	}
};
