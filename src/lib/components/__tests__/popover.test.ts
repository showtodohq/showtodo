import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import Popover from '../ui/Popover.svelte';
import { POPOVER_PLACEMENT, POPOVER_ROLE, POPOVER_TRIGGER } from '$lib/constants/popover';
import { createRawSnippet } from 'svelte';

describe('Popover Component (Native Popover API)', () => {
	it('does not render content when closed by default', () => {
		const contentSnippet = createRawSnippet(() => ({
			render: () => '<div id="test-content">Popover Content</div>'
		}));

		const rendered = render(Popover, {
			props: {
				defaultOpen: false,
				children: contentSnippet
			}
		});

		expect(rendered.body).not.toContain('id="test-content"');
		expect(rendered.body).toContain('popover="auto"');
	});

	it('renders content and top-layer markup when defaultOpen is true', () => {
		const contentSnippet = createRawSnippet(() => ({
			render: () => '<div id="test-content">Popover Content Active</div>'
		}));

		const rendered = render(Popover, {
			props: {
				defaultOpen: true,
				role: POPOVER_ROLE.MENU,
				placement: POPOVER_PLACEMENT.TOP_END,
				children: contentSnippet
			}
		});

		expect(rendered.body).toContain('id="test-content"');
		expect(rendered.body).toContain('popover="auto"');
		expect(rendered.body).toContain('role="menu"');
		expect(rendered.body).toContain('data-placement="top-end"');
	});

	it('properly binds triggerProps to trigger snippet', () => {
		const triggerSnippet = createRawSnippet((paramsGetter: () => { triggerProps: Record<string, unknown> }) => ({
			render: () => {
				const params = paramsGetter();
				const hasPopup = params?.triggerProps?.['aria-haspopup'] ?? '';
				const expanded = params?.triggerProps?.['aria-expanded'] ?? '';
				return `<button id="test-trigger" aria-haspopup="${hasPopup}" aria-expanded="${expanded}">Open</button>`;
			}
		}));

		const rendered = render(Popover, {
			props: {
				defaultOpen: true,
				trigger: POPOVER_TRIGGER.CLICK,
				role: POPOVER_ROLE.DIALOG,
				triggerSnippet
			}
		});

		expect(rendered.body).toContain('id="test-trigger"');
		expect(rendered.body).toContain('aria-haspopup="dialog"');
		expect(rendered.body).toContain('aria-expanded="true"');
	});

	it('supports controlled open prop', () => {
		const contentSnippet = createRawSnippet(() => ({
			render: () => '<div id="controlled-content">Controlled Open Content</div>'
		}));

		const rendered = render(Popover, {
			props: {
				open: true,
				children: contentSnippet
			}
		});

		expect(rendered.body).toContain('id="controlled-content"');
	});
});
