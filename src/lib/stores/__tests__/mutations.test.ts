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
});
