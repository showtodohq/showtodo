import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import Button from '../ui/Button.svelte';

describe('Button component (TDD & Design System)', () => {
	it('renders default button with type="button" and primary variant', () => {
		const rendered = render(Button, {
			props: {}
		});
		expect(rendered.body).toContain('<button');
		expect(rendered.body).toContain('type="button"');
		expect(rendered.body).toContain('bg-zinc-900');
	});

	it('renders icon-only button with equal width and height', () => {
		const rendered = render(Button, {
			props: {
				size: 'sm',
				iconOnly: true
			}
		});
		expect(rendered.body).toContain('w-8 h-8 p-0');
	});

	it('renders touch expanded pseudo element for small targets', () => {
		const rendered = render(Button, {
			props: {
				size: 'xs',
				touchExpanded: true
			}
		});
		expect(rendered.body).toContain('after:-inset-2.5');
	});

	it('renders loading spinner and disables button when loading=true', () => {
		const rendered = render(Button, {
			props: {
				loading: true
			}
		});
		expect(rendered.body).toContain('disabled');
		expect(rendered.body).toContain('animate-spin');
	});

	it('supports ghost and outline variants', () => {
		const ghost = render(Button, {
			props: { variant: 'ghost' }
		});
		expect(ghost.body).toContain('bg-transparent');

		const outline = render(Button, {
			props: { variant: 'outline' }
		});
		expect(outline.body).toContain('border-zinc-300');
	});

	it('renders anchor tag when href is provided with design system classes', () => {
		const rendered = render(Button, {
			props: {
				href: '/@alice/todolist',
				variant: 'outline',
				size: 'xs'
			}
		});
		expect(rendered.body).toContain('<a');
		expect(rendered.body).toContain('href="/@alice/todolist"');
		expect(rendered.body).toContain('h-7');
		expect(rendered.body).toContain('rounded-md');
		expect(rendered.body).toContain('border-zinc-300');
	});
});

