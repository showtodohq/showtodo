import { describe, it, expect, beforeEach } from 'vitest';
import { todoRegistry } from '../todo-registry.svelte';
import type { Todo } from '$lib/types/todo';

function mockTodo(id: string, shortId?: string, content = '测试待办'): Todo {
	return {
		id,
		shortId: shortId || id,
		topicHash: 'hash-1',
		content,
		note: null,
		isNotePublic: true,
		category: 'study',
		authorId: 'user-1',
		status: 'pending',
		startDate: '2026-09-04T12:00:00.000Z',
		dueDate: null,
		createdAt: '2026-09-04T12:00:00.000Z',
		updatedAt: '2026-09-04T12:00:00.000Z',
		author: {
			id: 'user-1',
			handle: 'user1',
			nickname: '测试用户',
			avatar: null
		},
		reactions: { '❤️': 0, '👍': 0, '🔥': 0, '💪': 0, '👏': 0, '🚀': 0, '🎉': 0, '👀': 0 },
		myReactions: []
	};
}

describe('TodoRegistry (Normalized Entity Cache)', () => {
	beforeEach(() => {
		todoRegistry.clear();
	});

	it('should upsert and retrieve entity by ID', () => {
		const todo = mockTodo('uuid-1');
		todoRegistry.upsert(todo);

		const retrieved = todoRegistry.get('uuid-1');
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe('uuid-1');
		expect(retrieved?.content).toBe('测试待办');
	});

	it('should retrieve entity by shortId', () => {
		const todo = mockTodo('uuid-2', 'short-2');
		todoRegistry.upsert(todo);

		const retrievedByShortId = todoRegistry.get('short-2');
		expect(retrievedByShortId).toBeDefined();
		expect(retrievedByShortId?.id).toBe('uuid-2');
	});

	it('should preserve reference and merge properties on re-upsert', () => {
		const todo = mockTodo('uuid-3', 'short-3', '原始标题');
		const firstRef = todoRegistry.upsert(todo);

		const updatedTodo = {
			...todo,
			content: '更新后标题',
			status: 'done' as const
		};
		const secondRef = todoRegistry.upsert(updatedTodo);

		expect(firstRef).toBe(secondRef); // 必须是同一个引用，确保响应式稳定
		expect(firstRef.content).toBe('更新后标题');
		expect(firstRef.status).toBe('done');
	});

	it('should mutate entity in place', () => {
		const todo = mockTodo('uuid-4');
		todoRegistry.upsert(todo);

		const success = todoRegistry.mutate('uuid-4', (item) => {
			item.status = 'in_progress';
		});

		expect(success).toBe(true);
		expect(todoRegistry.get('uuid-4')?.status).toBe('in_progress');
	});

	it('should replace temporary entity with authoritative entity', () => {
		const temp = mockTodo('temp-123', 'temp-123', '临时待办');
		todoRegistry.upsert(temp);

		const real = mockTodo('real-uuid-456', 'real-short-789', '真实待办');
		todoRegistry.replace('temp-123', real);

		expect(todoRegistry.get('temp-123')).toBeUndefined();
		expect(todoRegistry.get('real-uuid-456')).toBeDefined();
		expect(todoRegistry.get('real-short-789')).toBeDefined();
	});
});
