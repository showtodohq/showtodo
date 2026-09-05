import { describe, test, expect, beforeEach } from 'vitest';
import { testDb, cleanDatabase } from './setup';
import * as reactionService from '../services/reaction.service';
import * as todoService from '../services/todo.service';
import * as userService from '../services/user.service';
import { AppError } from '../errors';

let testUser: Awaited<ReturnType<typeof userService.findOrCreate>>;
let testTodo: Awaited<ReturnType<typeof todoService.create>>;

beforeEach(async () => {
	await cleanDatabase();
	testUser = await userService.findOrCreate(testDb, 'test@example.com');
	testTodo = await todoService.create(testDb, { content: 'Test todo', authorId: testUser.id });
});

describe('add', () => {
	test('adds reaction successfully', async () => {
		const reaction = await reactionService.add(testDb, testTodo.id, testUser.id, '🔥');
		expect(reaction.todoId).toBe(testTodo.id);
		expect(reaction.userId).toBe(testUser.id);
		expect(reaction.emoji).toBe('🔥');
		expect(reaction.id).toBeTruthy();
	});

	test('throws NOT_FOUND for non-existent todo', async () => {
		await expect(
			reactionService.add(testDb, '00000000-0000-0000-0000-000000000000', testUser.id, '🔥')
		).rejects.toThrow(AppError);
	});

	test('throws DUPLICATE_REACTION for duplicate', async () => {
		await reactionService.add(testDb, testTodo.id, testUser.id, '🔥');

		try {
			await reactionService.add(testDb, testTodo.id, testUser.id, '🔥');
			expect.unreachable('Should have thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(AppError);
			expect((e as AppError).code).toBe('DUPLICATE_REACTION');
		}
	});

	test('allows same user different emojis', async () => {
		await reactionService.add(testDb, testTodo.id, testUser.id, '🔥');
		const reaction2 = await reactionService.add(testDb, testTodo.id, testUser.id, '👀');
		expect(reaction2.emoji).toBe('👀');
	});

	test('allows different users same emoji', async () => {
		const otherUser = await userService.findOrCreate(testDb, 'other@example.com');
		await reactionService.add(testDb, testTodo.id, testUser.id, '🔥');
		const reaction2 = await reactionService.add(testDb, testTodo.id, otherUser.id, '🔥');
		expect(reaction2.userId).toBe(otherUser.id);
	});
});

describe('remove', () => {
	test('removes reaction successfully', async () => {
		await reactionService.add(testDb, testTodo.id, testUser.id, '🔥');
		const removed = await reactionService.remove(testDb, testTodo.id, testUser.id, '🔥');
		expect(removed[0].emoji).toBe('🔥');
	});

	test('throws NOT_FOUND for non-existent reaction', async () => {
		await expect(
			reactionService.remove(testDb, testTodo.id, testUser.id, '🔥')
		).rejects.toThrow(AppError);
	});

	test('throws NOT_FOUND for non-existent todo', async () => {
		await expect(
			reactionService.remove(testDb, '00000000-0000-0000-0000-000000000000', testUser.id, '🔥')
		).rejects.toThrow(AppError);
	});

	test('can re-add after removing', async () => {
		await reactionService.add(testDb, testTodo.id, testUser.id, '🔥');
		await reactionService.remove(testDb, testTodo.id, testUser.id, '🔥');
		const reaction = await reactionService.add(testDb, testTodo.id, testUser.id, '🔥');
		expect(reaction.emoji).toBe('🔥');
	});
});

describe('getByTodoId', () => {
	test('returns empty array when no reactions', async () => {
		const result = await reactionService.getByTodoId(testDb, testTodo.id);
		expect(result).toEqual([]);
	});

	test('groups reactions by emoji with correct counts', async () => {
		const otherUser = await userService.findOrCreate(testDb, 'other@example.com');
		await reactionService.add(testDb, testTodo.id, testUser.id, '🔥');
		await reactionService.add(testDb, testTodo.id, otherUser.id, '🔥');
		await reactionService.add(testDb, testTodo.id, testUser.id, '👀');

		const result = await reactionService.getByTodoId(testDb, testTodo.id);
		const fireReaction = result.find((r) => r.emoji === '🔥');
		const eyeReaction = result.find((r) => r.emoji === '👀');

		expect(fireReaction).toBeDefined();
		expect(fireReaction!.count).toBe(2);
		expect(fireReaction!.users).toHaveLength(2);

		expect(eyeReaction).toBeDefined();
		expect(eyeReaction!.count).toBe(1);
		expect(eyeReaction!.users).toHaveLength(1);
	});

	test('includes user info in each group', async () => {
		await reactionService.add(testDb, testTodo.id, testUser.id, '💪');

		const result = await reactionService.getByTodoId(testDb, testTodo.id);
		expect(result[0].users[0]).toEqual({
			id: testUser.id,
			nickname: 'test',
			handle: testUser.handle,
			avatar: null
		});
	});
});

describe('getCountsByTodoIds', () => {
	test('returns correct counts for multiple todos', async () => {
		const todo2 = await todoService.create(testDb, { content: 'Todo 2', authorId: testUser.id });
		await reactionService.add(testDb, testTodo.id, testUser.id, '🔥');
		await reactionService.add(testDb, todo2.id, testUser.id, '👀');

		const counts = await reactionService.getCountsByTodoIds(testDb, [testTodo.id, todo2.id]);
		expect(counts[testTodo.id]['🔥']).toBe(1);
		expect(counts[todo2.id]['👀']).toBe(1);
	});

	test('returns all zeros for todo with no reactions', async () => {
		const counts = await reactionService.getCountsByTodoIds(testDb, [testTodo.id]);
		expect(counts[testTodo.id]).toEqual({
			'❤️': 0,
			'👍': 0,
			'🔥': 0,
			'💪': 0,
			'👏': 0,
			'🚀': 0,
			'🎉': 0,
			'👀': 0
		});
	});

	test('returns empty object for empty input', async () => {
		const counts = await reactionService.getCountsByTodoIds(testDb, []);
		expect(counts).toEqual({});
	});
});
