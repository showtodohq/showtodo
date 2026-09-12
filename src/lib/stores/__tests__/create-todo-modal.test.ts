import { describe, it, expect, beforeEach } from 'vitest';
import { createTodoModalStore } from '$lib/stores/create-todo-modal.svelte';

describe('createTodoModalStore', () => {
	beforeEach(() => {
		createTodoModalStore.close();
	});

	it('should have initial closed state', () => {
		expect(createTodoModalStore.open).toBe(false);
		expect(createTodoModalStore.initialCategory).toBeNull();
		expect(createTodoModalStore.initialContent).toBe('');
		expect(createTodoModalStore.initialStartDate).toBeNull();
		expect(createTodoModalStore.initialDueDate).toBeNull();
	});

	it('should open modal with default values', () => {
		createTodoModalStore.show();
		expect(createTodoModalStore.open).toBe(true);
		expect(createTodoModalStore.initialCategory).toBeNull();
		expect(createTodoModalStore.initialContent).toBe('');
		expect(createTodoModalStore.initialStartDate).toBeNull();
		expect(createTodoModalStore.initialDueDate).toBeNull();
	});

	it('should open modal with prefilled options', () => {
		createTodoModalStore.show({
			category: 'dev',
			content: '重构全局弹窗',
			startDate: '2026-09-20',
			dueDate: '2026-09-30'
		});
		expect(createTodoModalStore.open).toBe(true);
		expect(createTodoModalStore.initialCategory).toBe('dev');
		expect(createTodoModalStore.initialContent).toBe('重构全局弹窗');
		expect(createTodoModalStore.initialStartDate).toBe('2026-09-20');
		expect(createTodoModalStore.initialDueDate).toBe('2026-09-30');
	});

	it('should close modal and reset prefilled options', () => {
		createTodoModalStore.show({
			category: 'fitness',
			content: '跑步 5km',
			startDate: '2026-09-20',
			dueDate: '2026-10-01'
		});
		expect(createTodoModalStore.open).toBe(true);

		createTodoModalStore.close();
		expect(createTodoModalStore.open).toBe(false);
		expect(createTodoModalStore.initialCategory).toBeNull();
		expect(createTodoModalStore.initialContent).toBe('');
		expect(createTodoModalStore.initialStartDate).toBeNull();
		expect(createTodoModalStore.initialDueDate).toBeNull();
	});
});
