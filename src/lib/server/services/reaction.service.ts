import { eq, and, count, inArray } from 'drizzle-orm';
import { reactions, users, todos } from '../db/schema';
import type { Database } from '../db';
import { AppError } from '../errors';
import { isUUID } from '../validation';

async function resolveTodoUuid(db: Database, idOrShortId: string): Promise<string | null> {
	if (!idOrShortId) return null;
	if (isUUID(idOrShortId)) {
		const todo = await db.select({ id: todos.id }).from(todos).where(eq(todos.id, idOrShortId)).limit(1);
		return todo[0]?.id ?? null;
	}
	const todo = await db.select({ id: todos.id }).from(todos).where(eq(todos.shortId, idOrShortId)).limit(1);
	return todo[0]?.id ?? null;
}

export async function add(db: Database, idOrShortId: string, userId: string, emoji: string) {
	const todoId = await resolveTodoUuid(db, idOrShortId);
	if (!todoId) throw new AppError('NOT_FOUND', 'Todo not found');

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

export async function remove(db: Database, idOrShortId: string, userId: string, emoji: string) {
	const todoId = await resolveTodoUuid(db, idOrShortId);
	if (!todoId) throw new AppError('NOT_FOUND', 'Todo not found');

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

export async function getByTodoId(db: Database, idOrShortId: string) {
	const todoId = await resolveTodoUuid(db, idOrShortId);
	if (!todoId) return [];

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
			nickname: users.nickname,
			handle: users.handle,
			avatar: users.avatar
		})
		.from(reactions)
		.innerJoin(users, eq(reactions.userId, users.id))
		.where(eq(reactions.todoId, todoId));

	const emojiGroups: Record<string, { count: number; users: { id: string; nickname: string; handle?: string; avatar?: string | null }[] }> =
		{};

	for (const row of counts) {
		emojiGroups[row.emoji] = { count: row.count, users: [] };
	}

	for (const row of details) {
		if (emojiGroups[row.emoji]) {
			emojiGroups[row.emoji].users.push({
				id: row.userId,
				nickname: row.nickname,
				handle: row.handle,
				avatar: row.avatar
			});
		}
	}

	return Object.entries(emojiGroups).map(([emoji, data]) => ({
		emoji,
		count: data.count,
		users: data.users
	}));
}

export async function getCountsByTodoIds(db: Database, todoIds: string[]) {
	const validUuids = todoIds.filter(isUUID);
	if (validUuids.length === 0) return {};

	const result = await db
		.select({
			todoId: reactions.todoId,
			emoji: reactions.emoji,
			count: count()
		})
		.from(reactions)
		.where(inArray(reactions.todoId, validUuids))
		.groupBy(reactions.todoId, reactions.emoji);

	const countsMap: Record<string, Record<string, number>> = {};
	for (const todoId of validUuids) {
		countsMap[todoId] = { '❤️': 0, '👍': 0, '🔥': 0, '💪': 0, '👏': 0, '🚀': 0, '🎉': 0, '👀': 0 };
	}
	for (const row of result) {
		if (countsMap[row.todoId]) {
			countsMap[row.todoId][row.emoji] = row.count;
		}
	}
	return countsMap;
}

export async function getMyReactionsByTodoIds(
	db: Database,
	todoIds: string[],
	userId: string
): Promise<Record<string, string[]>> {
	const validUuids = todoIds.filter(isUUID);
	if (validUuids.length === 0 || !isUUID(userId)) return {};

	const rows = await db
		.select({
			todoId: reactions.todoId,
			emoji: reactions.emoji
		})
		.from(reactions)
		.where(and(inArray(reactions.todoId, validUuids), eq(reactions.userId, userId)));

	const myReactionsMap: Record<string, string[]> = {};
	for (const row of rows) {
		if (!myReactionsMap[row.todoId]) {
			myReactionsMap[row.todoId] = [];
		}
		myReactionsMap[row.todoId].push(row.emoji);
	}
	return myReactionsMap;
}


