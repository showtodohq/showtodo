import { describe, it, expect, vi } from 'vitest';
import { render } from 'svelte/server';
import TodoDetailCard from '../todo/TodoDetailCard.svelte';
import type { Todo } from '$lib/types/todo';

const mockDetailTodo: Todo = {
	id: 'todo-999',
	shortId: 't999',
	content: 'Original Todo Title',
	authorId: 'user-author',
	topicHash: 'hash-xyz',
	status: 'pending',
	category: 'dev',
	isNotePublic: true,
	note: 'Original Note Content',
	startDate: '2026-09-27T09:00:00.000Z',
	dueDate: '2026-09-28T18:00:00.000Z',
	createdAt: '2026-09-27T08:00:00.000Z',
	updatedAt: '2026-09-27T08:00:00.000Z',
	author: {
		id: 'user-author',
		nickname: 'Alice Developer',
		handle: 'alice',
		avatar: null
	}
};

describe('TodoDetailCard Category Display & In-Place Editing', () => {
	it('renders category badge when category is present in browse mode', () => {
		const rendered = render(TodoDetailCard, {
			props: {
				todo: mockDetailTodo,
				isMine: true
			}
		});

		expect(rendered.body).toContain('Dev');
		expect(rendered.body).toContain('Original Todo Title');
		expect(rendered.body).toContain('Original Note Content');
	});

	it('renders "No category" placeholder when category is not set in browse mode', () => {
		const todoWithoutCategory: Todo = {
			...mockDetailTodo,
			category: null
		};

		const rendered = render(TodoDetailCard, {
			props: {
				todo: todoWithoutCategory,
				isMine: false
			}
		});

		expect(rendered.body).toContain('No category');
	});
});
