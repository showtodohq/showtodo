import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMyTodosResource } from '../use-my-todos.svelte';
import { todoRegistry } from '$lib/stores/entities/todo-registry.svelte';
import { userStore } from '$lib/stores/user.svelte';
import { api } from '$lib/services/api';
import type { Todo, TodoStatus } from '$lib/types/todo';

function mockTodo(id: string, status: TodoStatus = 'pending', content = '测试待办', dateStr = '2026-09-12'): Todo {
	return {
		id,
		shortId: id,
		topicHash: 'hash-' + id,
		content,
		note: '备注内容',
		isNotePublic: false,
		category: 'dev',
		authorId: 'user-me',
		status,
		startDate: `${dateStr}T08:00:00.000Z`,
		dueDate: null,
		createdAt: `${dateStr}T08:00:00.000Z`,
		updatedAt: `${dateStr}T08:00:00.000Z`,
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

describe('createMyTodosResource (TDD)', () => {
	beforeEach(() => {
		todoRegistry.clear();
		userStore.clearSession();
		vi.restoreAllMocks();
	});

	it('loads todos for the current user and populates registry', async () => {
		userStore.setSession({
			id: 'user-me',
			email: 'me@example.com',
			nickname: '我自己',
			handle: 'me'
		});

		const t1 = mockTodo('t1', 'pending', '实现 4 列看板');
		const t2 = mockTodo('t2', 'in_progress', '实现月日历');
		const t3 = mockTodo('t3', 'done', '实现信息流');

		vi.spyOn(api, 'getTodos').mockResolvedValueOnce({
			todos: [t1, t2, t3],
			nextCursor: null
		});

		const resource = createMyTodosResource();
		await resource.load(true);

		expect(resource.todos.length).toBe(3);
		expect(resource.totalCount).toBe(3);
		expect(resource.statusCounts.pending).toBe(1);
		expect(resource.statusCounts.in_progress).toBe(1);
		expect(resource.statusCounts.done).toBe(1);
		expect(resource.statusCounts.abandoned).toBe(0);
		expect(resource.completionRate).toBe(33);
	});

	it('correctly partitions todos into 4 kanban columns', () => {
		userStore.setSession({
			id: 'user-me',
			email: 'me@example.com',
			nickname: '我自己',
			handle: 'me'
		});

		const t1 = mockTodo('t1', 'pending', '任务 1');
		const t2 = mockTodo('t2', 'in_progress', '任务 2');
		const t3 = mockTodo('t3', 'done', '任务 3');
		const t4 = mockTodo('t4', 'abandoned', '任务 4');

		todoRegistry.upsertMany([t1, t2, t3, t4]);

		const resource = createMyTodosResource();
		resource.setTodoIds(['t1', 't2', 't3', 't4']);

		expect(resource.kanbanColumns.pending.map((t) => t.id)).toEqual(['t1']);
		expect(resource.kanbanColumns.in_progress.map((t) => t.id)).toEqual(['t2']);
		expect(resource.kanbanColumns.done.map((t) => t.id)).toEqual(['t3']);
		expect(resource.kanbanColumns.abandoned.map((t) => t.id)).toEqual(['t4']);
	});

	it('filters stream view by status tab and search query', () => {
		const t1 = mockTodo('t1', 'pending', '写前端 Svelte 代码');
		const t2 = mockTodo('t2', 'in_progress', '编写后端测试');
		const t3 = mockTodo('t3', 'done', '阅读 DDD 书籍');
		t3.category = 'study';

		todoRegistry.upsertMany([t1, t2, t3]);

		const resource = createMyTodosResource();
		resource.setTodoIds(['t1', 't2', 't3']);

		// 默认全部
		expect(resource.streamFilteredTodos.length).toBe(3);

		// 按状态筛选
		resource.streamTab = 'in_progress';
		expect(resource.streamFilteredTodos.map((t) => t.id)).toEqual(['t2']);

		// 重置状态为全部，按分类筛选
		resource.streamTab = 'all';
		resource.activeCategory = 'study';
		expect(resource.streamFilteredTodos.map((t) => t.id)).toEqual(['t3']);

		// 搜索关键词筛选
		resource.activeCategory = null;
		resource.searchQuery = '后端';
		expect(resource.streamFilteredTodos.map((t) => t.id)).toEqual(['t2']);
	});

	it('aggregates todos into monthly calendar grid correctly', () => {
		const t1 = mockTodo('t1', 'pending', '9月12日待办', '2026-09-12');
		const t2 = mockTodo('t2', 'done', '9月12日第二件事', '2026-09-12');
		const t3 = mockTodo('t3', 'pending', '9月15日待办', '2026-09-15');

		todoRegistry.upsertMany([t1, t2, t3]);

		const resource = createMyTodosResource();
		resource.setTodoIds(['t1', 't2', 't3']);
		resource.setCalendarMonth(2026, 8); // 8 represents September (0-indexed)

		const days = resource.monthCalendarDays;
		expect(days.length).toBe(35); // 2026年9月刚好跨越 5 周 (35 格)，不会多出全下个月的第 6 行多余空行

		const day12 = days.find((d) => d.isCurrentMonth && d.dayNum === 12);
		expect(day12).toBeDefined();
		expect(day12?.todos.length).toBe(2);

		const day15 = days.find((d) => d.isCurrentMonth && d.dayNum === 15);
		expect(day15).toBeDefined();
		expect(day15?.todos.length).toBe(1);
	});
});
