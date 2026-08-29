import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as todoService from '$lib/server/services/todo.service';
import { handleError } from '$lib/server/errors';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const topicInfo = await todoService.getTopicInfoByTodoId(db, params.id);
		return json(topicInfo);
	} catch (e) {
		return handleError(e);
	}
};
