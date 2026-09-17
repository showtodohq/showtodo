import { describe, it, expect, vi } from 'vitest';
import Header from '../layout/Header.svelte';
import { render } from 'svelte/server';

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost:5173/')
	}
}));

describe('Header rendering test', () => {
	it('renders four core navigation tabs with icons, aria-labels, and responsive text', () => {
		const rendered = render(Header);

		// 1. Feed Tab
		expect(rendered.body).toContain('href="/"');
		expect(rendered.body).toContain('aria-label="Feed"');
		expect(rendered.body).toContain('title="Feed"');

		// 2. Goals Tab
		expect(rendered.body).toContain('href="/goals"');
		expect(rendered.body).toContain('aria-label="Goals"');
		expect(rendered.body).toContain('title="Goals"');

		// 3. My Tab
		expect(rendered.body).toContain('href="/my"');
		expect(rendered.body).toContain('aria-label="My"');
		expect(rendered.body).toContain('title="My"');

		// 4. Stats Tab
		expect(rendered.body).toContain('href="/stats"');
		expect(rendered.body).toContain('aria-label="Stats"');
		expect(rendered.body).toContain('title="Stats"');

		// 5. Responsive label text
		expect(rendered.body).toContain('<span class="hidden sm:inline">Feed</span>');
		expect(rendered.body).toContain('<span class="hidden sm:inline">Goals</span>');
		expect(rendered.body).toContain('<span class="hidden sm:inline">My</span>');
		expect(rendered.body).toContain('<span class="hidden sm:inline">Stats</span>');
	});

	it('uses symmetric 3-column grid layout for absolute centering of tabs', () => {
		const rendered = render(Header);

		// 验证使用了精确对齐中心线的 grid-cols-[1fr_auto_1fr] 结构
		expect(rendered.body).toContain('grid grid-cols-[1fr_auto_1fr]');
		expect(rendered.body).toContain('justify-start');
		expect(rendered.body).toContain('justify-center');
		expect(rendered.body).toContain('justify-end');
	});
});
