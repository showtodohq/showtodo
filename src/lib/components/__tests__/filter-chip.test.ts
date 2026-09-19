import { describe, it, expect, vi } from 'vitest';
import { render } from 'svelte/server';
import FilterChip from '../ui/FilterChip.svelte';

describe('FilterChip Component (TDD & Design System)', () => {
	it('renders default unselected state with proper button attributes', () => {
		const rendered = render(FilterChip, {
			props: {
				selected: false,
				title: 'Filter by Status'
			}
		});

		expect(rendered.body).toContain('<button');
		expect(rendered.body).toContain('type="button"');
		expect(rendered.body).toContain('aria-pressed="false"');
		expect(rendered.body).toContain('title="Filter by Status"');
		// 未选中状态类名
		expect(rendered.body).toContain('text-zinc-500');
	});

	it('renders selected state with high contrast highlight', () => {
		const rendered = render(FilterChip, {
			props: {
				selected: true
			}
		});

		expect(rendered.body).toContain('aria-pressed="true"');
		expect(rendered.body).toContain('bg-zinc-900 text-white');
		expect(rendered.body).toContain('shadow-2xs');
	});

	it('renders dot with dotClass or dotColor', () => {
		const renderedWithClass = render(FilterChip, {
			props: {
				dotClass: 'bg-emerald-500'
			}
		});
		expect(renderedWithClass.body).toContain('bg-emerald-500');

		const renderedWithColor = render(FilterChip, {
			props: {
				dotColor: '#3b82f6'
			}
		});
		expect(renderedWithColor.body).toContain('background-color: #3b82f6');
	});

	it('renders badge count when provided', () => {
		const rendered = render(FilterChip, {
			props: {
				badge: 12
			}
		});
		expect(rendered.body).toContain('12');
		expect(rendered.body).toContain('font-mono');
	});
});
