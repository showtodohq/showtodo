import { describe, it, expect, vi } from 'vitest';
import { render } from 'svelte/server';
import ExpandableFilterBar from '../ui/ExpandableFilterBar.svelte';

describe('ExpandableFilterBar Component', () => {
	it('renders idle state with small icon button by default', () => {
		const rendered = render(ExpandableFilterBar, {
			props: {
				query: '',
				hasActiveFilters: false
			}
		});

		// 检查渲染为默认紧凑图标按钮
		expect(rendered.body).toContain('Search and filter (Press /)');
		expect(rendered.body).toContain('aria-label="Open search and filter panel"');
	});

	it('renders summary badge state when hasActiveFilters is true', () => {
		const rendered = render(ExpandableFilterBar, {
			props: {
				query: '',
				hasActiveFilters: true,
				summaryText: '健身 · 进行中'
			}
		});

		// 检查渲染为摘要微徽标
		expect(rendered.body).toContain('健身 · 进行中');
		expect(rendered.body).toContain('title="Reset all filters"');
		expect(rendered.body).toContain('aria-label="Reset all filters"');
	});

	it('renders summary badge state when query is non-empty', () => {
		const rendered = render(ExpandableFilterBar, {
			props: {
				query: '背单词',
				hasActiveFilters: false
			}
		});

		expect(rendered.body).toContain('"背单词"');
		expect(rendered.body).toContain('title="Reset all filters"');
	});
});
