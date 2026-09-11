import { describe, test, expect } from 'vitest';
import { toPublicProfile, toUserProfile } from '../services/user.service';

describe('User Projection & PII Data Protection', () => {
	const mockUser = {
		id: '550e8400-e29b-41d4-a716-446655440000',
		email: 'sensitive-user@example.com',
		handle: 'secret_agent',
		nickname: 'Secret Agent',
		avatar: 'https://avatar.example.com/agent.png',
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		updatedAt: new Date('2026-01-02T00:00:00.000Z'),
		lastTodoUpdatedAt: new Date('2026-01-03T00:00:00.000Z')
	};

	describe('toPublicProfile', () => {
		test('completely strips email and never exposes PII to visitors', () => {
			const publicProfile = toPublicProfile(mockUser);

			expect(publicProfile.id).toBe(mockUser.id);
			expect(publicProfile.handle).toBe('secret_agent');
			expect(publicProfile.nickname).toBe('Secret Agent');
			expect(publicProfile.avatar).toBe('https://avatar.example.com/agent.png');
			expect(publicProfile.createdAt).toBe('2026-01-01T00:00:00.000Z');
			expect(publicProfile.updatedAt).toBe('2026-01-02T00:00:00.000Z');
			expect(publicProfile.lastTodoUpdatedAt).toBe('2026-01-03T00:00:00.000Z');

			// 严格断言：无论属性访问还是原型键枚举，绝对不包含 email
			expect('email' in publicProfile).toBe(false);
			expect((publicProfile as unknown as Record<string, unknown>).email).toBeUndefined();
			expect(Object.keys(publicProfile)).not.toContain('email');
		});

		test('handles string dates if already formatted', () => {
			const userWithStringDates = {
				...mockUser,
				createdAt: '2026-01-01T00:00:00.000Z' as any,
				updatedAt: '2026-01-02T00:00:00.000Z' as any,
				lastTodoUpdatedAt: null
			};
			const profile = toPublicProfile(userWithStringDates);
			expect(profile.createdAt).toBe('2026-01-01T00:00:00.000Z');
			expect(profile.lastTodoUpdatedAt).toBeNull();
		});
	});

	describe('toUserProfile', () => {
		test('omits email when viewer is not the owner (isSelf is false or omitted)', () => {
			const profileNotSelf = toUserProfile(mockUser, { isSelf: false });
			expect('email' in profileNotSelf).toBe(false);
			expect((profileNotSelf as unknown as Record<string, unknown>).email).toBeUndefined();

			const profileDefault = toUserProfile(mockUser);
			expect('email' in profileDefault).toBe(false);
			expect((profileDefault as unknown as Record<string, unknown>).email).toBeUndefined();
		});

		test('includes email when viewer is the authenticated owner (isSelf is true)', () => {
			const profileSelf = toUserProfile(mockUser, { isSelf: true });
			expect('email' in profileSelf).toBe(true);
			expect(profileSelf.email).toBe('sensitive-user@example.com');
			expect(profileSelf.id).toBe(mockUser.id);
			expect(profileSelf.handle).toBe(mockUser.handle);
		});
	});
});
