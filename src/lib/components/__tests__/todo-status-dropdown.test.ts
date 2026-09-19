import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import TodoStatusDropdown from '../todo/TodoStatusDropdown.svelte';

describe('TodoStatusDropdown Component SSR', () => {
	it('renders trigger button with current status label and icon', () => {
		const rendered = render(TodoStatusDropdown, {
			props: {
				status: 'in_progress'
			}
		});

		expect(rendered.body).toContain('In Progress');
		expect(rendered.body).toContain('Change status');
	});

	it('renders dropdown menu items when open', () => {
		const rendered = render(TodoStatusDropdown, {
			props: {
				status: 'pending',
				defaultOpen: true
			}
		});

		expect(rendered.body).toContain('Move to');
		expect(rendered.body).toContain('Pending');
		expect(rendered.body).toContain('In Progress');
		expect(rendered.body).toContain('Completed');
		expect(rendered.body).toContain('Abandoned');
	});

	it('renders disabled state properly', () => {
		const rendered = render(TodoStatusDropdown, {
			props: {
				status: 'done',
				disabled: true
			}
		});

		expect(rendered.body).toContain('Completed');
		expect(rendered.body).toContain('disabled');
	});
});
