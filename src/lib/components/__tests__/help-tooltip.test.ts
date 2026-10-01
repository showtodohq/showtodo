import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import HelpTooltip from '../ui/HelpTooltip.svelte';
import { createRawSnippet } from 'svelte';

describe('HelpTooltip Component', () => {
	it('renders trigger button with accessible attributes by default', () => {
		const rendered = render(HelpTooltip, {
			props: {
				text: 'This is helpful information',
				ariaLabel: 'Learn about recurrence'
			}
		});

		expect(rendered.body).toContain('aria-label="Learn about recurrence"');
		expect(rendered.body).toContain('popover="auto"');
		// Popover is closed by default, so content is not rendered yet
		expect(rendered.body).not.toContain('This is helpful information');
	});

	it('renders title and text content when defaultOpen is true', () => {
		const rendered = render(HelpTooltip, {
			props: {
				defaultOpen: true,
				title: 'Interaction Guide',
				text: 'This explains how schedules interact with recurrence'
			}
		});

		expect(rendered.body).toContain('Interaction Guide');
		expect(rendered.body).toContain('This explains how schedules interact with recurrence');
		expect(rendered.body).toContain('popover="auto"');
	});

	it('renders custom children snippet when provided', () => {
		const customContent = createRawSnippet(() => ({
			render: () => '<ul id="custom-help-list"><li>Item 1</li><li>Item 2</li></ul>'
		}));

		const rendered = render(HelpTooltip, {
			props: {
				defaultOpen: true,
				title: 'Custom Title',
				children: customContent
			}
		});

		expect(rendered.body).toContain('Custom Title');
		expect(rendered.body).toContain('id="custom-help-list"');
		expect(rendered.body).toContain('<li>Item 1</li>');
	});
});
