import { describe, it, expect, vi } from 'vitest';
import { render } from 'svelte/server';
import UserPopover from '../layout/UserPopover.svelte';

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost:5173/')
	}
}));

vi.mock('$app/environment', () => ({
	browser: false
}));

vi.mock('$lib/stores/user.svelte', () => ({
	userStore: {
		current: {
			id: 'usr_test_1',
			email: 'test@example.com',
			nickname: 'Tester',
			handle: 'tester',
			avatar: 'https://example.com/avatar.png'
		},
		id: 'usr_test_1',
		email: 'test@example.com',
		nickname: 'Tester',
		handle: 'tester',
		avatar: 'https://example.com/avatar.png',
		signOut: vi.fn()
	}
}));

describe('UserPopover component', () => {
	it('renders user trigger avatar and menu links', () => {
		const rendered = render(UserPopover, {
			props: {
				initialOpen: true
			}
		});
		expect(rendered.body).toContain('aria-label="User settings"');
		expect(rendered.body).toContain('href="/settings"');
		expect(rendered.body).toContain('href="/settings/password"');
		expect(rendered.body).toContain('href="/settings/apikey"');
		expect(rendered.body).toContain('Password');
		expect(rendered.body).toContain('API Key');
	});
});
