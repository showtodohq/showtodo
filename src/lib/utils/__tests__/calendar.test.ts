import { describe, it, expect } from 'vitest';
import {
	getWeekDates,
	formatDateISO,
	formatWeekRangeText,
	formatDayHeader,
	sortTodosForCell,
	sortUsersForCalendar,
	addWeeks,
	getCalendarCellBadgeStatus
} from '../calendar';
import type { Todo } from '$lib/types/todo';
import type { UserProfile } from '$lib/types/user';

describe('calendar utils', () => {
	it('getWeekDates returns 7 days starting from Monday', () => {
		// 2026-08-26 is Wednesday
		const baseDate = new Date('2026-08-26T12:00:00');
		const week = getWeekDates(baseDate);

		expect(week).toHaveLength(7);
		expect(formatDateISO(week[0])).toBe('2026-08-24'); // Monday
		expect(formatDateISO(week[1])).toBe('2026-08-25'); // Tuesday
		expect(formatDateISO(week[2])).toBe('2026-08-26'); // Wednesday
		expect(formatDateISO(week[6])).toBe('2026-08-30'); // Sunday
	});

	it('addWeeks adds or subtracts weeks correctly', () => {
		const baseDate = new Date('2026-08-26T12:00:00');
		const nextWeek = addWeeks(baseDate, 1);
		expect(formatDateISO(nextWeek)).toBe('2026-09-02');

		const prevWeek = addWeeks(baseDate, -1);
		expect(formatDateISO(prevWeek)).toBe('2026-08-19');
	});

	it('formatWeekRangeText formats range string properly', () => {
		const week = getWeekDates(new Date('2026-08-26T12:00:00'));
		const text = formatWeekRangeText(week);
		expect(text).toBe('Aug 24 – 30, 2026');
	});

	it('formatDayHeader returns weekday info', () => {
		const date = new Date('2026-08-24T12:00:00');
		const header = formatDayHeader(date);
		expect(header.dayName).toBe('Mon');
		expect(header.dateLabel).toBe('24');
	});

	it('sortTodosForCell orders by status priority then createdAt ASC', () => {
		const todos: Todo[] = [
			{
				id: '1',
				shortId: 's1',
				topicHash: 'hash1',
				content: 'Done task',
				note: null,
				isNotePublic: true,
				category: 'dev',
				authorId: 'u1',
				status: 'done',
				startDate: '2026-08-26',
				dueDate: null,
				createdAt: '2026-08-26T10:00:00Z',
				updatedAt: '2026-08-26T10:00:00Z'
			},
			{
				id: '2',
				shortId: 's2',
				topicHash: 'hash2',
				content: 'In progress task',
				note: null,
				isNotePublic: true,
				category: 'dev',
				authorId: 'u1',
				status: 'in_progress',
				startDate: '2026-08-26',
				dueDate: null,
				createdAt: '2026-08-26T12:00:00Z',
				updatedAt: '2026-08-26T12:00:00Z'
			},
			{
				id: '3',
				shortId: 's3',
				topicHash: 'hash3',
				content: 'Pending task',
				note: null,
				isNotePublic: true,
				category: 'dev',
				authorId: 'u1',
				status: 'pending',
				startDate: '2026-08-26',
				dueDate: null,
				createdAt: '2026-08-26T08:00:00Z',
				updatedAt: '2026-08-26T08:00:00Z'
			},
			{
				id: '4',
				shortId: 's4',
				topicHash: 'hash4',
				content: 'Abandoned task',
				note: null,
				isNotePublic: true,
				category: 'dev',
				authorId: 'u1',
				status: 'abandoned',
				startDate: '2026-08-26',
				dueDate: null,
				createdAt: '2026-08-26T09:00:00Z',
				updatedAt: '2026-08-26T09:00:00Z'
			}
		];

		const sorted = sortTodosForCell(todos);
		expect(sorted.map((t) => t.id)).toEqual(['2', '3', '1', '4']);
	});

	it('sortUsersForCalendar puts current user on top and others by lastTodoUpdatedAt DESC', () => {
		const users: UserProfile[] = [
			{
				id: 'user-1',
				email: 'user1@test.com',
				handle: 'user1',
				nickname: 'User 1',
				avatar: null,
				createdAt: '2026-08-01T00:00:00Z',
				updatedAt: '2026-08-01T00:00:00Z',
				lastTodoUpdatedAt: '2026-08-20T10:00:00Z'
			},
			{
				id: 'user-2',
				email: 'user2@test.com',
				handle: 'user2',
				nickname: 'User 2',
				avatar: null,
				createdAt: '2026-08-01T00:00:00Z',
				updatedAt: '2026-08-01T00:00:00Z',
				lastTodoUpdatedAt: '2026-08-26T12:00:00Z'
			},
			{
				id: 'user-me',
				email: 'me@test.com',
				handle: 'me',
				nickname: 'Me',
				avatar: null,
				createdAt: '2026-08-01T00:00:00Z',
				updatedAt: '2026-08-01T00:00:00Z',
				lastTodoUpdatedAt: '2026-08-10T00:00:00Z'
			}
		];

		const sorted = sortUsersForCalendar(users, 'user-me');
		expect(sorted.map((u) => u.id)).toEqual(['user-me', 'user-2', 'user-1']);
	});

	describe('getCalendarCellBadgeStatus', () => {
		it('returns EMPTY for empty todo list', () => {
			expect(getCalendarCellBadgeStatus([])).toBe('EMPTY');
		});

		it('returns HAS_PENDING when there are pending or in_progress todos', () => {
			expect(getCalendarCellBadgeStatus([{ status: 'pending' }])).toBe('HAS_PENDING');
			expect(getCalendarCellBadgeStatus([{ status: 'in_progress' }, { status: 'done' }])).toBe('HAS_PENDING');
		});

		it('returns ALL_DONE when all todos are done or abandoned', () => {
			expect(getCalendarCellBadgeStatus([{ status: 'done' }])).toBe('ALL_DONE');
			expect(getCalendarCellBadgeStatus([{ status: 'done' }, { status: 'abandoned' }])).toBe('ALL_DONE');
		});
	});
});
