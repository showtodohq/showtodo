import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as todoService from '$lib/server/services/todo.service';
import * as userService from '$lib/server/services/user.service';
import { handleError, AppError } from '$lib/server/errors';
import {
	validateEmail,
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

		const content = validateContent(body.content);
		const note = validateNote(body.note);
		const isNotePublic = validateBoolean(body.isNotePublic, true);
		const category = validateCategory(body.category);
		const startDate = validateOptionalDateTime(body.startDate) ?? undefined;
		const dueDate = validateOptionalDateTime(body.dueDate);

		let user: any = null;
		if (locals?.user?.id) {
			user = await userService.findById(db, locals.user.id);
		}
		if (!user && body.email) {
			const email = validateEmail(body.email);
			user = await userService.findOrCreate(db, email);
		}

		if (!user) {
			throw new AppError('FORBIDDEN', 'Authentication required to create a todo');
		}

		const rawTodo = await todoService.create(db, {
			content,
			note,
			isNotePublic,
			category,
			authorId: user.id,
			startDate,
			dueDate
		});

		const author = {
			id: user.id,
			nickname: user.nickname,
			handle: user.handle,
			avatar: user.avatar,
			email: user.email
		};

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
