import { describe, it, expect, vi } from 'vitest';
import SettingsLayout from '../+layout.svelte';
import { load as layoutLoad } from '../+layout.server';
import SettingsOverviewPage from '../+page.svelte';
import PasswordPage from '../password/+page.svelte';
import { load as passwordLoad } from '../password/+page.server';
import ApiKeyPage from '../apikey/+page.svelte';
import { load as apikeyLoad } from '../apikey/+page.server';
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

vi.mock('$lib/server/services/api-key.service', () => ({
	listByUser: vi.fn().mockResolvedValue([
		{
			id: 'key_1',
			userId: 'usr_1',
			name: 'Cursor Dev',
			prefix: 'st_dev1234',
			createdAt: new Date(),
			lastUsedAt: null
		}
	]),
	createApiKey: vi.fn(),
	revokeApiKey: vi.fn()
}));

const mockBaseData = {
	user: { id: 'usr_1', name: 'Alice', email: 'alice@example.com', emailVerified: true, createdAt: new Date(), updatedAt: new Date(), nickname: 'Alice', avatar: null, handle: 'alice' } as any,
	session: { id: 'sess_1', userId: 'usr_1', token: 'tok_1', expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date() } as any,
	hasPassword: true,
	apiKeys: [
		{
			id: 'key_1',
			userId: 'usr_1',
			name: 'Cursor Dev',
			prefix: 'st_dev1234',
			scopes: 'all',
			createdAt: new Date(),
			lastUsedAt: null,
			expiresAt: null
		}
	]
};

describe('Settings Layout (+layout.server.ts)', () => {
	it('redirects to / when user is not authenticated', async () => {
		const locals = { user: null, session: null } as any;
		await expect(layoutLoad({ locals } as any)).rejects.toThrow();
	});

	it('returns user, hasPassword, and apiKeys when authenticated', async () => {
		const locals = {
			user: { id: 'usr_1', name: 'Alice', email: 'alice@example.com' },
			session: { id: 'sess_1' }
		} as any;

		const result = (await layoutLoad({ locals } as any)) as any;
		expect(result).toMatchObject({
			hasPassword: true,
			user: { id: 'usr_1' }
		});
		expect(Array.isArray(result.apiKeys)).toBe(true);
		expect(result.apiKeys[0].name).toBe('Cursor Dev');
	});
});

describe('Settings Layout Component (+layout.svelte)', () => {
	it('renders left-right layout with navigation items', () => {
		const rendered = render(SettingsLayout, {
			props: {
				data: mockBaseData as any,
				children: (() => '<!-- Slot Content -->') as any
			}
		});

		expect(rendered.body).toContain('Overview');
		expect(rendered.body).toContain('Password');
		expect(rendered.body).toContain('API Keys');
		expect(rendered.body).toContain('href="/settings"');
		expect(rendered.body).toContain('href="/settings/password"');
		expect(rendered.body).toContain('href="/settings/apikey"');
	});
});

describe('Settings Overview Page Component (+page.svelte)', () => {
	it('renders overview with security and API keys cards', () => {
		const rendered = render(SettingsOverviewPage, {
			props: {
				data: mockBaseData as any
			}
		});

		expect(rendered.body).toContain('Password &amp; Security');
		expect(rendered.body).toContain('AI &amp; MCP API Keys');
		expect(rendered.body).toContain('Appearance &amp; Theme');
		expect(rendered.body).toContain('/settings/password');
		expect(rendered.body).toContain('/settings/apikey');
	});
});

describe('Settings Password Page (+page.server.ts & +page.svelte)', () => {
	it('passwordLoad checks authentication and returns hasPassword', async () => {
		const locals = {
			user: { id: 'usr_1', name: 'Alice' },
			session: { id: 'sess_1' }
		} as any;
		const result = await passwordLoad({ locals } as any);
		expect(result).toMatchObject({ hasPassword: true });
	});

	it('renders change password form when hasPassword is true', () => {
		const rendered = render(PasswordPage, {
			props: {
				data: {
					...mockBaseData,
					hasPassword: true
				} as any
			}
		});

		expect(rendered.body).toContain('Change Password');
		expect(rendered.body).toContain('Current Password');
		expect(rendered.body).toContain('Update Password');
	});

	it('renders set password form when hasPassword is false', () => {
		const rendered = render(PasswordPage, {
			props: {
				data: {
					...mockBaseData,
					hasPassword: false
				} as any
			}
		});

		expect(rendered.body).toContain('Create Password');
		expect(rendered.body).not.toContain('Current Password');
		expect(rendered.body).toContain('Set Password');
	});
});

describe('Settings API Key Page (+page.server.ts & +page.svelte)', () => {
	it('apikeyLoad returns user api keys', async () => {
		const locals = {
			user: { id: 'usr_1' },
			session: { id: 'sess_1' }
		} as any;
		const result = (await apikeyLoad({ locals } as any)) as any;
		expect(Array.isArray(result?.apiKeys)).toBe(true);
		expect(result?.apiKeys[0].name).toBe('Cursor Dev');
	});

	it('renders API keys list and new key trigger button', () => {
		const rendered = render(ApiKeyPage, {
			props: {
				data: {
					...mockBaseData,
					apiKeys: [
						{
							id: 'key_1',
							userId: 'usr_1',
							name: 'Claude Desktop',
							prefix: 'st_claude',
							scopes: 'all',
							createdAt: new Date(),
							lastUsedAt: null,
							expiresAt: null
						}
					]
				} as any
			}
		});

		expect(rendered.body).toContain('Claude Desktop');
		expect(rendered.body).toContain('st_claude');
		expect(rendered.body).toContain('New API Key');
		expect(rendered.body).toContain('How to configure in Cursor / Claude Desktop');
	});
});
