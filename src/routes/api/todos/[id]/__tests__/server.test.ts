import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '../+server';
import * as todoService from '$lib/server/services/todo.service';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

vi.mock('$lib/server/services/todo.service', () => ({
	findByIdOrShortId: vi.fn(),
	update: vi.fn(),
	deleteTodo: vi.fn()
}));

describe('/api/todos/[id]', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /api/todos/[id]', () => {
		it('retrieves todo prioritizing locals.user.id over query params', async () => {
			const mockTodo = { id: 'todo-123', content: 'test todo' };
			vi.mocked(todoService.findByIdOrShortId).mockResolvedValueOnce(mockTodo as any);

			const response = await GET({
				params: { id: 'todo-123' },
				url: new URL('http://localhost/api/todos/todo-123?currentUserId=other-user'),
				locals: { user: { id: 'auth-user-id' } }
			} as any);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data.todo).toEqual(mockTodo);
			expect(todoService.findByIdOrShortId).toHaveBeenCalledWith(expect.anything(), 'todo-123', 'auth-user-id');
		});
	});

	describe('PATCH /api/todos/[id]', () => {
		it('updates todo when authenticated via locals', async () => {
			const updatedTodo = { id: 'todo-123', content: 'new content' };
			vi.mocked(todoService.update).mockResolvedValueOnce(updatedTodo as any);

			const request = new Request('http://localhost/api/todos/todo-123', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: 'new content' })
			});

			const response = await PATCH({
				params: { id: 'todo-123' },
				request,
				locals: { user: { id: 'auth-user-id' } }
			} as any);

			expect(response.status).toBe(200);
			expect(todoService.update).toHaveBeenCalledWith(
				expect.anything(),
				'todo-123',
				{ userId: 'auth-user-id' },
				expect.objectContaining({ content: 'new content' })
			);
		});

		it('rejects with 403 FORBIDDEN when unauthenticated even if email is in body', async () => {
			const request = new Request('http://localhost/api/todos/todo-123', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: 'spoofed@example.com',
					content: 'unauthorized edit'
				})
			});

			const response = await PATCH({
				params: { id: 'todo-123' },
				request,
				locals: { user: null }
			} as any);

			expect(response.status).toBe(403);
			const data = await response.json();
			expect(data.error.code).toBe('FORBIDDEN');
			expect(todoService.update).not.toHaveBeenCalled();
		});
	});

	describe('DELETE /api/todos/[id]', () => {
		it('deletes todo when authenticated via locals', async () => {
			vi.mocked(todoService.deleteTodo).mockResolvedValueOnce({ success: true, deletedId: 'todo-123' });

			const response = await DELETE({
				params: { id: 'todo-123' },
				locals: { user: { id: 'auth-user-id' } }
			} as any);

			expect(response.status).toBe(200);
			expect(todoService.deleteTodo).toHaveBeenCalledWith(
				expect.anything(),
				'todo-123',
				{ userId: 'auth-user-id' }
			);
		});

		it('rejects with 403 FORBIDDEN when unauthenticated', async () => {
			const response = await DELETE({
				params: { id: 'todo-123' },
				locals: { user: null }
			} as any);

			expect(response.status).toBe(403);
			const data = await response.json();
			expect(data.error.code).toBe('FORBIDDEN');
			expect(todoService.deleteTodo).not.toHaveBeenCalled();
		});
	});
});
