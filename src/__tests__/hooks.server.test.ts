import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handle } from '../hooks.server';
import { auth } from '$lib/server/auth';
import * as apiKeyService from '$lib/server/services/api-key.service';

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

vi.mock('better-auth/svelte-kit', () => ({
	svelteKitHandler: vi.fn().mockImplementation(async ({ resolve, event }) => {
		return resolve(event);
	})
}));

describe('hooks.server.ts handle', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('authenticates user via Better Auth session if present', async () => {
		const mockSession = {
			session: { id: 'sess-1', userId: 'user-1' },
			user: {
				id: 'user-1',
				name: 'Session User',
				email: 'session@example.com',
				image: 'https://example.com/avatar.jpg'
			}
		};

		vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession as any);

		const event: any = {
			request: new Request('http://localhost/api/todos'),
			url: new URL('http://localhost/api/todos'),
			locals: {}
		};
		const resolve = vi.fn().mockResolvedValue(new Response('ok'));

		await handle({ event, resolve });

		expect(event.locals.session).toEqual(mockSession.session);
		expect(event.locals.user.id).toBe('user-1');
		expect(event.locals.user.nickname).toBe('Session User');
		expect(event.locals.apiKey).toBeNull();
		expect(apiKeyService.verifyApiKey).not.toHaveBeenCalled();
	});

	it('authenticates user via API Key if session is null and Bearer token is provided', async () => {
		vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

		const mockApiKey = {
			id: 'key-1',
			userId: 'user-2',
			name: 'Test Key'
		};
		const mockUser = {
			id: 'user-2',
			email: 'api@example.com',
			nickname: 'API Key User',
			handle: 'api_user',
			avatar: 'https://example.com/api-avatar.png'
		};

		vi.mocked(apiKeyService.verifyApiKey).mockResolvedValueOnce({
			apiKey: mockApiKey,
			user: mockUser
		} as any);

		const event: any = {
			request: new Request('http://localhost/api/todos', {
				headers: {
					Authorization: 'Bearer st_live_validtoken123'
				}
			}),
			url: new URL('http://localhost/api/todos'),
			locals: {}
		};
		const resolve = vi.fn().mockResolvedValue(new Response('ok'));

		await handle({ event, resolve });

		expect(event.locals.session).toBeNull();
		expect(event.locals.apiKey).toEqual(mockApiKey);
		expect(event.locals.user.id).toBe('user-2');
		expect(event.locals.user.nickname).toBe('API Key User');
		expect(apiKeyService.verifyApiKey).toHaveBeenCalledWith(expect.anything(), 'st_live_validtoken123');
	});

	it('leaves user null if API key is invalid', async () => {
		vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);
		vi.mocked(apiKeyService.verifyApiKey).mockResolvedValueOnce(null);

		const event: any = {
			request: new Request('http://localhost/api/todos', {
				headers: {
					Authorization: 'Bearer invalid_token'
				}
			}),
			url: new URL('http://localhost/api/todos'),
			locals: {}
		};
		const resolve = vi.fn().mockResolvedValue(new Response('ok'));

		await handle({ event, resolve });

		expect(event.locals.session).toBeNull();
		expect(event.locals.user).toBeNull();
		expect(event.locals.apiKey).toBeNull();
	});

	it('leaves user null if no session and no authorization header', async () => {
		vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

		const event: any = {
			request: new Request('http://localhost/api/todos'),
			url: new URL('http://localhost/api/todos'),
			locals: {}
		};
		const resolve = vi.fn().mockResolvedValue(new Response('ok'));

		await handle({ event, resolve });

		expect(event.locals.session).toBeNull();
		expect(event.locals.user).toBeNull();
		expect(event.locals.apiKey).toBeNull();
		expect(apiKeyService.verifyApiKey).not.toHaveBeenCalled();
	});
});
