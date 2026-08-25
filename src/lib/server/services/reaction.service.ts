import { eq, and, count, inArray } from 'drizzle-orm';
import { reactions, users, todos } from '../db/schema';
import type { Database } from '../db';
import { AppError } from '../errors';

export async function add(db: Database, todoId: string, userId: string, emoji: string) {
	// Check if todo exists
	const todo = await db.select({ id: todos.id }).from(todos).where(eq(todos.id, todoId)).limit(1);
	if (!todo[0]) throw new AppError('NOT_FOUND', 'Todo not found');

	// Check for duplicate
	const existing = await db
		.select({ id: reactions.id })
		.from(reactions)
		.where(
			and(eq(reactions.todoId, todoId), eq(reactions.userId, userId), eq(reactions.emoji, emoji))
		)
		.limit(1);

	if (existing[0]) {
		throw new AppError('DUPLICATE_REACTION', 'You have already reacted with this emoji');
	}

	const result = await db.insert(reactions).values({ todoId, userId, emoji }).returning();
	return result[0];
}

export async function remove(db: Database, todoId: string, userId: string, emoji: string) {
	// Check if todo exists
	const todo = await db.select({ id: todos.id }).from(todos).where(eq(todos.id, todoId)).limit(1);
	if (!todo[0]) throw new AppError('NOT_FOUND', 'Todo not found');

	const result = await db
		.delete(reactions)
		.where(
			and(eq(reactions.todoId, todoId), eq(reactions.userId, userId), eq(reactions.emoji, emoji))
		)
		.returning();

	if (!result[0]) {
		throw new AppError('NOT_FOUND', 'Reaction not found');
	}

	return result[0];
}

export async function getByTodoId(db: Database, todoId: string) {
	const counts = await db
		.select({
			emoji: reactions.emoji,
			count: count()
		})
		.from(reactions)
		.where(eq(reactions.todoId, todoId))
		.groupBy(reactions.emoji);

	const details = await db
		.select({
			emoji: reactions.emoji,
			userId: users.id,
			nickname: users.nickname
		})
		.from(reactions)
		.innerJoin(users, eq(reactions.userId, users.id))
		.where(eq(reactions.todoId, todoId));

	const emojiGroups: Record<string, { count: number; users: { id: string; nickname: string }[] }> =
		{};

	for (const row of counts) {
		emojiGroups[row.emoji] = { count: row.count, users: [] };
	}

	for (const row of details) {
		if (emojiGroups[row.emoji]) {
			emojiGroups[row.emoji].users.push({ id: row.userId, nickname: row.nickname });
		}
	}

	return Object.entries(emojiGroups).map(([emoji, data]) => ({
		emoji,
		count: data.count,
		users: data.users
	}));
}

export async function getCountsByTodoIds(db: Database, todoIds: string[]) {
	if (todoIds.length === 0) return {};

	const result = await db
		.select({
			todoId: reactions.todoId,
			emoji: reactions.emoji,
			count: count()
		})
		.from(reactions)
		.where(inArray(reactions.todoId, todoIds))
		.groupBy(reactions.todoId, reactions.emoji);

	const countsMap: Record<string, Record<string, number>> = {};
	for (const todoId of todoIds) {
		countsMap[todoId] = { '👀': 0, '🔥': 0, '💪': 0, '👏': 0 };
	}
	for (const row of result) {
		if (countsMap[row.todoId]) {
			countsMap[row.todoId][row.emoji] = row.count;
		}
	}
	return countsMap;
}
