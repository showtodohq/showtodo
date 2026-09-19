import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import Tabs from '../ui/Tabs.svelte';

describe('Tabs component (TDD & WAI-ARIA)', () => {
	const mockOptions = [
		{ id: 'all', label: 'All', badge: 12 },
		{ id: 'active', label: 'Active' },
		{ id: 'done', label: 'Completed' }
	];

	it('renders container with role="tablist" and items with role="tab"', () => {
		const rendered = render(Tabs, {
			props: {
				options: mockOptions,
				value: 'all'
			}
		});

		expect(rendered.body).toContain('role="tablist"');
		expect(rendered.body).toContain('role="tab"');
		expect(rendered.body).toContain('All');
		expect(rendered.body).toContain('Active');
		expect(rendered.body).toContain('Completed');
	});

	it('marks active tab with aria-selected="true" and tabindex="0", others as "-1"', () => {
		const rendered = render(Tabs, {
			props: {
				options: mockOptions,
				value: 'active'
			}
		});

		expect(rendered.body).toContain('aria-selected="true"');
		expect(rendered.body).toContain('tabindex="0"');
		expect(rendered.body).toContain('tabindex="-1"');
	});

	it('renders badge count when provided in option', () => {
		const rendered = render(Tabs, {
			props: {
				options: mockOptions,
				value: 'all'
			}
		});

		expect(rendered.body).toContain('12');
	});

	it('supports pill and segmented variants', () => {
		const segmented = render(Tabs, {
			props: {
				options: mockOptions,
				value: 'all',
				variant: 'segmented'
			}
		});
		expect(segmented.body).toContain('rounded-xl');

		const pill = render(Tabs, {
			props: {
				options: mockOptions,
				value: 'all',
				variant: 'pill'
			}
		});
		expect(pill.body).toContain('rounded-full');
	});
});
