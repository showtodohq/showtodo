import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as recurrenceService from '$lib/server/services/recurrence.service';
import { handleError, AppError } from '$lib/server/errors';
import type { RecurrenceStatus } from '$lib/constants/recurrence';

export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		if (!locals?.user?.id) {
			throw new AppError('FORBIDDEN', 'Authentication required');
		}

		const rule = await recurrenceService.findById(db, params.id);
		if (!rule) {
			throw new AppError('NOT_FOUND', 'Recurring rule not found');
		}

		if (rule.authorId !== locals.user.id) {
			throw new AppError('FORBIDDEN', 'You do not own this recurring rule');
		}

		return json({ rule });
	} catch (e) {
		return handleError(e);
	}
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	try {
		if (!locals?.user?.id) {
			throw new AppError('FORBIDDEN', 'Authentication required');
		}

		let body;
		try {
			body = await request.json();
		} catch {
			throw new AppError('VALIDATION_ERROR', 'Invalid JSON body');
		}

		if (!body.status) {
			throw new AppError('VALIDATION_ERROR', 'status is required');
		}

		const updated = await recurrenceService.updateStatus(
			db,
			params.id,
			locals.user.id,
			body.status as RecurrenceStatus
		);

		return json({ rule: updated });
	} catch (e) {
		return handleError(e);
	}
};

export const DELETE: RequestHandler = async ({ params, url, locals }) => {
	try {
		if (!locals?.user?.id) {
			throw new AppError('FORBIDDEN', 'Authentication required');
		}

		const deleteHistory = url.searchParams.get('deleteHistory') === 'true';
		const result = await recurrenceService.deleteRule(
			db,
			params.id,
			locals.user.id,
			{ deleteHistory }
		);

		return json(result);
	} catch (e) {
		return handleError(e);
	}
};
