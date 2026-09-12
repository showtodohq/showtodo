import { describe, it, expect, vi } from 'vitest';
import Header from '../layout/Header.svelte';
import { render } from 'svelte/server';

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost:5173/')
	}
}));

describe('Header rendering test', () => {
	it('renders three core navigation tabs with icons, aria-labels, and responsive text', () => {
		const rendered = render(Header);

		// 1. 动态流 Tab
		expect(rendered.body).toContain('href="/"');
		expect(rendered.body).toContain('aria-label="动态流"');
		expect(rendered.body).toContain('title="动态流"');

		// 2. 同行广场 Tab
		expect(rendered.body).toContain('href="/topics"');
		expect(rendered.body).toContain('aria-label="同行广场"');
		expect(rendered.body).toContain('title="同行广场"');

		// 3. 全站看板 Tab
		expect(rendered.body).toContain('href="/stats"');
		expect(rendered.body).toContain('aria-label="全站看板"');
		expect(rendered.body).toContain('title="全站看板"');

		// 4. 移动端隐藏文字，平板/桌面端显示的响应式类
		expect(rendered.body).toContain('<span class="hidden sm:inline">动态流</span>');
		expect(rendered.body).toContain('<span class="hidden sm:inline">同行广场</span>');
		expect(rendered.body).toContain('<span class="hidden sm:inline">全站看板</span>');
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
