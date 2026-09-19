import { describe, it, expect } from 'vitest';
import TodoContent from '../todo/TodoContent.svelte';
import { render } from 'svelte/server';
import { TODO_STATUS } from '$lib/constants/status';

describe('TodoContent Component', () => {
	it('renders default size sm as p tag with active pending styling', () => {
		const rendered = render(TodoContent, {
			props: {
				content: 'Test pending todo',
				status: TODO_STATUS.PENDING
			}
		});

		expect(rendered.body).toContain('<p');
		expect(rendered.body).toContain('Test pending todo');
		expect(rendered.body).toContain('text-[15px]');
		expect(rendered.body).toContain('font-medium');
		expect(rendered.body).toContain('text-zinc-900 dark:text-zinc-100');
	});

	it('renders size lg with semantic h1 tag for detail page headline', () => {
		const rendered = render(TodoContent, {
			props: {
				content: 'Detail headline todo',
				status: TODO_STATUS.IN_PROGRESS,
				size: 'lg',
				as: 'h1'
			}
		});

		expect(rendered.body).toContain('<h1');
		expect(rendered.body).toContain('Detail headline todo');
		expect(rendered.body).toContain('text-xl sm:text-2xl');
		expect(rendered.body).toContain('font-bold');
		expect(rendered.body).toContain('text-zinc-900 dark:text-zinc-100');
	});

	it('renders completed status with line-through and muted text', () => {
		const rendered = render(TodoContent, {
			props: {
				content: 'Completed todo',
				status: TODO_STATUS.DONE,
				size: 'lg'
			}
		});

		expect(rendered.body).toContain('line-through decoration-zinc-400 dark:decoration-zinc-500');
		expect(rendered.body).toContain('text-zinc-400 dark:text-zinc-500');
		expect(rendered.body).toContain('font-normal');
	});

	it('renders abandoned status with line-through, opacity and muted text', () => {
		const rendered = render(TodoContent, {
			props: {
				content: 'Abandoned todo',
				status: TODO_STATUS.ABANDONED,
				size: 'lg'
			}
		});

		expect(rendered.body).toContain('line-through decoration-zinc-300 dark:decoration-zinc-700');
		expect(rendered.body).toContain('text-zinc-400 dark:text-zinc-500 opacity-60');
		expect(rendered.body).toContain('font-normal');
	});
});
