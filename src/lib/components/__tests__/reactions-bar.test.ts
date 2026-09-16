import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import TodoReactionsBar from '../todo/TodoReactionsBar.svelte';

describe('TodoReactionsBar domain component', () => {
	it('renders empty encouragement placeholder when no reactions exist', () => {
		const rendered = render(TodoReactionsBar, {
			props: {
				todoId: 'test-todo-1',
				reactions: { '❤️': 0, '🔥': 0 },
				myReactions: []
			}
		});

		expect(rendered.body).toContain('Be the first to cheer!');
		// 右侧仍应有原版熟悉的 ReactionButton
		expect(rendered.body).toContain('aria-label="Reaction button"');
	});

	it('renders active reaction pills with correct counts and emojis', () => {
		const rendered = render(TodoReactionsBar, {
			props: {
				todoId: 'test-todo-1',
				reactions: { '❤️': 5, '🔥': 3, '🚀': 0 },
				myReactions: ['🔥']
			}
		});

		// 包含已投票的表情及数量
		expect(rendered.body).toContain('❤️');
		expect(rendered.body).toContain('5');
		expect(rendered.body).toContain('🔥');
		expect(rendered.body).toContain('3');
		// 0 票的表情不应作为主胶囊平铺展示
		expect(rendered.body).not.toContain('🚀');
	});

	it('highlights reactions that the current user has participated in', () => {
		const rendered = render(TodoReactionsBar, {
			props: {
				todoId: 'test-todo-1',
				reactions: { '🔥': 3 },
				myReactions: ['🔥']
			}
		});

		// 当前用户投过的表情具有已表态标记/高亮 class 或 title
		expect(rendered.body).toContain('Reacted');
	});

	it('renders icon-only edit button when isMine is true and onedit is provided', () => {
		const rendered = render(TodoReactionsBar, {
			props: {
				todoId: 'test-todo-1',
				isMine: true,
				onedit: () => {}
			}
		});

		expect(rendered.body).toContain('Edit todo content');
	});

	it('does not render edit button when isMine is false', () => {
		const rendered = render(TodoReactionsBar, {
			props: {
				todoId: 'test-todo-1',
				isMine: false
			}
		});

		expect(rendered.body).not.toContain('Edit todo content');
	});
});

describe('TodoDetailCard integration with TodoReactionsBar', () => {
	it('integrates TodoReactionsBar seamlessly within TodoDetailCard', async () => {
		const TodoDetailCard = (await import('../todo/TodoDetailCard.svelte')).default;
		const mockTodo = {
			id: 'todo-uuid-1',
			shortId: 'test1234',
			topicHash: '',
			content: 'Run 5km every morning',
			note: 'For health and fitness',
			isNotePublic: true,
			category: 'fitness',
			authorId: 'user-uuid-1',
			status: 'pending' as const,
			startDate: '2026-09-11T00:00:00.000Z',
			dueDate: null,
			createdAt: '2026-09-11T00:00:00.000Z',
			updatedAt: '2026-09-11T00:00:00.000Z',
			author: {
				id: 'user-uuid-1',
				handle: 'alex',
				nickname: 'Alex',
				avatar: null
			},
			reactions: { '🔥': 4, '💪': 2 },
			myReactions: ['🔥' as const]
		};

		const rendered = render(TodoDetailCard, {
			props: {
				todo: mockTodo,
				isMine: true
			}
		});

		// 验证待办正文
		expect(rendered.body).toContain('Run 5km every morning');
		// 验证平铺表情胶囊
		expect(rendered.body).toContain('🔥');
		expect(rendered.body).toContain('4');
		expect(rendered.body).toContain('💪');
		expect(rendered.body).toContain('2');
		// 验证右侧操作区原版 ReactionButton
		expect(rendered.body).toContain('aria-label="Reaction button"');
		// 验证图标化编辑按钮存在
		expect(rendered.body).toContain('Edit todo content');
	});
});
