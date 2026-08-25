import { eq, and, desc, lt } from 'drizzle-orm';
import { todos, users } from '../db/schema';
import type { Database } from '../db';
import { AppError } from '../errors';
import { validateStatusTransition, type TodoStatus } from '../validation';
import * as reactionService from './reaction.service';

interface CreateTodoData {
	content: string;
	note?: string | null;
	isNotePublic?: boolean;
	category?: string | null;
	authorId: string;
	startDate?: string;
	dueDate?: string | null;
}

interface ListTodosFilters {
	status?: TodoStatus;
	category?: string;
	authorId?: string;
	cursor?: string;
	limit?: number;
}

interface UpdateTodoData {
	content?: string;
	note?: string | null;
	isNotePublic?: boolean;
	category?: string | null;
	status?: TodoStatus;
	startDate?: string;
	dueDate?: string | null;
}

function sanitizeNote<T extends { note: string | null; isNotePublic: boolean }>(todo: T): T {
	if (!todo.isNotePublic) {
		return { ...todo, note: null };
	}
	return todo;
}

export async function create(db: Database, data: CreateTodoData) {
	const values: Record<string, unknown> = {
		content: data.content,
		note: data.note ?? null,
		isNotePublic: data.isNotePublic ?? true,
		category: data.category ?? null,
		authorId: data.authorId,
		dueDate: data.dueDate ?? null
	};
	// Only set startDate if provided; otherwise let the DB default (CURRENT_DATE) apply
	if (data.startDate !== undefined) {
		values.startDate = data.startDate;
	}

	const result = await db.insert(todos).values(values).returning();
	return result[0];
}

export async function findById(db: Database, id: string) {
	const result = await db
		.select()
		.from(todos)
		.innerJoin(users, eq(todos.authorId, users.id))
		.where(eq(todos.id, id))
		.limit(1);

	if (!result[0]) return null;

	const { todos: todo, users: author } = result[0];

	const reactionCounts = await reactionService.getCountsByTodoIds(db, [id]);

	return {
		...sanitizeNote(todo),
		author: { id: author.id, nickname: author.nickname, avatar: author.avatar },
		reactions: reactionCounts[id] ?? { '👀': 0, '🔥': 0, '💪': 0, '👏': 0 }
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
	if (filters.authorId) {
		conditions.push(eq(todos.authorId, filters.authorId));
	}
	if (filters.cursor) {
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

	// Fetch one extra to determine if there's a next page
	const result = await db
		.select()
		.from(todos)
		.innerJoin(users, eq(todos.authorId, users.id))
		.where(where)
		.orderBy(desc(todos.createdAt))
		.limit(limit + 1);

	const hasMore = result.length > limit;
	const items = hasMore ? result.slice(0, limit) : result;

	// Batch-fetch reaction counts
	const todoIds = items.map((r) => r.todos.id);
	const allReactionCounts =
		todoIds.length > 0 ? await reactionService.getCountsByTodoIds(db, todoIds) : {};

	const todoList = items.map(({ todos: todo, users: author }) => ({
		...sanitizeNote(todo),
		author: { id: author.id, nickname: author.nickname, avatar: author.avatar },
		reactions: allReactionCounts[todo.id] ?? { '👀': 0, '🔥': 0, '💪': 0, '👏': 0 }
	}));

	return {
		todos: todoList,
		nextCursor: hasMore ? items[items.length - 1].todos.id : null
	};
}

export async function update(db: Database, id: string, authorEmail: string, data: UpdateTodoData) {
	const existing = await db
		.select()
		.from(todos)
		.innerJoin(users, eq(todos.authorId, users.id))
		.where(eq(todos.id, id))
		.limit(1);

	if (!existing[0]) throw new AppError('NOT_FOUND', 'Todo not found');

	const { users: author } = existing[0];
	if (author.email !== authorEmail) {
		throw new AppError('FORBIDDEN', 'Only the author can update this todo');
	}

	// Validate status transition
	if (data.status && data.status !== existing[0].todos.status) {
		validateStatusTransition(existing[0].todos.status as TodoStatus, data.status);
	}

	const updateData: Record<string, unknown> = {};
	if (data.content !== undefined) updateData.content = data.content;
	if (data.note !== undefined) updateData.note = data.note;
	if (data.isNotePublic !== undefined) updateData.isNotePublic = data.isNotePublic;
	if (data.category !== undefined) updateData.category = data.category;
	if (data.status !== undefined) updateData.status = data.status;
	if (data.startDate !== undefined) updateData.startDate = data.startDate;
	if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;

	const result = await db.update(todos).set(updateData).where(eq(todos.id, id)).returning();
	return result[0];
}
