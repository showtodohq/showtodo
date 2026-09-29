import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, DELETE, GET } from '../+server';
import * as reactionService from '$lib/server/services/reaction.service';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

vi.mock('$lib/server/services/reaction.service', () => ({
	getByTodoId: vi.fn(),
	add: vi.fn(),
	remove: vi.fn()
}));

describe('/api/todos/[id]/reactions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GET', () => {
		it('returns reactions for a todo', async () => {
			const mockReactions = [{ emoji: '👍', count: 1 }];
			vi.mocked(reactionService.getByTodoId).mockResolvedValueOnce(mockReactions as any);

			const response = await GET({
				params: { id: 'todo-123' }
			} as any);

			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data.reactions).toEqual(mockReactions);
		});
	});

	describe('POST', () => {
		it('adds reaction when authenticated via locals', async () => {
			const mockReaction = { id: 'r-1', todoId: 'todo-123', userId: 'user-1', emoji: '👍' };
			vi.mocked(reactionService.add).mockResolvedValueOnce(mockReaction as any);

			const request = new Request('http://localhost/api/todos/todo-123/reactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ emoji: '👍' })
			});

			const response = await POST({
				params: { id: 'todo-123' },
				request,
				locals: { user: { id: 'user-1' } }
			} as any);

			expect(response.status).toBe(201);
			expect(reactionService.add).toHaveBeenCalledWith(expect.anything(), 'todo-123', 'user-1', '👍');
		});

		it('rejects with 403 when unauthenticated even if email is provided in body', async () => {
			const request = new Request('http://localhost/api/todos/todo-123/reactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ emoji: '👍', email: 'spoofed@example.com' })
			});

			const response = await POST({
				params: { id: 'todo-123' },
				request,
				locals: { user: null }
			} as any);

			expect(response.status).toBe(403);
			const data = await response.json();
			expect(data.error.code).toBe('FORBIDDEN');
			expect(reactionService.add).not.toHaveBeenCalled();
		});
	});

	describe('DELETE', () => {
		it('removes reaction when authenticated via locals', async () => {
			vi.mocked(reactionService.remove).mockResolvedValueOnce(undefined as any);

			const request = new Request('http://localhost/api/todos/todo-123/reactions', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ emoji: '👍' })
			});

			const response = await DELETE({
				params: { id: 'todo-123' },
				request,
				locals: { user: { id: 'user-1' } }
			} as any);

			expect(response.status).toBe(200);
			expect(reactionService.remove).toHaveBeenCalledWith(expect.anything(), 'todo-123', 'user-1', '👍');
		});

		it('rejects with 403 when unauthenticated even if email is provided in body', async () => {
			const request = new Request('http://localhost/api/todos/todo-123/reactions', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ emoji: '👍', email: 'spoofed@example.com' })
			});

			const response = await DELETE({
				params: { id: 'todo-123' },
				request,
				locals: { user: null }
			} as any);

			expect(response.status).toBe(403);
			const data = await response.json();
			expect(data.error.code).toBe('FORBIDDEN');
			expect(reactionService.remove).not.toHaveBeenCalled();
		});
	});
});
