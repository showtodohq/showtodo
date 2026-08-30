import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as todoService from '$lib/server/services/todo.service';
import { handleError, AppError } from '$lib/server/errors';
import {
	validateEmail,
	validateContent,
	validateNote,
	validateCategory,
	validateOptionalDateTime,
	validateBoolean,
	validateStatus,
	validateActivityContent
} from '$lib/server/validation';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const todo = await todoService.findByIdOrShortId(db, params.id);
		if (!todo) throw new AppError('NOT_FOUND', 'Todo not found');

		return json({ todo });
	} catch (e) {
		return handleError(e);
	}
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		let body;
		try {
			body = await request.json();
		} catch {
			throw new AppError('VALIDATION_ERROR', 'Invalid JSON body');
		}

		const email = validateEmail(body.email);

		const data: Record<string, unknown> = {};
		if (body.content !== undefined) data.content = validateContent(body.content);
		if (body.note !== undefined) data.note = validateNote(body.note);
		if (body.isNotePublic !== undefined) data.isNotePublic = validateBoolean(body.isNotePublic, true);
		if (body.category !== undefined) data.category = validateCategory(body.category);
		if (body.status !== undefined) data.status = validateStatus(body.status);
		if (body.startDate !== undefined) data.startDate = validateOptionalDateTime(body.startDate);
		if (body.dueDate !== undefined) data.dueDate = validateOptionalDateTime(body.dueDate);
		if (body.activityNote !== undefined) data.activityNote = validateActivityContent(body.activityNote);

		const updated = await todoService.update(db, params.id, email, data);

		return json({ todo: updated });
	} catch (e) {
		return handleError(e);
	}
};
