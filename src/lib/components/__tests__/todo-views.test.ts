import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'svelte/server';
import TodoStreamView from '../todo/TodoStreamView.svelte';
import TodoKanbanView from '../todo/TodoKanbanView.svelte';
import TodoCalendarView from '../todo/TodoCalendarView.svelte';
import { createMyTodosResource } from '$lib/stores/resources/use-my-todos.svelte';
import { todoRegistry } from '$lib/stores/entities/todo-registry.svelte';
import type { Todo } from '$lib/types/todo';

function mockTodo(id: string, status: 'pending' | 'in_progress' | 'done' | 'abandoned' = 'pending', content = '待办项'): Todo {
	return {
		id,
		shortId: id,
		topicHash: 'hash-' + id,
		content,
		note: '测试备注',
		isNotePublic: false,
		category: 'dev',
		authorId: 'user-me',
		status,
		startDate: '2026-09-12T08:00:00.000Z',
		dueDate: null,
		createdAt: '2026-09-12T08:00:00.000Z',
		updatedAt: '2026-09-12T08:00:00.000Z',
		author: {
			id: 'user-me',
			handle: 'me',
			nickname: '我自己',
			avatar: null
		},
		reactions: {},
		myReactions: []
	};
}

describe('Todo Views (Stream, Kanban, Calendar) SSR Rendering', () => {
	beforeEach(() => {
		todoRegistry.clear();
	});

	it('renders TodoStreamView correctly with status tabs and todo items', () => {
		const res = createMyTodosResource();
		const t = mockTodo('t1', 'pending', 'Stream Todo Test');
		todoRegistry.upsert(t);
		res.setTodoIds(['t1']);

		const rendered = render(TodoStreamView, { props: { resource: res } });
		expect(rendered.body).toContain('Stream Todo Test');
		expect(rendered.body).toContain('All (1)');
	});

	it('renders TodoKanbanView correctly with 4 status columns', () => {
		const res = createMyTodosResource();
		const t1 = mockTodo('t1', 'pending', 'Pending Column Task');
		const t2 = mockTodo('t2', 'in_progress', 'Progress Column Task');
		todoRegistry.upsertMany([t1, t2]);
		res.setTodoIds(['t1', 't2']);

		const rendered = render(TodoKanbanView, { props: { resource: res } });
		expect(rendered.body).toContain('Pending');
		expect(rendered.body).toContain('In Progress');
		expect(rendered.body).toContain('Completed');
		expect(rendered.body).toContain('Abandoned');
		expect(rendered.body).toContain('Pending Column Task');
		expect(rendered.body).toContain('Progress Column Task');
	});

	it('renders TodoCalendarView correctly with 7-column matrix and weekday headers', () => {
		const res = createMyTodosResource();
		const t = mockTodo('t1', 'done', 'Calendar Test Todo');
		todoRegistry.upsert(t);
		res.setTodoIds(['t1']);

		const rendered = render(TodoCalendarView, { props: { resource: res } });
		expect(rendered.body).toContain('Mon');
		expect(rendered.body).toContain('Sun');
		expect(rendered.body).toContain('Today');
		expect(rendered.body).toContain('Calendar Test Todo');
	});

	it('renders TodoKanbanView EmptyState when no todos exist', () => {
		const res = createMyTodosResource();
		res.setTodoIds([]);

		const rendered = render(TodoKanbanView, { props: { resource: res } });
		expect(rendered.body).toContain('No todos in workbench');
	});

	it('renders TodoCalendarView month empty indicator when monthTotal is 0', () => {
		const res = createMyTodosResource();
		res.setTodoIds([]);

		const rendered = render(TodoCalendarView, { props: { resource: res } });
		expect(rendered.body).toContain('No todos this month');
	});
});
