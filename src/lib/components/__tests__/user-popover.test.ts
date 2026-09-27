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

describe('UserPopover component', () => {
	it('renders user trigger avatar', () => {
		const rendered = render(UserPopover);
		expect(rendered.body).toContain('aria-label="User settings"');
	});
});
