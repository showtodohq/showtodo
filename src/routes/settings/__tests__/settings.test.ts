import { describe, it, expect, vi } from 'vitest';
import SettingsPage from '../+page.svelte';
import { load } from '../+page.server';
import { render } from 'svelte/server';

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost:5173/settings')
	}
}));

vi.mock('$app/environment', () => ({
	browser: false
}));

vi.mock('$lib/server/db', () => ({
	db: {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		limit: vi.fn().mockResolvedValue([{ id: 'acc_1' }])
	}
}));

describe('Settings Password Page (+page.server.ts)', () => {
	it('redirects to / when user is not authenticated', async () => {
		const locals = { user: null, session: null } as any;
		await expect(load({ locals } as any)).rejects.toThrow();
	});

	it('returns hasPassword when user is authenticated', async () => {
		const locals = {
			user: { id: 'usr_1', name: 'Alice', email: 'alice@example.com' },
			session: { id: 'sess_1' }
		} as any;

		const result = (await load({ locals } as any)) as any;
		expect(result).toMatchObject({ hasPassword: true });
		expect(Array.isArray(result.apiKeys)).toBe(true);
	});
});

describe('Settings Password Page Component (+page.svelte)', () => {
	it('renders change password form when hasPassword is true', () => {
		const rendered = render(SettingsPage, {
			props: {
				data: {
					user: null,
					session: null,
					hasPassword: true,
					apiKeys: []
				}
			}
		});

		expect(rendered.body).toContain('Change Password');
		expect(rendered.body).toContain('Current Password');
		expect(rendered.body).toContain('Update Password');
	});

	it('renders set password form when hasPassword is false', () => {
		const rendered = render(SettingsPage, {
			props: {
				data: {
					user: null,
					session: null,
					hasPassword: false,
					apiKeys: []
				}
			}
		});

		expect(rendered.body).toContain('Create Password');
		expect(rendered.body).not.toContain('Current Password');
		expect(rendered.body).toContain('Set Password');
	});
});
