import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handle } from '../../../hooks.server';
import { POST as createTodoPost } from '../todos/+server';
import { PATCH as updateTodoPatch, DELETE as deleteTodoDelete } from '../todos/[id]/+server';
import { auth } from '$lib/server/auth';
import * as apiKeyService from '$lib/server/services/api-key.service';
import * as userService from '$lib/server/services/user.service';
import * as todoService from '$lib/server/services/todo.service';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

vi.mock('$lib/server/auth', () => ({
	auth: {
		api: {
			getSession: vi.fn()
		}
	}
}));

vi.mock('$lib/server/services/api-key.service', () => ({
	verifyApiKey: vi.fn()
}));

vi.mock('$lib/server/services/user.service', () => ({
	findById: vi.fn(),
	findByIdOrHandle: vi.fn()
}));

vi.mock('$lib/server/services/todo.service', () => ({
	create: vi.fn(),
	update: vi.fn(),
	deleteTodo: vi.fn()
}));

vi.mock('better-auth/svelte-kit', () => ({
	svelteKitHandler: vi.fn().mockImplementation(async ({ resolve, event }) => {
		return resolve(event);
	})
}));

describe('RESTful API with API Key Authentication (Integration via Hooks)', () => {
	const mockApiKeyUser = {
		id: 'user-apikey-uuid',
		email: 'agent@showtodo.com',
		nickname: 'AI Agent',
		handle: 'ai_agent',
		avatar: null
	};

	const mockApiKey = {
		id: 'key-123',
		userId: mockApiKeyUser.id,
		name: 'Agent Key'
	};

	beforeEach(() => {
		vi.clearAllMocks();
		// Session is null for external API client
		vi.mocked(auth.api.getSession).mockResolvedValue(null as any);
	});

	it('allows creating a todo via RESTful API when authenticated with API Key Bearer token', async () => {
		vi.mocked(apiKeyService.verifyApiKey).mockResolvedValueOnce({
			apiKey: mockApiKey,
			user: mockApiKeyUser
		} as any);

		vi.mocked(userService.findById).mockResolvedValueOnce(mockApiKeyUser as any);
		vi.mocked(todoService.create).mockResolvedValueOnce({
			id: 'todo-created-by-api',
			shortId: 'short_api',
			topicHash: 'hash_api',
			content: 'Created via REST API with API Key',
			note: null,
			isNotePublic: true,
			category: 'dev',
			authorId: mockApiKeyUser.id,
			status: 'pending',
			startDate: new Date(),
			dueDate: null,
			createdAt: new Date(),
			updatedAt: new Date()
		} as any);

		// 模拟完整 SvelteKit 请求管道: hooks -> endpoint
		const request = new Request('http://localhost/api/todos', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer st_live_agenttoken123'
			},
			body: JSON.stringify({
				content: 'Created via REST API with API Key',
				category: 'dev'
			})
		});

		const event: any = {
			request,
			url: new URL('http://localhost/api/todos'),
			locals: {}
		};

		// Run hook
		const res = await handle({
			event,
			resolve: async (e: any) => {
				return createTodoPost(e);
			}
		});

		expect(res.status).toBe(201);
		expect(event.locals.apiKey).toEqual(mockApiKey);
		expect(event.locals.user.id).toBe(mockApiKeyUser.id);
		expect(todoService.create).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				content: 'Created via REST API with API Key',
				authorId: mockApiKeyUser.id
			})
		);
	});

	it('allows updating a todo via RESTful API when authenticated with API Key Bearer token', async () => {
		vi.mocked(apiKeyService.verifyApiKey).mockResolvedValueOnce({
			apiKey: mockApiKey,
			user: mockApiKeyUser
		} as any);

		vi.mocked(todoService.update).mockResolvedValueOnce({
			id: 'todo-123',
			content: 'Updated content'
		} as any);

		const request = new Request('http://localhost/api/todos/todo-123', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer st_live_agenttoken123'
			},
			body: JSON.stringify({
				content: 'Updated content'
			})
		});

		const event: any = {
			request,
			url: new URL('http://localhost/api/todos/todo-123'),
			params: { id: 'todo-123' },
			locals: {}
		};

		await handle({
			event,
			resolve: async (e: any) => {
				return updateTodoPatch(e);
			}
		});

		expect(event.locals.apiKey).toEqual(mockApiKey);
		expect(todoService.update).toHaveBeenCalledWith(
			expect.anything(),
			'todo-123',
			{ userId: mockApiKeyUser.id },
			expect.objectContaining({ content: 'Updated content' })
		);
	});

	it('allows deleting a todo via RESTful API when authenticated with API Key Bearer token', async () => {
		vi.mocked(apiKeyService.verifyApiKey).mockResolvedValueOnce({
			apiKey: mockApiKey,
			user: mockApiKeyUser
		} as any);

		vi.mocked(todoService.deleteTodo).mockResolvedValueOnce({
			success: true,
			deletedId: 'todo-123'
		});

		const request = new Request('http://localhost/api/todos/todo-123', {
			method: 'DELETE',
			headers: {
				Authorization: 'Bearer st_live_agenttoken123'
			}
		});

		const event: any = {
			request,
			url: new URL('http://localhost/api/todos/todo-123'),
			params: { id: 'todo-123' },
			locals: {}
		};

		await handle({
			event,
			resolve: async (e: any) => {
				return deleteTodoDelete(e);
			}
		});

		expect(event.locals.apiKey).toEqual(mockApiKey);
		expect(todoService.deleteTodo).toHaveBeenCalledWith(
			expect.anything(),
			'todo-123',
			{ userId: mockApiKeyUser.id }
		);
	});
});
