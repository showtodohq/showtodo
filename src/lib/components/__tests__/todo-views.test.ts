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

	it('renders TodoStreamView correctly with status tabs and search input', () => {
		const res = createMyTodosResource();
		const t = mockTodo('t1', 'pending', '流式待办测试');
		todoRegistry.upsert(t);
		res.setTodoIds(['t1']);

		const rendered = render(TodoStreamView, { props: { resource: res } });
		expect(rendered.body).toContain('流式待办测试');
		expect(rendered.body).toContain('搜索我的待办事项');
		expect(rendered.body).toContain('全部 (1)');
	});

	it('renders TodoKanbanView correctly with 4 status columns', () => {
		const res = createMyTodosResource();
		const t1 = mockTodo('t1', 'pending', '待办列任务');
		const t2 = mockTodo('t2', 'in_progress', '推进列任务');
		todoRegistry.upsertMany([t1, t2]);
		res.setTodoIds(['t1', 't2']);

		const rendered = render(TodoKanbanView, { props: { resource: res } });
		expect(rendered.body).toContain('待办');
		expect(rendered.body).toContain('进行中');
		expect(rendered.body).toContain('已完成');
		expect(rendered.body).toContain('已放弃');
		expect(rendered.body).toContain('待办列任务');
		expect(rendered.body).toContain('推进列任务');
	});

	it('renders TodoCalendarView correctly with 7-column matrix and weekday headers', () => {
		const res = createMyTodosResource();
		const t = mockTodo('t1', 'done', '日历测试待办');
		todoRegistry.upsert(t);
		res.setTodoIds(['t1']);

		const rendered = render(TodoCalendarView, { props: { resource: res } });
		expect(rendered.body).toContain('周一');
		expect(rendered.body).toContain('周日');
		expect(rendered.body).toContain('今天');
		expect(rendered.body).toContain('日历测试待办');
	});
});
