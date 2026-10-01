import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as recurrenceService from '$lib/server/services/recurrence.service';
import * as userService from '$lib/server/services/user.service';
import { handleError, AppError } from '$lib/server/errors';
import type { RecurrenceStatus } from '$lib/constants/recurrence';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		if (!locals?.user?.id) {
			throw new AppError('FORBIDDEN', 'Authentication required to view recurring rules');
		}

		const statusParam = url.searchParams.get('status') as RecurrenceStatus | null;
		const rules = await recurrenceService.listByAuthor(
			db,
			locals.user.id,
			statusParam ?? undefined
		);

		return json({ rules });
	} catch (e) {
		return handleError(e);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals?.user?.id) {
			throw new AppError('FORBIDDEN', 'Authentication required to create a recurring rule');
		}

		let body;
		try {
			body = await request.json();
		} catch {
			throw new AppError('VALIDATION_ERROR', 'Invalid JSON body');
		}

		const user = await userService.findById(db, locals.user.id);
		if (!user) {
			throw new AppError('NOT_FOUND', 'User not found');
		}

		const rule = await recurrenceService.createRule(db, {
			authorId: user.id,
			content: body.content,
			note: body.note,
			isNotePublic: body.isNotePublic,
			category: body.category,
			startDate: body.startDate ? new Date(body.startDate).toISOString() : undefined,
			dueDate: body.dueDate ? new Date(body.dueDate).toISOString() : undefined,
			frequency: body.frequency,
			interval: body.interval,
			daysOfWeek: body.daysOfWeek,
			dayOfMonth: body.dayOfMonth,
			cronExpression: body.cronExpression,
			endCondition: body.endCondition,
			endAfterOccurrences: body.endAfterOccurrences,
			endDate: body.endDate,
			timezone: body.timezone
		});

		return json({ rule }, { status: 201 });
	} catch (e) {
		return handleError(e);
	}
};
