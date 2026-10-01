import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { todos } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import * as todoService from '$lib/server/services/todo.service';
import * as userService from '$lib/server/services/user.service';
import * as recurrenceService from '$lib/server/services/recurrence.service';
import { handleError, AppError } from '$lib/server/errors';
import {
	validateContent,
	validateNote,
	validateCategory,
	validateOptionalDateTime,
	validateBoolean,
	validateStatus,
	validateLimit
} from '$lib/server/validation';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		let body;
		try {
			body = await request.json();
		} catch {
			throw new AppError('VALIDATION_ERROR', 'Invalid JSON body');
		}

		if (!locals?.user?.id) {
			throw new AppError('FORBIDDEN', 'Authentication required to create a todo');
		}

		const user = await userService.findById(db, locals.user.id);
		if (!user) {
			throw new AppError('NOT_FOUND', 'User not found');
		}

		const content = validateContent(body.content);
		const note = validateNote(body.note);
		const isNotePublic = validateBoolean(body.isNotePublic, true);
		const category = validateCategory(body.category);

		const author = {
			id: user.id,
			nickname: user.nickname,
			handle: user.handle,
			avatar: user.avatar,
			email: user.email
		};

		// 周期性任务立项分支
		if (body.isRecurring) {
			const rule = await recurrenceService.createRule(db, {
				authorId: user.id,
				content,
				note,
				isNotePublic,
				category,
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

			const [todayTodo] = await db
				.select()
				.from(todos)
				.where(eq(todos.recurringRuleId, rule.id))
				.orderBy(desc(todos.createdAt))
				.limit(1);

			const todo = {
				...(todayTodo || {}),
				author,
				recurringRule: {
					id: rule.id,
					frequency: rule.frequency,
					interval: rule.interval,
					daysOfWeek: rule.daysOfWeek,
					dayOfMonth: rule.dayOfMonth,
					cronExpression: rule.cronExpression,
					endCondition: rule.endCondition,
					endAfterOccurrences: rule.endAfterOccurrences,
					endDate: rule.endDate instanceof Date ? rule.endDate.toISOString() : (rule.endDate ? String(rule.endDate) : null),
					currentStreak: rule.currentStreak,
					maxStreak: rule.maxStreak,
					status: rule.status
				},
				reactions: { '❤️': 0, '👍': 0, '🔥': 0, '💪': 0, '👏': 0, '🚀': 0, '🎉': 0, '👀': 0 },
				myReactions: []
			};

			return json({ todo, author: user, recurringRule: rule }, { status: 201 });
		}

		const startDate = validateOptionalDateTime(body.startDate) ?? undefined;
		const dueDate = validateOptionalDateTime(body.dueDate);

		const rawTodo = await todoService.create(db, {
			content,
			note,
			isNotePublic,
			category,
			authorId: user.id,
			startDate,
			dueDate
		});

		const todo = {
			...rawTodo,
			author,
			reactions: { '❤️': 0, '👍': 0, '🔥': 0, '💪': 0, '👏': 0, '🚀': 0, '🎉': 0, '👀': 0 },
			myReactions: []
		};

		return json({ todo, author: user }, { status: 201 });
	} catch (e) {
		return handleError(e);
	}
};

export const GET: RequestHandler = async ({ url }) => {
	try {
		const statusParam = url.searchParams.get('status');
		const categoryParam = url.searchParams.get('category');

		const status = statusParam ? validateStatus(statusParam) : undefined;
		const category = categoryParam ? (validateCategory(categoryParam) ?? undefined) : undefined;
		const authorId = url.searchParams.get('authorId') ?? undefined;
		const currentUserId = url.searchParams.get('currentUserId') ?? undefined;
		const cursor = url.searchParams.get('cursor') ?? undefined;
		const limit = validateLimit(url.searchParams.get('limit') ?? undefined);

		const startDateFrom = validateOptionalDateTime(url.searchParams.get('startDateFrom')) ?? undefined;
		const startDateTo = validateOptionalDateTime(url.searchParams.get('startDateTo')) ?? undefined;
		const dueDateFrom = validateOptionalDateTime(url.searchParams.get('dueDateFrom')) ?? undefined;
		const dueDateTo = validateOptionalDateTime(url.searchParams.get('dueDateTo')) ?? undefined;

		const result = await todoService.list(db, {
			status,
			category,
			authorId,
			currentUserId,
			cursor,
			limit,
			startDateFrom,
			startDateTo,
			dueDateFrom,
			dueDateTo
		});

		return json(result);
	} catch (e) {
		return handleError(e);
	}
};
