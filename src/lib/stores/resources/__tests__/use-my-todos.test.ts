import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMyTodosResource } from '../use-my-todos.svelte';
import { todoRegistry } from '$lib/stores/entities/todo-registry.svelte';
import { userProfileRegistry } from '$lib/stores/entities/user-registry.svelte';
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
		userProfileRegistry.clear();
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

	it('loads public todos for a specific targetHandle and sets isMe to false for spectators', async () => {
		// 访问者登录为 user-viewer
		userStore.setSession({
			id: 'user-viewer',
			email: 'viewer@example.com',
			nickname: '访客',
			handle: 'viewer'
		});

		// 模拟目标用户 alex
		vi.spyOn(api, 'getUserById').mockResolvedValueOnce({
			user: {
				id: 'user-alex',
				handle: 'alex_dev',
				nickname: 'Alex',
				avatar: null,
				createdAt: '2026-01-01',
				updatedAt: '2026-01-01'
			}
		});

		const alexTodo = mockTodo('alex-1', 'in_progress', 'Alex 的公开待办');
		alexTodo.authorId = 'user-alex';
		vi.spyOn(api, 'getTodos').mockResolvedValueOnce({
			todos: [alexTodo],
			nextCursor: null
		});

		const resource = createMyTodosResource('alex_dev');
		await resource.load();

		expect(resource.targetUser?.handle).toBe('alex_dev');
		expect(resource.isMe).toBe(false);
		expect(resource.todos.length).toBe(1);
		expect(resource.todos[0].content).toBe('Alex 的公开待办');
	});

	it('bypasses api.getUserById and sets isMe to true when targetHandle matches current logged-in user', async () => {
		userStore.setSession({
			id: 'user-alex',
			email: 'alex@example.com',
			nickname: 'Alex',
			handle: 'alex_dev'
		});

		const getUserByIdSpy = vi.spyOn(api, 'getUserById');
		vi.spyOn(api, 'getTodos').mockResolvedValueOnce({
			todos: [],
			nextCursor: null
		});

		const resource = createMyTodosResource('alex_dev');
		await resource.load();

		// 断言完全不发起 getUserById 请求，直接短路复用 userStore
		expect(getUserByIdSpy).not.toHaveBeenCalled();
		expect(resource.targetUser?.handle).toBe('alex_dev');
		expect(resource.isMe).toBe(true);
	});

	it('bypasses api.getUserById when target user is already cached in userProfileRegistry', async () => {
		const cachedUser = {
			id: 'user-bob',
			handle: 'bob_dev',
			nickname: 'Bob',
			avatar: null,
			createdAt: '2026-01-01',
			updatedAt: '2026-01-01'
		};
		userProfileRegistry.upsertProfile(cachedUser);

		const getUserByIdSpy = vi.spyOn(api, 'getUserById');
		vi.spyOn(api, 'getTodos').mockResolvedValueOnce({
			todos: [],
			nextCursor: null
		});

		const resource = createMyTodosResource('bob_dev');
		await resource.load();

		expect(getUserByIdSpy).not.toHaveBeenCalled();
		expect(resource.targetUser?.id).toBe('user-bob');
		expect(resource.targetUser?.handle).toBe('bob_dev');
	});

	it('persists todos and instantly hydrates when user navigates away and returns', async () => {
		userStore.setSession({
			id: 'user-alex',
			email: 'alex@example.com',
			nickname: 'Alex',
			handle: 'alex_dev'
		});

		const t1 = mockTodo('t1', 'pending', '真实待办');
		t1.authorId = 'user-alex';

		vi.spyOn(api, 'getTodos').mockResolvedValueOnce({
			todos: [t1],
			nextCursor: null
		});

		// 1. 用户首次进入 Todolist 页面
		const page1Resource = createMyTodosResource('alex_dev');
		await page1Resource.load();
		expect(page1Resource.todos.length).toBe(1);

		// 2. 用户进入详情页并返回 Todolist 页面 (组件重新挂载，重新实例化)
		const page2Resource = createMyTodosResource('alex_dev');

		// 必须 0ms 瞬间恢复，绝不能为 loading: true 或空列表！
		expect(page2Resource.loading).toBe(false);
		expect(page2Resource.todos.length).toBe(1);
		expect(page2Resource.todos[0].content).toBe('真实待办');
	});

	it('instantly hydrates from userProfileRegistry cache on creation (0ms initial render)', () => {
		const cachedUser = {
			id: 'user-alex',
			handle: 'alex_dev',
			nickname: 'Alex',
			avatar: null,
			createdAt: '2026-01-01',
			updatedAt: '2026-01-01'
		};
		const t1 = mockTodo('t1', 'pending', '已缓存的任务');
		t1.authorId = 'user-alex';

		userProfileRegistry.upsertProfile(cachedUser);
		todoRegistry.upsertMany([t1]);
		userProfileRegistry.setUserTodoIds('alex_dev', ['t1']);

		// 实例化阶段，未调用 load() 之前
		const resource = createMyTodosResource('alex_dev');

		expect(resource.loading).toBe(false);
		expect(resource.targetUser?.handle).toBe('alex_dev');
		expect(resource.todos.length).toBe(1);
		expect(resource.todos[0].content).toBe('已缓存的任务');
	});

	it('performs SWR revalidation without setting loading to true when cached data exists', async () => {
		const cachedUser = {
			id: 'user-alex',
			handle: 'alex_dev',
			nickname: 'Alex',
			avatar: null,
			createdAt: '2026-01-01',
			updatedAt: '2026-01-01'
		};
		const t1 = mockTodo('t1', 'pending', '已有任务');
		t1.authorId = 'user-alex';

		userProfileRegistry.upsertProfile(cachedUser);
		todoRegistry.upsertMany([t1]);
		userProfileRegistry.setUserTodoIds('alex_dev', ['t1']);

		const resource = createMyTodosResource('alex_dev');
		expect(resource.loading).toBe(false);

		// 模拟后台更新返回了包含新任务的最新列表
		const t2 = mockTodo('t2', 'done', '新任务');
		t2.authorId = 'user-alex';

		let resolveGetTodos: (res: any) => void;
		const getTodosPromise = new Promise((resolve) => {
			resolveGetTodos = resolve;
		});

		vi.spyOn(api, 'getUserById').mockResolvedValueOnce({ user: cachedUser });
		vi.spyOn(api, 'getTodos').mockReturnValueOnce(getTodosPromise as any);

		const loadPromise = resource.load();

		// 请求在途时：loading 必须保持为 false（避免白屏/菊花），而 isRevalidating 为 true
		expect(resource.loading).toBe(false);
		expect(resource.isRevalidating).toBe(true);

		// 模拟接口响应完成
		resolveGetTodos!({
			todos: [t1, t2],
			nextCursor: null
		});
		await loadPromise;

		expect(resource.loading).toBe(false);
		expect(resource.isRevalidating).toBe(false);
		expect(resource.todos.length).toBe(2);
	});

	it('sets loading to true when no cache exists (cold start)', async () => {
		const resource = createMyTodosResource('non_cached_user');
		expect(resource.loading).toBe(true);

		vi.spyOn(api, 'getUserById').mockResolvedValueOnce({
			user: {
				id: 'user-new',
				handle: 'non_cached_user',
				nickname: 'Newbie',
				avatar: null,
				createdAt: '2026-01-01',
				updatedAt: '2026-01-01'
			}
		});
		vi.spyOn(api, 'getTodos').mockResolvedValueOnce({
			todos: [],
			nextCursor: null
		});

		await resource.load();
		expect(resource.loading).toBe(false);
		expect(resource.isRevalidating).toBe(false);
	});

	it('writes fetched todos and user profile back to userProfileRegistry after load', async () => {
		const user = {
			id: 'user-bob',
			handle: 'bob_the_builder',
			nickname: 'Bob',
			avatar: null,
			createdAt: '2026-01-01',
			updatedAt: '2026-01-01'
		};
		const t1 = mockTodo('bob-t1', 'in_progress', '建造工棚');
		t1.authorId = 'user-bob';

		vi.spyOn(api, 'getUserById').mockResolvedValueOnce({ user });
		vi.spyOn(api, 'getTodos').mockResolvedValueOnce({
			todos: [t1],
			nextCursor: null
		});

		const resource = createMyTodosResource('bob_the_builder');
		await resource.load();

		// 验证是否回写到了全局单一信源 userProfileRegistry
		expect(userProfileRegistry.getProfile('bob_the_builder')?.nickname).toBe('Bob');
		expect(userProfileRegistry.getUserTodoIds('bob_the_builder')).toEqual(['bob-t1']);
		expect(userProfileRegistry.getUserTodoIds('user-bob')).toEqual(['bob-t1']);
	});
});
