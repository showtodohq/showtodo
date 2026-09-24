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

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const currentUserId = url.searchParams.get('currentUserId') || undefined;
		const todo = await todoService.findByIdOrShortId(db, params.id, currentUserId);
		if (!todo) throw new AppError('NOT_FOUND', 'Todo not found');

		return json({ todo });
	} catch (e) {
		return handleError(e);
	}
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	try {
		let body;
		try {
			body = await request.json();
		} catch {
			throw new AppError('VALIDATION_ERROR', 'Invalid JSON body');
		}

		let authIdentifier: { userId?: string; email?: string } | undefined;
		if (locals?.user?.id) {
			authIdentifier = { userId: locals.user.id };
		} else if (body.email) {
			authIdentifier = { email: validateEmail(body.email) };
		}

		if (!authIdentifier) {
			throw new AppError('FORBIDDEN', 'Authentication required to update this todo');
		}

		const data: Record<string, unknown> = {};
		if (body.content !== undefined) data.content = validateContent(body.content);
		if (body.note !== undefined) data.note = validateNote(body.note);
		if (body.isNotePublic !== undefined) data.isNotePublic = validateBoolean(body.isNotePublic, true);
		if (body.category !== undefined) data.category = validateCategory(body.category);
		if (body.status !== undefined) data.status = validateStatus(body.status);
		if (body.startDate !== undefined) data.startDate = validateOptionalDateTime(body.startDate);
		if (body.dueDate !== undefined) data.dueDate = validateOptionalDateTime(body.dueDate);
		if (body.activityNote !== undefined) data.activityNote = validateActivityContent(body.activityNote);

		const updated = await todoService.update(db, params.id, authIdentifier, data);

		return json({ todo: updated });
	} catch (e) {
		return handleError(e);
	}
};

export const DELETE: RequestHandler = async ({ params, request, url, locals }) => {
	try {
		let authIdentifier: { userId?: string; email?: string } | undefined;

		if (locals?.user?.id) {
			authIdentifier = { userId: locals.user.id };
		} else {
			let email: string | undefined;
			try {
				const body = await request.json();
				if (body && typeof body === 'object' && 'email' in body) {
					email = body.email;
				}
			} catch {
				// request might not have a json body
			}

			if (!email) {
				email = url.searchParams.get('email') || undefined;
			}

			if (email) {
				authIdentifier = { email: validateEmail(email) };
			}
		}

		if (!authIdentifier) {
			throw new AppError('FORBIDDEN', 'Authentication required to delete this todo');
		}

		const result = await todoService.deleteTodo(db, params.id, authIdentifier);

		return json(result);
	} catch (e) {
		return handleError(e);
	}
};
