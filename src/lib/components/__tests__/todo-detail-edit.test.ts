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

	it('renders StreakBadge and pause button when todo is recurring in browse mode', () => {
		const recurringTodo: Todo = {
			...mockDetailTodo,
			recurringRuleId: 'rule-abc',
			cycleIndex: 3,
			recurringRule: {
				id: 'rule-abc',
				frequency: 'daily',
				interval: 1,
				currentStreak: 5,
				maxStreak: 10,
				status: 'active'
			}
		};

		const rendered = render(TodoDetailCard, {
			props: {
				todo: recurringTodo,
				isMine: true
			}
		});

		expect(rendered.body).toContain('#3');
		expect(rendered.body).toContain('5');
		expect(rendered.body).toContain('streak');
		expect(rendered.body).toContain('Pause');
	});

	it('renders recurring deletion scope options in delete modal when todo is recurring', () => {
		const recurringTodo: Todo = {
			...mockDetailTodo,
			recurringRuleId: 'rule-abc',
			cycleIndex: 3,
			recurringRule: {
				id: 'rule-abc',
				frequency: 'daily',
				interval: 1,
				currentStreak: 5,
				maxStreak: 10,
				status: 'active'
			}
		};

		const rendered = render(TodoDetailCard, {
			props: {
				todo: recurringTodo,
				isMine: true,
				initialShowDeleteModal: true
			}
		});

		expect(rendered.body).toContain('This todo belongs to a recurring series');
		expect(rendered.body).toContain('This occurrence only');
		expect(rendered.body).toContain('Entire recurring series');
	});

	it('renders recurrence rule configuration section in edit mode when todo is recurring', () => {
		const recurringTodo: Todo = {
			...mockDetailTodo,
			recurringRuleId: 'rule-abc',
			cycleIndex: 3,
			recurringRule: {
				id: 'rule-abc',
				frequency: 'daily',
				interval: 1,
				currentStreak: 5,
				maxStreak: 10,
				status: 'active',
				endCondition: 'never'
			}
		};

		const rendered = render(TodoDetailCard, {
			props: {
				todo: recurringTodo,
				isMine: true,
				initialEditing: true
			}
		});

		// 周期规则状态与提示
		expect(rendered.body).toContain('Recurring Habit Linked');
		expect(rendered.body).toContain('Repeat (Recurring Habit)');
		expect(rendered.body).toContain('Frequency');
		expect(rendered.body).toContain('Daily');
		expect(rendered.body).toContain('Weekly');
		expect(rendered.body).toContain('Monthly');
		expect(rendered.body).toContain('End condition');
		expect(rendered.body).toContain('Save Changes');
	});

	it('renders weekday selection when recurring frequency is weekly in edit mode', () => {
		const weeklyTodo: Todo = {
			...mockDetailTodo,
			recurringRuleId: 'rule-weekly',
			cycleIndex: 1,
			recurringRule: {
				id: 'rule-weekly',
				frequency: 'weekly',
				interval: 1,
				daysOfWeek: [1, 3, 5],
				currentStreak: 2,
				maxStreak: 2,
				status: 'active',
				endCondition: 'never'
			}
		};

		const rendered = render(TodoDetailCard, {
			props: {
				todo: weeklyTodo,
				isMine: true,
				initialEditing: true
			}
		});

		expect(rendered.body).toContain('Repeat on');
		expect(rendered.body).toContain('Monday');
		expect(rendered.body).toContain('Wednesday');
		expect(rendered.body).toContain('Friday');
	});

	it('renders recurrence configuration section in edit mode for non-recurring todo to allow upgrading', () => {
		const nonRecurringTodo: Todo = {
			...mockDetailTodo,
			recurringRuleId: null,
			recurringRule: null
		};

		const rendered = render(TodoDetailCard, {
			props: {
				todo: nonRecurringTodo,
				isMine: true,
				initialEditing: true
			}
		});

		expect(rendered.body).toContain('Repeat (Recurring Habit)');
		expect(rendered.body).not.toContain('Recurring Habit Linked');
	});
});
