import { describe, it, expect, vi } from 'vitest';
import { GET } from '../+server';
import * as userService from '$lib/server/services/user.service';
import * as todoService from '$lib/server/services/todo.service';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

vi.mock('$lib/server/services/user.service', async (importOriginal) => {
	const actual = await importOriginal<typeof userService>();
	return {
		...actual,
		listUsersWithTodosInWeek: vi.fn(),
		findById: vi.fn()
	};
});

vi.mock('$lib/server/services/todo.service', () => ({
	listForCalendar: vi.fn()
}));

describe('GET /api/calendar PII protection', () => {
	const userA = {
		id: '550e8400-e29b-41d4-a716-446655440001',
		email: 'usera@example.com',
		handle: 'user_a',
		nickname: 'User A',
		avatar: null,
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		updatedAt: new Date('2026-01-01T00:00:00.000Z'),
		lastTodoUpdatedAt: null
	};

	const userB = {
		id: '550e8400-e29b-41d4-a716-446655440002',
		email: 'userb@example.com',
		handle: 'user_b',
		nickname: 'User B',
		avatar: null,
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		updatedAt: new Date('2026-01-01T00:00:00.000Z'),
		lastTodoUpdatedAt: null
	};

	it('should strictly hide email for other users in activeUsers list', async () => {
		vi.mocked(userService.listUsersWithTodosInWeek).mockResolvedValueOnce({
			users: [userA, userB] as any,
			hasMore: false
		});
		vi.mocked(todoService.listForCalendar).mockResolvedValueOnce([]);

		const url = new URL(
			`http://localhost/api/calendar?startDateFrom=2026-09-01&startDateTo=2026-09-07&currentUserId=${userA.id}`
		);
		const request = new Request(url);

		const response = await GET({ url, request } as any);
		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data.users).toHaveLength(2);

		const foundSelf = data.users.find((u: any) => u.id === userA.id);
		const foundOther = data.users.find((u: any) => u.id === userB.id);

		// 自己访问时包含自己的 email
		expect(foundSelf.email).toBe('usera@example.com');

		// 他人绝对不包含 email
		expect('email' in foundOther).toBe(false);
		expect(foundOther.email).toBeUndefined();
	});

	it('should hide email for all users when visitor is anonymous', async () => {
		vi.mocked(userService.listUsersWithTodosInWeek).mockResolvedValueOnce({
			users: [userA, userB] as any,
			hasMore: false
		});
		vi.mocked(todoService.listForCalendar).mockResolvedValueOnce([]);

		const url = new URL(
			'http://localhost/api/calendar?startDateFrom=2026-09-01&startDateTo=2026-09-07'
		);
		const request = new Request(url);

		const response = await GET({ url, request } as any);
		expect(response.status).toBe(200);

		const data = await response.json();
		for (const u of data.users) {
			expect('email' in u).toBe(false);
			expect(u.email).toBeUndefined();
		}
	});
});
