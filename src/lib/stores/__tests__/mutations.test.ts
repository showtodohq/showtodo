import { describe, it, expect, beforeEach, vi } from 'vitest';
import { todoMutations } from '../mutations.svelte';
import { todoRegistry } from '../entities/todo-registry.svelte';
import { userStore } from '../user.svelte';
import { api } from '$lib/services/api';
import type { Todo } from '$lib/types/todo';

vi.mock('$lib/services/api', () => ({
	api: {
		createTodo: vi.fn(),
		updateTodo: vi.fn(),
		deleteTodo: vi.fn().mockResolvedValue({ success: true, deletedId: 'test-id' }),
		addReaction: vi.fn().mockResolvedValue({}),
		removeReaction: vi.fn().mockResolvedValue({}),
		getDailyCards: vi.fn().mockResolvedValue({ cards: [] })
	}
}));

vi.mock('$lib/stores/toast.svelte', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn()
	}
}));

vi.mock('$lib/utils/confetti', () => ({
	confetti: {
		burst: vi.fn(),
		tripleCelebration: vi.fn()
	}
}));

describe('todoMutations.createTodo', () => {
	beforeEach(() => {
		todoRegistry.clear();
		vi.clearAllMocks();
		userStore.setSession({
			email: 'tester@example.com',
			nickname: '测试用户',
			handle: 'tester',
			id: 'user-uuid-1',
			avatar: 'https://example.com/avatar.jpg'
		});
	});

	it('should ensure created todo has author in registry even if API returns raw todo without author', async () => {
		const rawTodoFromApi = {
			id: 'real-todo-uuid',
			shortId: 'short123',
			topicHash: 'hash-abc',
			content: '发布新待办',
			note: null,
			isNotePublic: true,
			category: 'dev' as const,
			authorId: 'user-uuid-1',
			status: 'pending' as const,
			startDate: '2026-09-10T12:00:00.000Z',
			dueDate: null,
			createdAt: '2026-09-10T12:00:00.000Z',
			updatedAt: '2026-09-10T12:00:00.000Z'
		} as Todo;

		const authorFromApi = {
			id: 'user-uuid-1',
			email: 'tester@example.com',
			nickname: '云端昵称',
			handle: 'tester_cloud',
			avatar: 'https://example.com/cloud.jpg',
			createdAt: '2026-09-10T12:00:00.000Z',
			updatedAt: '2026-09-10T12:00:00.000Z'
		};

		vi.mocked(api.createTodo).mockResolvedValueOnce({
			todo: rawTodoFromApi,
			author: authorFromApi
		});

		const result = await todoMutations.createTodo({
			content: '发布新待办',
			category: 'dev'
		});

		expect(result).toBeDefined();
		expect(result?.id).toBe('real-todo-uuid');
		expect(result?.author).toBeDefined();
		expect(result?.author?.nickname).toBe('云端昵称');

		const storedInRegistry = todoRegistry.get('real-todo-uuid');
		expect(storedInRegistry).toBeDefined();
		expect(storedInRegistry?.author).toBeDefined();
		expect(storedInRegistry?.author?.nickname).toBe('云端昵称');
	});

	it('should pass dueDate to api.createTodo and reflect in optimistic tempTodo', async () => {
		const rawTodoFromApi = {
			id: 'real-todo-with-due',
			shortId: 'shortdue',
			topicHash: 'hash-due',
			content: '有截止日期的待办',
			note: null,
			isNotePublic: true,
			category: 'dev' as const,
			authorId: 'user-uuid-1',
			status: 'pending' as const,
			startDate: '2026-09-10T12:00:00.000Z',
			dueDate: '2026-09-30T18:00:00.000Z',
			createdAt: '2026-09-10T12:00:00.000Z',
			updatedAt: '2026-09-10T12:00:00.000Z'
		} as Todo;

		vi.mocked(api.createTodo).mockResolvedValueOnce({
			todo: rawTodoFromApi,
			author: {
				id: 'user-uuid-1',
				email: 'tester@example.com',
				nickname: '测试用户',
				handle: 'tester',
				avatar: 'https://example.com/avatar.jpg',
				createdAt: '2026-09-10T12:00:00.000Z',
				updatedAt: '2026-09-10T12:00:00.000Z'
			}
		});

		const result = await todoMutations.createTodo({
			content: '有截止日期的待办',
			category: 'dev',
			dueDate: '2026-09-30T18:00:00.000Z'
		});

		expect(api.createTodo).toHaveBeenCalledWith(
			expect.objectContaining({
				dueDate: '2026-09-30T18:00:00.000Z'
			})
		);
		expect(result?.dueDate).toBe('2026-09-30T18:00:00.000Z');
	});

	it('should pass custom startDate to api.createTodo and reflect in optimistic tempTodo', async () => {
		const rawTodoFromApi = {
			id: 'real-todo-with-start',
			shortId: 'shortstart',
			topicHash: 'hash-start',
			content: '有开始日期的待办',
			note: null,
			isNotePublic: true,
			category: 'dev' as const,
			authorId: 'user-uuid-1',
			status: 'pending' as const,
			startDate: '2026-09-25T00:00:00.000Z',
			dueDate: null,
			createdAt: '2026-09-10T12:00:00.000Z',
			updatedAt: '2026-09-10T12:00:00.000Z'
		} as Todo;

		vi.mocked(api.createTodo).mockResolvedValueOnce({
			todo: rawTodoFromApi,
			author: {
				id: 'user-uuid-1',
				email: 'tester@example.com',
				nickname: '测试用户',
				handle: 'tester',
				avatar: 'https://example.com/avatar.jpg',
				createdAt: '2026-09-10T12:00:00.000Z',
				updatedAt: '2026-09-10T12:00:00.000Z'
			}
		});

		const result = await todoMutations.createTodo({
			content: '有开始日期的待办',
			category: 'dev',
			startDate: '2026-09-25T00:00:00.000Z'
		});

		expect(api.createTodo).toHaveBeenCalledWith(
			expect.objectContaining({
				startDate: '2026-09-25T00:00:00.000Z'
			})
		);
		expect(result?.startDate).toBe('2026-09-25T00:00:00.000Z');
	});

	it('increments count by exactly 1 when toggleReaction is called with fallbackTodo (detail page scenario)', async () => {
		const todo = todoRegistry.upsert({
			id: 'detail-todo-1',
			shortId: 'dt1',
			topicHash: '',
			content: '测试待办',
			note: null,
			isNotePublic: true,
			category: null,
			authorId: 'user-uuid-1',
			status: 'pending',
			startDate: '2026-09-11T00:00:00.000Z',
			dueDate: null,
			createdAt: '2026-09-11T00:00:00.000Z',
			updatedAt: '2026-09-11T00:00:00.000Z',
			reactions: { '🔥': 0, '❤️': 0 },
			myReactions: []
		});

		await todoMutations.toggleReaction('detail-todo-1', '🔥', todo);

		expect(todo.reactions?.['🔥']).toBe(1);
		expect(todo.myReactions).toEqual(['🔥']);
	});

	it('decrements count by exactly 1 when toggleReaction is called to cancel reaction', async () => {
		const todo = todoRegistry.upsert({
			id: 'detail-todo-2',
			shortId: 'dt2',
			topicHash: '',
			content: '测试待办2',
			note: null,
			isNotePublic: true,
			category: null,
			authorId: 'user-uuid-1',
			status: 'pending',
			startDate: '2026-09-11T00:00:00.000Z',
			dueDate: null,
			createdAt: '2026-09-11T00:00:00.000Z',
			updatedAt: '2026-09-11T00:00:00.000Z',
			reactions: { '🔥': 2, '❤️': 0 },
			myReactions: ['🔥']
		});

		await todoMutations.toggleReaction('detail-todo-2', '🔥', todo);

		expect(todo.reactions?.['🔥']).toBe(1);
		expect(todo.myReactions).toEqual([]);
	});
});

describe('todoMutations.deleteTodo', () => {
	beforeEach(() => {
		todoRegistry.clear();
		vi.clearAllMocks();
		userStore.setSession({
			email: 'tester@example.com',
			nickname: '测试用户',
			handle: 'tester',
			id: 'user-uuid-1',
			avatar: 'https://example.com/avatar.jpg'
		});
	});

	it('calls api.deleteTodo and clears todo from registry and lists', async () => {
		todoRegistry.upsert({
			id: 'todo-to-delete',
			shortId: 'ttd',
			topicHash: '',
			content: '待删除',
			note: null,
			isNotePublic: true,
			category: null,
			authorId: 'user-uuid-1',
			status: 'pending',
			startDate: '2026-09-11T00:00:00.000Z',
			dueDate: null,
			createdAt: '2026-09-11T00:00:00.000Z',
			updatedAt: '2026-09-11T00:00:00.000Z'
		});

		expect(todoRegistry.get('todo-to-delete')).toBeDefined();

		const success = await todoMutations.deleteTodo('todo-to-delete');
		expect(success).toBe(true);
		expect(api.deleteTodo).toHaveBeenCalledWith('todo-to-delete', 'tester@example.com');
		expect(todoRegistry.get('todo-to-delete')).toBeUndefined();
	});

	it('returns false and does not clear registry if API fails', async () => {
		vi.mocked(api.deleteTodo).mockRejectedValueOnce(new Error('Network error'));

		todoRegistry.upsert({
			id: 'todo-failed-delete',
			shortId: 'tfd',
			topicHash: '',
			content: '待删除失败',
			note: null,
			isNotePublic: true,
			category: null,
			authorId: 'user-uuid-1',
			status: 'pending',
			startDate: '2026-09-11T00:00:00.000Z',
			dueDate: null,
			createdAt: '2026-09-11T00:00:00.000Z',
			updatedAt: '2026-09-11T00:00:00.000Z'
		});

		const success = await todoMutations.deleteTodo('todo-failed-delete');
		expect(success).toBe(false);
		expect(todoRegistry.get('todo-failed-delete')).toBeDefined();
	});
});
