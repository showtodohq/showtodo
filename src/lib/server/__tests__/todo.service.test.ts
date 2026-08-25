import { describe, test, expect, beforeEach } from 'vitest';
import { testDb, cleanDatabase } from './setup';
import * as todoService from '../services/todo.service';
import * as userService from '../services/user.service';
import { AppError } from '../errors';

let testUser: Awaited<ReturnType<typeof userService.findOrCreate>>;

beforeEach(async () => {
	await cleanDatabase();
	testUser = await userService.findOrCreate(testDb, 'test@example.com');
});

describe('create', () => {
	test('creates todo with minimal fields', async () => {
		const todo = await todoService.create(testDb, {
			content: 'Test todo',
			authorId: testUser.id
		});
		expect(todo.content).toBe('Test todo');
		expect(todo.status).toBe('pending');
		expect(todo.isNotePublic).toBe(true);
		expect(todo.note).toBeNull();
		expect(todo.category).toBeNull();
		expect(todo.authorId).toBe(testUser.id);
		expect(todo.id).toBeTruthy();
	});

	test('creates todo with all fields', async () => {
		const todo = await todoService.create(testDb, {
			content: 'Full todo',
			note: 'Some note',
			isNotePublic: false,
			category: 'dev',
			authorId: testUser.id,
			startDate: '2026-08-26',
			dueDate: '2026-09-01'
		});
		expect(todo.content).toBe('Full todo');
		expect(todo.note).toBe('Some note');
		expect(todo.isNotePublic).toBe(false);
		expect(todo.category).toBe('dev');
		expect(todo.startDate).toBe('2026-08-26');
		expect(todo.dueDate).toBe('2026-09-01');
	});

	test('defaults startDate to today when not provided', async () => {
		const todo = await todoService.create(testDb, {
			content: 'Date test',
			authorId: testUser.id
		});
		expect(todo.startDate).toBeTruthy();
	});
});

describe('findById', () => {
	test('returns todo with author and reactions', async () => {
		const created = await todoService.create(testDb, {
			content: 'Find me',
			authorId: testUser.id
		});
		const found = await todoService.findById(testDb, created.id);
		expect(found).not.toBeNull();
		expect(found!.content).toBe('Find me');
		expect(found!.author.id).toBe(testUser.id);
		expect(found!.author.nickname).toBe('test');
		expect(found!.reactions).toEqual({ '👀': 0, '🔥': 0, '💪': 0, '👏': 0 });
	});

	test('hides note when isNotePublic is false', async () => {
		const created = await todoService.create(testDb, {
			content: 'Secret note',
			note: 'This is private',
			isNotePublic: false,
			authorId: testUser.id
		});
		const found = await todoService.findById(testDb, created.id);
		expect(found!.note).toBeNull();
		expect(found!.isNotePublic).toBe(false);
	});

	test('shows note when isNotePublic is true', async () => {
		const created = await todoService.create(testDb, {
			content: 'Public note',
			note: 'This is public',
			isNotePublic: true,
			authorId: testUser.id
		});
		const found = await todoService.findById(testDb, created.id);
		expect(found!.note).toBe('This is public');
	});

	test('returns null for non-existent id', async () => {
		const found = await todoService.findById(testDb, '00000000-0000-0000-0000-000000000000');
		expect(found).toBeNull();
	});
});

describe('list', () => {
	test('returns all todos without filters', async () => {
		await todoService.create(testDb, { content: 'Todo 1', authorId: testUser.id });
		await todoService.create(testDb, { content: 'Todo 2', authorId: testUser.id });

		const result = await todoService.list(testDb, {});
		expect(result.todos).toHaveLength(2);
	});

	test('filters by status', async () => {
		const todo = await todoService.create(testDb, { content: 'Will finish', authorId: testUser.id });
		await todoService.update(testDb, todo.id, 'test@example.com', { status: 'done' });
		await todoService.create(testDb, { content: 'Still pending', authorId: testUser.id });

		const result = await todoService.list(testDb, { status: 'pending' });
		expect(result.todos).toHaveLength(1);
		expect(result.todos[0].content).toBe('Still pending');
	});

	test('filters by category', async () => {
		await todoService.create(testDb, {
			content: 'Study',
			category: 'study',
			authorId: testUser.id
		});
		await todoService.create(testDb, { content: 'Dev', category: 'dev', authorId: testUser.id });

		const result = await todoService.list(testDb, { category: 'study' });
		expect(result.todos).toHaveLength(1);
		expect(result.todos[0].content).toBe('Study');
	});

	test('filters by authorId', async () => {
		const otherUser = await userService.findOrCreate(testDb, 'other@example.com');
		await todoService.create(testDb, { content: 'Mine', authorId: testUser.id });
		await todoService.create(testDb, { content: 'Theirs', authorId: otherUser.id });

		const result = await todoService.list(testDb, { authorId: testUser.id });
		expect(result.todos).toHaveLength(1);
		expect(result.todos[0].content).toBe('Mine');
	});

	test('combines multiple filters', async () => {
		await todoService.create(testDb, {
			content: 'Match',
			category: 'dev',
			authorId: testUser.id
		});
		await todoService.create(testDb, {
			content: 'No match',
			category: 'study',
			authorId: testUser.id
		});

		const result = await todoService.list(testDb, {
			category: 'dev',
			authorId: testUser.id
		});
		expect(result.todos).toHaveLength(1);
		expect(result.todos[0].content).toBe('Match');
	});

	test('supports cursor-based pagination', async () => {
		for (let i = 0; i < 5; i++) {
			await todoService.create(testDb, { content: `Todo ${i}`, authorId: testUser.id });
		}

		const page1 = await todoService.list(testDb, { limit: 2 });
		expect(page1.todos).toHaveLength(2);
		expect(page1.nextCursor).not.toBeNull();

		const page2 = await todoService.list(testDb, { cursor: page1.nextCursor!, limit: 2 });
		expect(page2.todos).toHaveLength(2);
		expect(page2.nextCursor).not.toBeNull();

		const page3 = await todoService.list(testDb, { cursor: page2.nextCursor!, limit: 2 });
		expect(page3.todos).toHaveLength(1);
		expect(page3.nextCursor).toBeNull();

		// All todos across pages are unique
		const allIds = [...page1.todos, ...page2.todos, ...page3.todos].map((t) => t.id);
		expect(new Set(allIds).size).toBe(5);
	});

	test('respects limit', async () => {
		for (let i = 0; i < 5; i++) {
			await todoService.create(testDb, { content: `Todo ${i}`, authorId: testUser.id });
		}

		const result = await todoService.list(testDb, { limit: 3 });
		expect(result.todos).toHaveLength(3);
		expect(result.nextCursor).not.toBeNull();
	});

	test('orders by createdAt desc (newest first)', async () => {
		await todoService.create(testDb, { content: 'First', authorId: testUser.id });
		await todoService.create(testDb, { content: 'Second', authorId: testUser.id });

		const result = await todoService.list(testDb, {});
		expect(result.todos[0].content).toBe('Second');
		expect(result.todos[1].content).toBe('First');
	});

	test('hides note when isNotePublic is false in list', async () => {
		await todoService.create(testDb, {
			content: 'Private note',
			note: 'Secret',
			isNotePublic: false,
			authorId: testUser.id
		});

		const result = await todoService.list(testDb, {});
		expect(result.todos[0].note).toBeNull();
	});

	test('returns empty array when no results', async () => {
		const result = await todoService.list(testDb, {});
		expect(result.todos).toEqual([]);
		expect(result.nextCursor).toBeNull();
	});

	test('returns null nextCursor when all items fit in one page', async () => {
		await todoService.create(testDb, { content: 'Only one', authorId: testUser.id });

		const result = await todoService.list(testDb, { limit: 10 });
		expect(result.todos).toHaveLength(1);
		expect(result.nextCursor).toBeNull();
	});
});

describe('update', () => {
	test('updates content', async () => {
		const todo = await todoService.create(testDb, { content: 'Original', authorId: testUser.id });
		const updated = await todoService.update(testDb, todo.id, 'test@example.com', {
			content: 'Updated'
		});
		expect(updated.content).toBe('Updated');
	});

	test('updates note', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		const updated = await todoService.update(testDb, todo.id, 'test@example.com', {
			note: 'New note'
		});
		expect(updated.note).toBe('New note');
	});

	test('updates isNotePublic', async () => {
		const todo = await todoService.create(testDb, {
			content: 'Todo',
			note: 'Note',
			authorId: testUser.id
		});
		const updated = await todoService.update(testDb, todo.id, 'test@example.com', {
			isNotePublic: false
		});
		expect(updated.isNotePublic).toBe(false);
	});

	test('updates category', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		const updated = await todoService.update(testDb, todo.id, 'test@example.com', {
			category: 'dev'
		});
		expect(updated.category).toBe('dev');
	});

	test('rejects update by non-author', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		await userService.findOrCreate(testDb, 'hacker@example.com');

		try {
			await todoService.update(testDb, todo.id, 'hacker@example.com', { content: 'Hacked' });
			expect.unreachable('Should have thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(AppError);
			expect((e as AppError).code).toBe('FORBIDDEN');
		}
	});

	test('throws NOT_FOUND for non-existent todo', async () => {
		await expect(
			todoService.update(testDb, '00000000-0000-0000-0000-000000000000', 'test@example.com', {
				content: 'X'
			})
		).rejects.toThrow(AppError);
	});
});

describe('status transitions', () => {
	test('allows pending → in_progress', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		const updated = await todoService.update(testDb, todo.id, 'test@example.com', {
			status: 'in_progress'
		});
		expect(updated.status).toBe('in_progress');
	});

	test('allows pending → done', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		const updated = await todoService.update(testDb, todo.id, 'test@example.com', {
			status: 'done'
		});
		expect(updated.status).toBe('done');
	});

	test('allows pending → abandoned', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		const updated = await todoService.update(testDb, todo.id, 'test@example.com', {
			status: 'abandoned'
		});
		expect(updated.status).toBe('abandoned');
	});

	test('allows in_progress → done', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		await todoService.update(testDb, todo.id, 'test@example.com', { status: 'in_progress' });
		const updated = await todoService.update(testDb, todo.id, 'test@example.com', {
			status: 'done'
		});
		expect(updated.status).toBe('done');
	});

	test('allows in_progress → abandoned', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		await todoService.update(testDb, todo.id, 'test@example.com', { status: 'in_progress' });
		const updated = await todoService.update(testDb, todo.id, 'test@example.com', {
			status: 'abandoned'
		});
		expect(updated.status).toBe('abandoned');
	});

	test('rejects done → pending', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		await todoService.update(testDb, todo.id, 'test@example.com', { status: 'done' });

		try {
			await todoService.update(testDb, todo.id, 'test@example.com', { status: 'pending' });
			expect.unreachable('Should have thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(AppError);
			expect((e as AppError).code).toBe('INVALID_STATUS_TRANSITION');
		}
	});

	test('rejects done → in_progress', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		await todoService.update(testDb, todo.id, 'test@example.com', { status: 'done' });

		await expect(
			todoService.update(testDb, todo.id, 'test@example.com', { status: 'in_progress' })
		).rejects.toThrow(AppError);
	});

	test('rejects abandoned → pending', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		await todoService.update(testDb, todo.id, 'test@example.com', { status: 'abandoned' });

		await expect(
			todoService.update(testDb, todo.id, 'test@example.com', { status: 'pending' })
		).rejects.toThrow(AppError);
	});

	test('rejects in_progress → pending', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		await todoService.update(testDb, todo.id, 'test@example.com', { status: 'in_progress' });

		await expect(
			todoService.update(testDb, todo.id, 'test@example.com', { status: 'pending' })
		).rejects.toThrow(AppError);
	});
});
