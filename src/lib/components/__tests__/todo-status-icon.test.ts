import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import TodoStatusIcon from '../todo/TodoStatusIcon.svelte';
import { TODO_STATUS, TODO_STATUS_ICON_SIZES } from '$lib/constants/status';

describe('TodoStatusIcon Component (TDD)', () => {
	it('renders pending status with hollow circle', () => {
		const rendered = render(TodoStatusIcon, {
			props: {
				status: TODO_STATUS.PENDING
			}
		});

		expect(rendered.body).toContain('<svg');
		expect(rendered.body).toContain('cx="12"');
		expect(rendered.body).toContain('cy="12"');
		expect(rendered.body).toContain('r="9"');
	});

	it('renders in_progress status with quarter pie indicator', () => {
		const rendered = render(TodoStatusIcon, {
			props: {
				status: TODO_STATUS.IN_PROGRESS
			}
		});

		expect(rendered.body).toContain('<svg');
		expect(rendered.body).toContain('d="M12 12 L12 3 A9 9 0 0 1 21 12 Z"');
	});

	it('renders done status with checkmark', () => {
		const rendered = render(TodoStatusIcon, {
			props: {
				status: TODO_STATUS.DONE
			}
		});

		expect(rendered.body).toContain('<svg');
		expect(rendered.body).toContain('d="M5 13l4 4L19 7"');
	});

	it('renders abandoned status with cross mark', () => {
		const rendered = render(TodoStatusIcon, {
			props: {
				status: TODO_STATUS.ABANDONED
			}
		});

		expect(rendered.body).toContain('<svg');
		expect(rendered.body).toContain('d="M6 18L18 6M6 6l12 12"');
	});

	it('applies default size (sm) and custom size classes correctly', () => {
		const defaultRendered = render(TodoStatusIcon, {
			props: {
				status: TODO_STATUS.DONE
			}
		});
		expect(defaultRendered.body).toContain(TODO_STATUS_ICON_SIZES.sm);

		const xsRendered = render(TodoStatusIcon, {
			props: {
				status: TODO_STATUS.DONE,
				size: 'xs'
			}
		});
		expect(xsRendered.body).toContain(TODO_STATUS_ICON_SIZES.xs);

		const lgRendered = render(TodoStatusIcon, {
			props: {
				status: TODO_STATUS.DONE,
				size: 'lg'
			}
		});
		expect(lgRendered.body).toContain(TODO_STATUS_ICON_SIZES.lg);
	});

	it('merges custom class names without conflict', () => {
		const rendered = render(TodoStatusIcon, {
			props: {
				status: TODO_STATUS.IN_PROGRESS,
				class: 'text-blue-500 custom-status-icon'
			}
		});

		expect(rendered.body).toContain('text-blue-500');
		expect(rendered.body).toContain('custom-status-icon');
	});
});
