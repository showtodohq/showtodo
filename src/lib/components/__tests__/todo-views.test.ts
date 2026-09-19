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

	it('renders TodoStreamView correctly with todo items', () => {
		const res = createMyTodosResource();
		const t = mockTodo('t1', 'pending', 'Stream Todo Test');
		todoRegistry.upsert(t);
		res.setTodoIds(['t1']);

		const rendered = render(TodoStreamView, { props: { resource: res } });
		expect(rendered.body).toContain('Stream Todo Test');
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
		// 校验列头已收敛使用 TodoStatusIcon (包含空心圆与饼图)
		expect(rendered.body).toContain('d="M12 12 L12 3 A9 9 0 0 1 21 12 Z"');
		// 校验卡片背景应用了对应分类颜色 (dev 分类对应 bg-purple-50)
		expect(rendered.body).toContain('bg-purple-50');
		// 校验底部栏状态变更按钮居右
		expect(rendered.body).toContain('Change status');
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
		// 校验日历单元格内为纯文字呈现，不渲染前导状态图标
		expect(rendered.body).not.toContain('d="M5 13l4 4L19 7"');
		// 校验移动端居中圆点指示器已渲染且呈现完成绿
		expect(rendered.body).toContain('flex sm:hidden flex-1 items-center justify-center');
		expect(rendered.body).toContain('h-1.5 w-1.5 rounded-full');
		expect(rendered.body).toContain('bg-emerald-500');
		expect(rendered.body).toContain('all completed');
		// 校验桌面端条目列表在移动端隐藏
		expect(rendered.body).toContain('hidden sm:block space-y-1');
	});

	it('renders TodoCalendarView with pending dot style when cell has active tasks', () => {
		const res = createMyTodosResource();
		const t = mockTodo('t2', 'pending', 'Active Pending Task');
		todoRegistry.upsert(t);
		res.setTodoIds(['t2']);

		const rendered = render(TodoCalendarView, { props: { resource: res } });
		expect(rendered.body).toContain('bg-zinc-900');
		expect(rendered.body).toContain('pending tasks');
		expect(rendered.body).toContain('hidden sm:inline-block');
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
