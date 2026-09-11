import { describe, it, expect, vi } from 'vitest';
import { GET } from '../+server';
import * as userService from '$lib/server/services/user.service';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

vi.mock('$lib/server/services/user.service', async (importOriginal) => {
	const actual = await importOriginal<typeof userService>();
	return {
		...actual,
		findByIdOrHandle: vi.fn(),
		update: vi.fn()
	};
});

describe('GET /api/users/[id]', () => {
	const targetUser = {
		id: 'user-uuid-victim',
		email: 'victim@example.com',
		handle: 'victim_user',
		nickname: 'Victim User',
		avatar: 'https://example.com/avatar.png',
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		updatedAt: new Date('2026-01-02T00:00:00.000Z'),
		lastTodoUpdatedAt: null
	};

	it('should strictly strip email when requested anonymously (no currentUserId)', async () => {
		vi.mocked(userService.findByIdOrHandle).mockResolvedValueOnce(targetUser as any);

		const url = new URL('http://localhost/api/users/victim_user');
		const request = new Request(url);

		const response = await GET({
			params: { id: 'victim_user' },
			url,
			request
		} as any);

		expect(response.status).toBe(200);
		const data = await response.json();

		expect(data.user).toBeDefined();
		expect(data.user.id).toBe(targetUser.id);
		expect(data.user.handle).toBe(targetUser.handle);
		expect(data.user.nickname).toBe(targetUser.nickname);
		// 关键安全断言：绝对不能包含 email
		expect('email' in data.user).toBe(false);
		expect(data.user.email).toBeUndefined();
	});

	it('should strictly strip email when accessed by another user (different currentUserId)', async () => {
		vi.mocked(userService.findByIdOrHandle).mockResolvedValueOnce(targetUser as any);

		const url = new URL('http://localhost/api/users/victim_user?currentUserId=user-uuid-attacker');
		const request = new Request(url);

		const response = await GET({
			params: { id: 'victim_user' },
			url,
			request
		} as any);

		expect(response.status).toBe(200);
		const data = await response.json();

		expect(data.user).toBeDefined();
		expect('email' in data.user).toBe(false);
		expect(data.user.email).toBeUndefined();
	});

	it('should include email when accessed by the owner themselves via query param', async () => {
		vi.mocked(userService.findByIdOrHandle).mockResolvedValueOnce(targetUser as any);

		const url = new URL('http://localhost/api/users/victim_user?currentUserId=user-uuid-victim');
		const request = new Request(url);

		const response = await GET({
			params: { id: 'victim_user' },
			url,
			request
		} as any);

		expect(response.status).toBe(200);
		const data = await response.json();

		expect(data.user).toBeDefined();
		expect(data.user.email).toBe('victim@example.com');
	});

	it('should include email when authenticated as owner via x-user-id header', async () => {
		vi.mocked(userService.findByIdOrHandle).mockResolvedValueOnce(targetUser as any);

		const url = new URL('http://localhost/api/users/victim_user');
		const request = new Request(url, {
			headers: { 'x-user-id': 'user-uuid-victim' }
		});

		const response = await GET({
			params: { id: 'victim_user' },
			url,
			request
		} as any);

		expect(response.status).toBe(200);
		const data = await response.json();

		expect(data.user).toBeDefined();
		expect(data.user.email).toBe('victim@example.com');
	});

	it('should return 404 when user is not found', async () => {
		vi.mocked(userService.findByIdOrHandle).mockResolvedValueOnce(null);

		const url = new URL('http://localhost/api/users/non_existing');
		const request = new Request(url);

		const response = await GET({
			params: { id: 'non_existing' },
			url,
			request
		} as any);

		expect(response.status).toBe(404);
		const data = await response.json();
		expect(data.error.code).toBe('NOT_FOUND');
	});
});
