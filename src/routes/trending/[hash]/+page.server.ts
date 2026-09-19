import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as todoService from '$lib/server/services/todo.service';

export const load: PageServerLoad = async ({ params, url }) => {
	const topicHash = params.hash;
	const date = url.searchParams.get('date') ?? undefined;

	try {
		const topic = await todoService.getTopicByHash(db, topicHash, undefined, date);
		return {
			topic
		};
	} catch (e: any) {
		if (e?.code === 'NOT_FOUND') {
			throw error(404, 'Topic not found');
		}
		throw e;
	}
};
