import { describe, it, expect, beforeEach, vi } from 'vitest';
import { userStore } from '../user.svelte';

describe('UserStore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		userStore.clearSession();
	});

	it('should have guest defaults when not authenticated', () => {
		expect(userStore.current).toBeNull();
		expect(userStore.avatar).toBeNull();
		expect(userStore.nickname).toBe('Guest');
		expect(userStore.handle).toBe('guest');
		expect(userStore.email).toBeUndefined();
	});

	it('should support legacy session when setSession is called', () => {
		userStore.setSession({
			id: 'legacy-1',
			email: 'alice@example.com',
			nickname: 'Alice Cooper',
			handle: 'alice',
			avatar: 'https://images.example.com/alice.png'
		});

		expect(userStore.current).not.toBeNull();
		expect(userStore.current?.id).toBe('legacy-1');
		expect(userStore.current?.email).toBe('alice@example.com');
		expect(userStore.avatar).toBe('https://images.example.com/alice.png');
		expect(userStore.nickname).toBe('Alice Cooper');
		expect(userStore.handle).toBe('alice');
	});

	it('should reset avatar and state on signOut', async () => {
		userStore.setSession({
			id: 'legacy-1',
			email: 'alice@example.com',
			nickname: 'Alice',
			handle: 'alice',
			avatar: 'https://images.example.com/alice.png'
		});

		expect(userStore.avatar).toBe('https://images.example.com/alice.png');

		await userStore.signOut();

		expect(userStore.current).toBeNull();
		expect(userStore.avatar).toBeNull();
		expect(userStore.nickname).toBe('Guest');
		expect(userStore.handle).toBe('guest');
	});

	it('should update avatar and info when updateUserFromProfile is called', () => {
		userStore.setSession({
			id: 'user-123',
			email: 'alice@example.com',
			nickname: 'Alice',
			handle: 'alice',
			avatar: 'https://images.example.com/old-avatar.png'
		});

		expect(userStore.avatar).toBe('https://images.example.com/old-avatar.png');

		userStore.updateUserFromProfile({
			id: 'user-123',
			email: 'alice@example.com',
			nickname: 'Alice Updated',
			handle: 'alice_new',
			avatar: 'https://images.example.com/new-avatar.png',
			createdAt: '',
			updatedAt: ''
		});

		expect(userStore.avatar).toBe('https://images.example.com/new-avatar.png');
		expect(userStore.nickname).toBe('Alice Updated');
		expect(userStore.handle).toBe('alice_new');
	});
});
