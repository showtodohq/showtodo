import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as reactionService from '$lib/server/services/reaction.service';
import { handleError, AppError } from '$lib/server/errors';
import { validateEmoji } from '$lib/server/validation';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const reactions = await reactionService.getByTodoId(db, params.id);
		return json({ reactions });
	} catch (e) {
		return handleError(e);
	}
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	try {
		if (!locals?.user?.id) {
			throw new AppError('FORBIDDEN', 'Authentication required to react to a todo');
		}

		let body;
		try {
			body = await request.json();
		} catch {
			throw new AppError('VALIDATION_ERROR', 'Invalid JSON body');
		}

		const emoji = validateEmoji(body.emoji);
		const reaction = await reactionService.add(db, params.id, locals.user.id, emoji);

		return json({ reaction }, { status: 201 });
	} catch (e) {
		return handleError(e);
	}
};

export const DELETE: RequestHandler = async ({ params, request, locals }) => {
	try {
		if (!locals?.user?.id) {
			throw new AppError('FORBIDDEN', 'Authentication required to remove reaction');
		}

		let body;
		try {
			body = await request.json();
		} catch {
			throw new AppError('VALIDATION_ERROR', 'Invalid JSON body');
		}

		const emoji = body.emoji ? validateEmoji(body.emoji) : undefined;
		await reactionService.remove(db, params.id, locals.user.id, emoji);

		return json({ success: true });
	} catch (e) {
		return handleError(e);
	}
};
