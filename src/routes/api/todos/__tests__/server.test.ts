import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../+server';
import * as userService from '$lib/server/services/user.service';
import * as todoService from '$lib/server/services/todo.service';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

vi.mock('$lib/server/services/user.service', () => ({
	findById: vi.fn(),
	findOrCreate: vi.fn()
}));

vi.mock('$lib/server/services/todo.service', () => ({
	create: vi.fn()
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe('POST /api/todos', () => {
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

	it('should return complete todo with author and default reactions when authenticated via locals', async () => {
		vi.mocked(userService.findById).mockResolvedValueOnce(mockUser as any);
		vi.mocked(todoService.create).mockResolvedValueOnce(mockRawTodo as any);

		const request = new Request('http://localhost/api/todos', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				content: '测试创建待办',
				category: 'study'
			})
		});

		const response = await POST({
			request,
			locals: { user: mockUser }
		} as any);

		expect(response.status).toBe(201);

		const data = await response.json();
		expect(data.author).toEqual(mockUser);
		expect(data.todo).toBeDefined();
		expect(data.todo.author).toBeDefined();
		expect(data.todo.author.nickname).toBe('测试昵称');
		expect(data.todo.author.handle).toBe('test_handle');
		expect(data.todo.reactions).toBeDefined();
		expect(data.todo.myReactions).toEqual([]);
		expect(userService.findById).toHaveBeenCalledWith(expect.anything(), 'user-uuid-1');
	});

	it('should reject with 403 FORBIDDEN when user is unauthenticated even if email is in body', async () => {
		const request = new Request('http://localhost/api/todos', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'spoofed@example.com',
				content: '未授权攻击尝试',
				category: 'work'
			})
		});

		const response = await POST({
			request,
			locals: { user: null }
		} as any);

		expect(response.status).toBe(403);
		const data = await response.json();
		expect(data.error.code).toBe('FORBIDDEN');
		expect(userService.findOrCreate).not.toHaveBeenCalled();
		expect(todoService.create).not.toHaveBeenCalled();
	});
});
