import { eq, desc, lt, and, inArray, gte, lte } from 'drizzle-orm';
import { todos, users } from '../db/schema';
import type { Database } from '../db';
import type { Category, TodoStatus } from '../validation';
import { validateStatusTransition, generateShortId, isUUID } from '../validation';
import * as reactionService from './reaction.service';
import { AppError } from '../errors';

export interface CreateTodoData {
	content: string;
	note?: string | null;
	isNotePublic?: boolean;
	category?: Category | null;
	authorId: string;
	startDate?: string;
	dueDate?: string | null;
}

export interface UpdateTodoData {
	content?: string;
	note?: string | null;
	isNotePublic?: boolean;
	category?: Category | null;
	status?: TodoStatus;
	startDate?: string;
	dueDate?: string | null;
}

export interface ListTodosFilters {
	status?: TodoStatus;
	category?: string;
	authorId?: string;
	cursor?: string;
	limit?: number;
}

function sanitizeNote(todo: typeof todos.$inferSelect) {
	if (!todo.isNotePublic) {
		return { ...todo, note: null };
	}
	return todo;
}

async function generateUniqueShortId(db: Database): Promise<string> {
	for (let i = 0; i < 10; i++) {
		const shortId = generateShortId(8);
		const existing = await db.select().from(todos).where(eq(todos.shortId, shortId)).limit(1);
		if (!existing[0]) {
			return shortId;
		}
	}
	return `${generateShortId(6)}${Date.now().toString(36).slice(-2)}`;
}

export async function create(db: Database, data: CreateTodoData) {
	const shortId = await generateUniqueShortId(db);

	const values: Record<string, unknown> = {
		shortId,
		content: data.content,
		note: data.note ?? null,
		isNotePublic: data.isNotePublic ?? true,
		category: data.category ?? null,
		authorId: data.authorId,
		dueDate: data.dueDate ?? null
	};
	if (data.startDate !== undefined) {
		values.startDate = data.startDate;
	}

	const result = await db
		.insert(todos)
		.values(values as typeof todos.$inferInsert)
		.returning();

	await db
		.update(users)
		.set({ lastTodoUpdatedAt: new Date() })
		.where(eq(users.id, data.authorId));

	return result[0];
}

export async function findById(db: Database, id: string) {
	return findByIdOrShortId(db, id);
}

export async function findByIdOrShortId(db: Database, identifier: string) {
	if (!identifier) return null;

	const condition = isUUID(identifier)
		? eq(todos.id, identifier)
		: eq(todos.shortId, identifier);

	const result = await db
		.select()
		.from(todos)
		.innerJoin(users, eq(todos.authorId, users.id))
		.where(condition)
		.limit(1);

	if (!result[0]) return null;

	const { todos: todo, users: author } = result[0];
	const reactionCounts = await reactionService.getCountsByTodoIds(db, [todo.id]);

	return {
		...sanitizeNote(todo),
		author: { id: author.id, nickname: author.nickname, handle: author.handle, avatar: author.avatar },
		reactions: reactionCounts[todo.id] ?? { '👀': 0, '🔥': 0, '💪': 0, '👏': 0 }
	};
}

export async function list(db: Database, filters: ListTodosFilters) {
	const limit = filters.limit ?? 20;
	const conditions = [];

	if (filters.status) {
		conditions.push(eq(todos.status, filters.status));
	}
	if (filters.category) {
		conditions.push(eq(todos.category, filters.category));
	}
	if (filters.authorId && isUUID(filters.authorId)) {
		conditions.push(eq(todos.authorId, filters.authorId));
	}
	if (filters.cursor && isUUID(filters.cursor)) {
		const cursorTodo = await db
			.select({ createdAt: todos.createdAt })
			.from(todos)
			.where(eq(todos.id, filters.cursor))
			.limit(1);
		if (cursorTodo[0]) {
			conditions.push(lt(todos.createdAt, cursorTodo[0].createdAt));
		}
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const result = await db
		.select()
		.from(todos)
		.innerJoin(users, eq(todos.authorId, users.id))
		.where(where)
		.orderBy(desc(todos.createdAt))
		.limit(limit + 1);

	const hasMore = result.length > limit;
	const items = hasMore ? result.slice(0, limit) : result;

	const todoIds = items.map((r) => r.todos.id);
	const allReactionCounts =
		todoIds.length > 0 ? await reactionService.getCountsByTodoIds(db, todoIds) : {};

	const todoList = items.map(({ todos: todo, users: author }) => ({
		...sanitizeNote(todo),
		author: { id: author.id, nickname: author.nickname, handle: author.handle, avatar: author.avatar },
		reactions: allReactionCounts[todo.id] ?? { '👀': 0, '🔥': 0, '💪': 0, '👏': 0 }
	}));

	return {
		todos: todoList,
		nextCursor: hasMore ? items[items.length - 1].todos.id : null
	};
}

export async function update(db: Database, idOrShortId: string, authorEmail: string, data: UpdateTodoData) {
	const condition = isUUID(idOrShortId)
		? eq(todos.id, idOrShortId)
		: eq(todos.shortId, idOrShortId);

	const existing = await db
		.select()
		.from(todos)
		.innerJoin(users, eq(todos.authorId, users.id))
		.where(condition)
		.limit(1);

	if (!existing[0]) throw new AppError('NOT_FOUND', 'Todo not found');

	const { todos: todo, users: author } = existing[0];
	if (author.email.toLowerCase() !== authorEmail.toLowerCase()) {
		throw new AppError('FORBIDDEN', 'Only the author can update this todo');
	}

	if (data.status && data.status !== todo.status) {
		validateStatusTransition(todo.status as TodoStatus, data.status);
	}

	const updateData: Record<string, unknown> = {};
	if (data.content !== undefined) updateData.content = data.content;
	if (data.note !== undefined) updateData.note = data.note;
	if (data.isNotePublic !== undefined) updateData.isNotePublic = data.isNotePublic;
	if (data.category !== undefined) updateData.category = data.category;
	if (data.status !== undefined) updateData.status = data.status;
	if (data.startDate !== undefined) updateData.startDate = data.startDate;
	if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;

	const result = await db.update(todos).set(updateData).where(eq(todos.id, todo.id)).returning();

	await db
		.update(users)
		.set({ lastTodoUpdatedAt: new Date() })
		.where(eq(users.id, todo.authorId));

	return result[0];
}

export async function listForCalendar(
	db: Database,
	options: {
		authorIds: string[];
		startDateFrom: string;
		startDateTo: string;
		category?: string;
	}
) {
	if (!options.authorIds || options.authorIds.length === 0) {
		return [];
	}

	const conditions = [
		inArray(todos.authorId, options.authorIds),
		gte(todos.startDate, options.startDateFrom),
		lte(todos.startDate, options.startDateTo)
	];

	if (options.category && options.category !== 'all') {
		conditions.push(eq(todos.category, options.category));
	}

	const result = await db
		.select()
		.from(todos)
		.innerJoin(users, eq(todos.authorId, users.id))
		.where(and(...conditions))
		.orderBy(desc(todos.createdAt));

	const todoIds = result.map((r) => r.todos.id);
	const allReactionCounts =
		todoIds.length > 0 ? await reactionService.getCountsByTodoIds(db, todoIds) : {};

	return result.map(({ todos: todo, users: author }) => ({
		...sanitizeNote(todo),
		author: { id: author.id, nickname: author.nickname, handle: author.handle, avatar: author.avatar },
		reactions: allReactionCounts[todo.id] ?? { '👀': 0, '🔥': 0, '💪': 0, '👏': 0 }
	}));
}

