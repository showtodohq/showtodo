import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import TodoDetailCard from '../todo/TodoDetailCard.svelte';
import type { Todo } from '$lib/types/todo';

const baseTodo: Todo = {
	id: 'todo-123',
	shortId: 't123',
	content: 'Test multiplayer todo',
	authorId: 'user-author',
	topicHash: 'hash-abc',
	status: 'pending',
	category: 'dev',
	isNotePublic: true,
	note: null,
	startDate: '2026-09-19T00:00:00.000Z',
	dueDate: null,
	createdAt: '2026-09-19T10:00:00.000Z',
	updatedAt: '2026-09-19T10:00:00.000Z',
	author: {
		id: 'user-author',
		nickname: 'Author Alex',
		handle: 'alex',
		avatar: ''
	}
};

describe('TodoDetailCard Multiplayer Section Domain Logic', () => {
	it('hides multiplayer section when author has no other participants (empty state suppression)', () => {
		const rendered = render(TodoDetailCard, {
			props: {
				todo: baseTodo,
				isMine: true,
				topicParticipantCount: 1,
				hasJoined: false
			}
		});

		// Should not display multiplayer block at all
		expect(rendered.body).not.toContain('No one else yet.');
		expect(rendered.body).not.toContain("See who's doing this");
		expect(rendered.body).not.toContain('other people are also doing this todo');
	});

	it('shows multiplayer section when author has other participants', () => {
		const rendered = render(TodoDetailCard, {
			props: {
				todo: baseTodo,
				isMine: true,
				topicParticipantCount: 4,
				hasJoined: false
			}
		});

		expect(rendered.body).toContain('4');
		expect(rendered.body).toContain('other people are also doing this todo!');
		expect(rendered.body).toContain("See who's doing this →");
		expect(rendered.body).not.toContain('Mine');
	});

	it('shows Add to my list when guest has not joined even if single participant', () => {
		const rendered = render(TodoDetailCard, {
			props: {
				todo: baseTodo,
				isMine: false,
				topicParticipantCount: 1,
				hasJoined: false
			}
		});

		expect(rendered.body).toContain('No one else yet.');
		expect(rendered.body).toContain('Add to my list');
		expect(rendered.body).not.toContain('Mine');
	});

	it('shows Mine shortcut button after See who is doing this when todo is in my list with other participants and not author', () => {
		const myJoinedTodo: Todo = {
			...baseTodo,
			id: 'my-todo-456',
			shortId: 'my456',
			authorId: 'user-viewer'
		};

		const rendered = render(TodoDetailCard, {
			props: {
				todo: baseTodo,
				isMine: false,
				topicParticipantCount: 3,
				hasJoined: true,
				myJoinedTodo,
				myJoinedStatus: 'pending'
			}
		});

		// 1. In my list tag and participant count
		expect(rendered.body).toContain('In my list');
		expect(rendered.body).toContain('(3 people doing this)');

		// 2. See who's doing this link
		expect(rendered.body).toContain("See who's doing this →");

		// 3. Mine button linking to my todo detail
		expect(rendered.body).toContain('Mine');
		expect(rendered.body).toContain('href="/t/my456"');
	});

	it('does not show Mine shortcut button when guest has joined but there are no other participants', () => {
		const myJoinedTodo: Todo = {
			...baseTodo,
			id: 'my-todo-456',
			shortId: 'my456',
			authorId: 'user-viewer'
		};

		const rendered = render(TodoDetailCard, {
			props: {
				todo: baseTodo,
				isMine: false,
				topicParticipantCount: 1,
				hasJoined: true,
				myJoinedTodo,
				myJoinedStatus: 'pending'
			}
		});

		expect(rendered.body).toContain('In my list');
		// Should not show Mine shortcut when there are no other participants
		expect(rendered.body).not.toContain('Mine');
	});
});
