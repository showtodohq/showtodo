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
		expect(rendered.body).toContain('发布新待办');
		expect(rendered.body).toContain('新建公开待办 (按 C 唤起)');
		expect(rendered.body).toContain('C</kbd>');
	});

	it('CreateTodoModal renders properly when open in store', () => {
		createTodoModalStore.show({
			category: 'fitness',
			content: '每天晨跑 5km',
			startDate: '2026-09-20T09:00',
			dueDate: '2026-09-30T23:59'
		});

		const rendered = render(CreateTodoModal);
		expect(rendered.body).toContain('发起公开待办');
		expect(rendered.body).toContain('每天晨跑 5km');
		expect(rendered.body).toContain('健身');
		expect(rendered.body).toContain('开始时间');
		expect(rendered.body).toContain('截止时间');
		expect(rendered.body).not.toContain('DDL');
		expect(rendered.body).toContain('Now');
		expect(rendered.body).toContain('EOD');
		expect(rendered.body).toContain('Tmr');
		expect(rendered.body).toContain('Mon');
		expect(rendered.body).toContain('+1w');
		expect(rendered.body).toContain('起止时间');
		expect(rendered.body).not.toContain('✎');
		expect(rendered.body).toContain('备注');
		expect(rendered.body).toContain('发布');
	});
});
