import { describe, it, expect, vi } from 'vitest';
import { POST } from '../+server';
import * as userService from '$lib/server/services/user.service';
import * as todoService from '$lib/server/services/todo.service';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

vi.mock('$lib/server/services/user.service', () => ({
	findOrCreate: vi.fn()
}));

vi.mock('$lib/server/services/todo.service', () => ({
	create: vi.fn()
}));

describe('POST /api/todos', () => {
	it('should return complete todo with author and default reactions', async () => {
		const mockUser = {
			id: 'user-uuid-1',
			email: 'test@example.com',
			nickname: '测试昵称',
			handle: 'test_handle',
			avatar: 'https://example.com/avatar.jpg'
		};

		const mockRawTodo = {
			id: 'todo-uuid-1',
			shortId: 'short123',
			topicHash: 'hash-abc',
			content: '测试创建待办',
			note: null,
			isNotePublic: true,
			category: 'study',
			authorId: 'user-uuid-1',
			status: 'pending',
			startDate: new Date('2026-09-10T12:00:00.000Z'),
			dueDate: null,
			createdAt: new Date('2026-09-10T12:00:00.000Z'),
			updatedAt: new Date('2026-09-10T12:00:00.000Z')
		};

		vi.mocked(userService.findOrCreate).mockResolvedValueOnce(mockUser as any);
		vi.mocked(todoService.create).mockResolvedValueOnce(mockRawTodo as any);

		const request = new Request('http://localhost/api/todos', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'test@example.com',
				content: '测试创建待办',
				category: 'study'
			})
		});

		const response = await POST({ request } as any);
		expect(response.status).toBe(201);

		const data = await response.json();
		expect(data.author).toEqual(mockUser);
		expect(data.todo).toBeDefined();
		expect(data.todo.author).toBeDefined();
		expect(data.todo.author.nickname).toBe('测试昵称');
		expect(data.todo.author.handle).toBe('test_handle');
		expect(data.todo.reactions).toBeDefined();
		expect(data.todo.myReactions).toEqual([]);
	});
});
