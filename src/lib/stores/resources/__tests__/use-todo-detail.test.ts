import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTodoDetailResource } from '../use-todo-detail.svelte';
import { todoRegistry } from '$lib/stores/entities/todo-registry.svelte';
import { userStore } from '$lib/stores/user.svelte';
import { todayStore } from '$lib/stores/today.svelte';
import { todoMutations } from '$lib/stores/mutations.svelte';
import { toast } from '$lib/stores/toast.svelte';
import { api } from '$lib/services/api';
import type { Todo } from '$lib/types/todo';

function mockTodo(id: string, authorId = 'other-user', content = '坚持每天阅读30分钟'): Todo {
	return {
		id,
		shortId: id,
		topicHash: 'hash-read-30',
		content,
		note: '读完写笔记',
		isNotePublic: true,
		category: 'study',
		authorId,
		status: 'pending',
		startDate: '2026-09-05T00:00:00.000Z',
		dueDate: null,
		createdAt: '2026-09-05T00:00:00.000Z',
		updatedAt: '2026-09-05T00:00:00.000Z',
		topicParticipantCount: 1,
		author: {
			id: authorId,
			handle: authorId === 'user-me' ? 'me_handle' : 'other_handle',
			nickname: authorId === 'user-me' ? '我的昵称' : '他人昵称',
			avatar: null
		},
		reactions: { '❤️': 0, '👍': 0, '🔥': 0, '💪': 0, '👏': 0, '🚀': 0, '🎉': 0, '👀': 0 },
		myReactions: []
	};
}

describe('use-todo-detail resource (Multiplayer / Join Topic)', () => {
	beforeEach(() => {
		todoRegistry.clear();
		userStore.clearSession();
		todayStore.todayTodoIds = [];
		vi.restoreAllMocks();
	});

	it('identifies isMine = false and hasJoined = false for other user todo initially', () => {
		userStore.setSession({
			id: 'user-me',
			email: 'me@example.com',
			nickname: '我自己',
			handle: 'me'
		});

		const otherTodo = mockTodo('todo-1', 'user-other', '坚持早起锻炼');
		otherTodo.topicParticipantCount = 1;
		todoRegistry.upsert(otherTodo);

		const detail = createTodoDetailResource('todo-1');

		expect(detail.isMine).toBe(false);
		expect(detail.hasJoined).toBe(false);
		expect(detail.myJoinedTodo).toBeUndefined();
		expect(detail.topicParticipantCount).toBe(1);
	});

	it('detects hasJoined = true and returns myJoinedTodo if current user has joined same topic', () => {
		userStore.setSession({
			id: 'user-me',
			email: 'me@example.com',
			nickname: '我自己',
			handle: 'me'
		});

		const otherTodo = mockTodo('todo-1', 'user-other', '坚持早起锻炼');
		otherTodo.topicParticipantCount = 2;
		todoRegistry.upsert(otherTodo);

		// 当前用户也参与了相同内容的待办
		const myTodo = mockTodo('todo-me-1', 'user-me', '坚持早起锻炼');
		todoRegistry.upsert(myTodo);
		todayStore.insertTop(myTodo.id);

		const detail = createTodoDetailResource('todo-1');

		expect(detail.isMine).toBe(false);
		expect(detail.hasJoined).toBe(true);
		expect(detail.myJoinedTodo).toBeDefined();
		expect(detail.myJoinedTodo?.id).toBe('todo-me-1');
	});

	it('optimistically increments topicParticipantCount when handleJoinTopic succeeds', async () => {
		userStore.setSession({
			id: 'user-me',
			email: 'me@example.com',
			nickname: '我自己',
			handle: 'me'
		});

		const otherTodo = mockTodo('todo-1', 'user-other', '坚持早起锻炼');
		otherTodo.topicParticipantCount = 1;
		todoRegistry.upsert(otherTodo);

		const detail = createTodoDetailResource('todo-1');
		expect(detail.topicParticipantCount).toBe(1);

		const createdMyTodo = mockTodo('todo-me-created', 'user-me', '坚持早起锻炼');
		const joinSpy = vi.spyOn(todoMutations, 'joinTopic').mockImplementation(async () => {
			todoRegistry.upsert(createdMyTodo);
			todayStore.insertTop(createdMyTodo.id);
			return createdMyTodo;
		});

		await detail.handleJoinTopic();

		expect(joinSpy).toHaveBeenCalledWith({
			content: otherTodo.content,
			category: otherTodo.category
		});
		expect(detail.topicParticipantCount).toBe(2);
		expect(detail.hasJoined).toBe(true);
		expect(detail.myJoinedTodo?.id).toBe('todo-me-created');
	});

	it('rolls back topicParticipantCount if handleJoinTopic fails', async () => {
		userStore.setSession({
			id: 'user-me',
			email: 'me@example.com',
			nickname: '我自己',
			handle: 'me'
		});

		const otherTodo = mockTodo('todo-1', 'user-other', '坚持早起锻炼');
		otherTodo.topicParticipantCount = 1;
		todoRegistry.upsert(otherTodo);

		const detail = createTodoDetailResource('todo-1');
		expect(detail.topicParticipantCount).toBe(1);

		vi.spyOn(todoMutations, 'joinTopic').mockRejectedValue(new Error('Network error'));
		const toastErrorSpy = vi.spyOn(toast, 'error');

		await detail.handleJoinTopic();

		expect(detail.topicParticipantCount).toBe(1);
		expect(detail.hasJoined).toBe(false);
		expect(toastErrorSpy).toHaveBeenCalled();
	});

	it('prompts user to set email if unauthenticated when handleJoinTopic is called', async () => {
		const otherTodo = mockTodo('todo-1', 'user-other', '坚持早起锻炼');
		todoRegistry.upsert(otherTodo);

		const detail = createTodoDetailResource('todo-1');
		const toastInfoSpy = vi.spyOn(toast, 'info');

		await detail.handleJoinTopic();

		expect(toastInfoSpy).toHaveBeenCalledWith('请先点击右上角头像绑定邮箱后再加入');
		expect(detail.topicParticipantCount).toBe(1);
	});

	it('delegates handleToggleMyStatus to todoMutations.toggleStatus with myJoinedTodo', async () => {
		userStore.setSession({
			id: 'user-me',
			email: 'me@example.com',
			nickname: '我自己',
			handle: 'me'
		});

		const otherTodo = mockTodo('todo-1', 'user-other', '坚持早起锻炼');
		todoRegistry.upsert(otherTodo);

		const myTodo = mockTodo('todo-me-1', 'user-me', '坚持早起锻炼');
		todoRegistry.upsert(myTodo);
		todayStore.insertTop(myTodo.id);

		const detail = createTodoDetailResource('todo-1');
		const toggleSpy = vi.spyOn(todoMutations, 'toggleStatus').mockResolvedValue();

		await detail.handleToggleMyStatus('done');

		expect(toggleSpy).toHaveBeenCalledWith('todo-me-1', 'done', undefined, myTodo);
	});

	it('detects hasJoined = true and correctly sets myJoinedTodo when API returns myJoinedTodo (e.g. on direct navigation or page refresh with empty local store)', async () => {
		userStore.setSession({
			id: 'user-me',
			email: 'me@example.com',
			nickname: '我自己',
			handle: 'me'
		});

		// 模拟今日 store 完全为空（直接打开详情页）
		todayStore.todayTodoIds = [];

		const otherTodo = mockTodo('todo-1', 'user-other', '坚持早起锻炼');
		otherTodo.topicParticipantCount = 2;
		otherTodo.myJoinedTodo = {
			id: 'todo-me-server-1',
			shortId: 'short-me-1',
			status: 'in_progress'
		};

		vi.spyOn(api, 'getTodoById').mockResolvedValue({ todo: otherTodo });

		const detail = createTodoDetailResource();
		await detail.load('todo-1');

		expect(api.getTodoById).toHaveBeenCalledWith('todo-1', 'user-me');
		expect(detail.isMine).toBe(false);
		expect(detail.hasJoined).toBe(true);
		expect(detail.myJoinedTodo).toBeDefined();
		expect(detail.myJoinedTodo?.id).toBe('todo-me-server-1');
		expect(detail.myJoinedTodo?.status).toBe('in_progress');
	});
});
