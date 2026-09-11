import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as todoService from '$lib/server/services/todo.service';
import { handleError, AppError } from '$lib/server/errors';
import { resolveTimezone } from '$lib/server/utils/timezone';

export const GET: RequestHandler = async ({ params, url, request }) => {
	try {
		const topicHash = params.hash;
		if (!topicHash) {
			throw new AppError('VALIDATION_ERROR', 'Topic hash is required');
		}

		const currentUserId = url.searchParams.get('currentUserId') ?? undefined;
		const date = url.searchParams.get('date') ?? undefined;
		const startDateFrom = url.searchParams.get('startDateFrom') ?? undefined;
		const startDateTo = url.searchParams.get('startDateTo') ?? undefined;
		const tz = resolveTimezone(
			url.searchParams.get('tz'),
			request.headers.get('x-timezone')
		);

		const topic = await todoService.getTopicByHash(
			db,
			topicHash,
			currentUserId,
			date,
			startDateFrom,
			startDateTo,
			tz
		);

		return json({ topic });
	} catch (e) {
		return handleError(e);
	}
};
