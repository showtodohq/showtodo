import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as reactionService from '$lib/server/services/reaction.service';
import * as userService from '$lib/server/services/user.service';
import { handleError, AppError } from '$lib/server/errors';
import { validateEmail, validateEmoji } from '$lib/server/validation';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const reactions = await reactionService.getByTodoId(db, params.id);
		return json({ reactions });
	} catch (e) {
		return handleError(e);
	}
};

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		let body;
		try {
			body = await request.json();
		} catch {
			throw new AppError('VALIDATION_ERROR', 'Invalid JSON body');
		}

		const email = validateEmail(body.email);
		const emoji = validateEmoji(body.emoji);

		const user = await userService.findOrCreate(db, email);
		const reaction = await reactionService.add(db, params.id, user.id, emoji);

		return json({ reaction }, { status: 201 });
	} catch (e) {
		return handleError(e);
	}
};

export const DELETE: RequestHandler = async ({ params, request }) => {
	try {
		let body;
		try {
			body = await request.json();
		} catch {
			throw new AppError('VALIDATION_ERROR', 'Invalid JSON body');
		}

		const email = validateEmail(body.email);
		const emoji = validateEmoji(body.emoji);

		const user = await userService.findByEmail(db, email);
		if (!user) throw new AppError('NOT_FOUND', 'User not found');

		await reactionService.remove(db, params.id, user.id, emoji);

		return json({ success: true });
	} catch (e) {
		return handleError(e);
	}
};
