import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from 'svelte/server';
import CreateTodoModal from '../todo/CreateTodoModal.svelte';
import Header from '../layout/Header.svelte';
import { createTodoModalStore } from '$lib/stores/create-todo-modal.svelte';

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost:5173/')
	}
}));

describe('Header & CreateTodoModal rendering tests', () => {
	beforeEach(() => {
		createTodoModalStore.close();
	});

	it('Header renders global create todo button with hotkey hint C', () => {
		const rendered = render(Header);
		expect(rendered.body).toContain('Post');
		expect(rendered.body).toContain('Create public todo (Press C to open)');
		expect(rendered.body).toContain('C</kbd>');
	});

	it('CreateTodoModal renders properly when open in store', () => {
		createTodoModalStore.show({
			category: 'fitness',
			content: 'Run 5km every morning',
			startDate: '2026-09-20T09:00',
			dueDate: '2026-09-30T23:59'
		});

		const rendered = render(CreateTodoModal);
		expect(rendered.body).toContain('Create Public Todo');
		expect(rendered.body).toContain('Run 5km every morning');
		expect(rendered.body).toContain('Fitness');
		expect(rendered.body).toContain('Start Date');
		expect(rendered.body).toContain('Due Date');
		expect(rendered.body).not.toContain('DDL');
		expect(rendered.body).toContain('Now');
		expect(rendered.body).toContain('EOD');
		expect(rendered.body).toContain('Tmr');
		expect(rendered.body).toContain('Mon');
		expect(rendered.body).toContain('+1w');
		expect(rendered.body).toContain('Schedule');
		expect(rendered.body).not.toContain('✎');
		expect(rendered.body).toContain('Note');
		expect(rendered.body).toContain('Post');
	});
});
