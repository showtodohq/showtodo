import { eq, asc, inArray } from 'drizzle-orm';
import { todoActivities } from '../db/schema';
import type { Database } from '../db';
import type { TodoActivity, TodoActivityType, TodoStatus } from '$lib/types/todo';

export interface RecordActivityData {
	todoId: string;
	authorId: string;
	type: TodoActivityType;
	fromStatus?: TodoStatus | null;
	toStatus?: TodoStatus | null;
	content?: string | null;
}

export async function recordActivity(
	db: Database,
	data: RecordActivityData
): Promise<TodoActivity> {
	const result = await db
		.insert(todoActivities)
		.values({
			todoId: data.todoId,
			authorId: data.authorId,
			type: data.type,
			fromStatus: data.fromStatus ?? null,
			toStatus: data.toStatus ?? null,
			content: data.content ?? null
		})
		.returning();

	const row = result[0];
	return {
		id: row.id,
		todoId: row.todoId,
		authorId: row.authorId,
		type: row.type as TodoActivityType,
		fromStatus: (row.fromStatus as TodoStatus) ?? null,
		toStatus: (row.toStatus as TodoStatus) ?? null,
		content: row.content,
		createdAt: row.createdAt.toISOString()
	};
}

export async function listByTodoId(db: Database, todoId: string): Promise<TodoActivity[]> {
	const rows = await db
		.select()
		.from(todoActivities)
		.where(eq(todoActivities.todoId, todoId))
		.orderBy(asc(todoActivities.createdAt));

	return rows.map((row) => ({
		id: row.id,
		todoId: row.todoId,
		authorId: row.authorId,
		type: row.type as TodoActivityType,
		fromStatus: (row.fromStatus as TodoStatus) ?? null,
		toStatus: (row.toStatus as TodoStatus) ?? null,
		content: row.content,
		createdAt: row.createdAt.toISOString()
	}));
}

export async function listByTodoIds(
	db: Database,
	todoIds: string[]
): Promise<Record<string, TodoActivity[]>> {
	if (!todoIds || todoIds.length === 0) return {};

	const rows = await db
		.select()
		.from(todoActivities)
		.where(inArray(todoActivities.todoId, todoIds))
		.orderBy(asc(todoActivities.createdAt));

	const map: Record<string, TodoActivity[]> = {};
	for (const id of todoIds) {
		map[id] = [];
	}

	for (const row of rows) {
		if (!map[row.todoId]) {
			map[row.todoId] = [];
		}
		map[row.todoId].push({
			id: row.id,
			todoId: row.todoId,
			authorId: row.authorId,
			type: row.type as TodoActivityType,
			fromStatus: (row.fromStatus as TodoStatus) ?? null,
			toStatus: (row.toStatus as TodoStatus) ?? null,
			content: row.content,
			createdAt: row.createdAt.toISOString()
		});
	}

	return map;
}
