import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as todoService from '$lib/server/services/todo.service';
import { handleError, AppError } from '$lib/server/errors';

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const topicHash = params.hash;
		if (!topicHash) {
			throw new AppError('VALIDATION_ERROR', 'Topic hash is required');
		}

		const currentUserId = url.searchParams.get('currentUserId') ?? undefined;
		const date = url.searchParams.get('date') ?? undefined;
		const topic = await todoService.getTopicByHash(db, topicHash, currentUserId, date);

		return json({ topic });
	} catch (e) {
		return handleError(e);
	}
};
