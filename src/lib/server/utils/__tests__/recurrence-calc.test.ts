import { describe, it, expect } from 'vitest';
import {
	formatSlotKey,
	calculateNextOccurrence,
	isWithinGracePeriod,
	expandVirtualOccurrences,
	type RecurrenceScheduleConfig
} from '../recurrence-calc';

describe('Recurrence Calculation Utilities (TDD)', () => {
	const TZ_SHANGHAI = 'Asia/Shanghai'; // UTC+8
	const TZ_NEW_YORK = 'America/New_York';

	describe('formatSlotKey', () => {
		it('formats daily slot as YYYY-MM-DD in author timezone', () => {
			// 2026-10-01 02:00:00 UTC = 2026-10-01 10:00:00 in Shanghai
			const date = new Date('2026-10-01T02:00:00.000Z');
			expect(formatSlotKey(date, 'daily', TZ_SHANGHAI)).toBe('2026-10-01');

			// Same UTC time in New York is 2026-09-30 22:00:00
			expect(formatSlotKey(date, 'daily', TZ_NEW_YORK)).toBe('2026-09-30');
		});

		it('formats weekdays slot as YYYY-MM-DD', () => {
			const date = new Date('2026-10-05T08:00:00.000Z');
			expect(formatSlotKey(date, 'weekdays', TZ_SHANGHAI)).toBe('2026-10-05');
		});

		it('formats weekly slot as YYYY-Www-D (year, week, weekday)', () => {
			// 2026-10-05 is Monday of Week 41 in ISO 8601
			const monday = new Date('2026-10-05T02:00:00.000Z');
			const key = formatSlotKey(monday, 'weekly', TZ_SHANGHAI);
			expect(key).toMatch(/^2026-W\d{2}-1$/);
		});

		it('formats monthly slot as YYYY-MM', () => {
			const date = new Date('2026-10-15T02:00:00.000Z');
			expect(formatSlotKey(date, 'monthly', TZ_SHANGHAI)).toBe('2026-10');
		});
	});

	describe('calculateNextOccurrence', () => {
		it('advances daily schedule by interval days and aligns to start of day in timezone', () => {
			const current = new Date('2026-10-01T00:00:00.000Z');
			const config: RecurrenceScheduleConfig = {
				frequency: 'daily',
				interval: 1,
				timezone: 'UTC'
			};
			const next = calculateNextOccurrence(current, config);
			expect(next.toISOString()).toBe('2026-10-02T00:00:00.000Z');
		});

		it('advances daily schedule created at random time (e.g. 21:00) to start of next day (00:00:00) in author timezone', () => {
			// 2026-09-30 13:00:38.944 UTC = 2026-09-30 21:00:38 in Asia/Shanghai
			const currentNight = new Date('2026-09-30T13:00:38.944Z');
			const config: RecurrenceScheduleConfig = {
				frequency: 'daily',
				interval: 1,
				timezone: TZ_SHANGHAI
			};
			const next = calculateNextOccurrence(currentNight, config);
			// Next daily occurrence MUST be 2026-10-01 00:00:00 in Asia/Shanghai -> 2026-09-30T16:00:00.000Z!
			expect(next.toISOString()).toBe('2026-09-30T16:00:00.000Z');
		});

		it('advances weekdays schedule over weekend (Friday -> Monday)', () => {
			// 2026-10-02 is Friday
			const friday = new Date('2026-10-02T01:00:00.000Z');
			const config: RecurrenceScheduleConfig = {
				frequency: 'weekdays',
				interval: 1,
				timezone: 'UTC'
			};
			const next = calculateNextOccurrence(friday, config);
			// Next should be 2026-10-05 (Monday) 00:00:00 UTC
			expect(next.toISOString()).toBe('2026-10-05T00:00:00.000Z');
		});

		it('advances weekly schedule through specified days_of_week', () => {
			// 2026-10-05 is Monday (1)
			const monday = new Date('2026-10-05T00:00:00.000Z');
			// Mon, Wed, Fri
			const config: RecurrenceScheduleConfig = {
				frequency: 'weekly',
				interval: 1,
				daysOfWeek: [1, 3, 5],
				timezone: 'UTC'
			};

			// Mon -> Wed (2026-10-07)
			const nextWed = calculateNextOccurrence(monday, config);
			expect(nextWed.toISOString()).toBe('2026-10-07T00:00:00.000Z');

			// Wed -> Fri (2026-10-09)
			const nextFri = calculateNextOccurrence(nextWed, config);
			expect(nextFri.toISOString()).toBe('2026-10-09T00:00:00.000Z');

			// Fri -> next Mon (2026-10-12)
			const nextMon = calculateNextOccurrence(nextFri, config);
			expect(nextMon.toISOString()).toBe('2026-10-12T00:00:00.000Z');
		});

		it('handles month-end clamping (Jan 31 -> Feb 28 on non-leap year)', () => {
			// 2025 is non-leap year
			const jan31 = new Date('2025-01-31T00:00:00.000Z');
			const config: RecurrenceScheduleConfig = {
				frequency: 'monthly',
				interval: 1,
				dayOfMonth: 31,
				timezone: 'UTC'
			};
			const nextFeb = calculateNextOccurrence(jan31, config);
			expect(nextFeb.toISOString()).toBe('2025-02-28T00:00:00.000Z');
		});

		it('handles month-end clamping (Jan 31 -> Feb 29 on leap year 2024)', () => {
			// 2024 is leap year
			const jan31 = new Date('2024-01-31T00:00:00.000Z');
			const config: RecurrenceScheduleConfig = {
				frequency: 'monthly',
				interval: 1,
				dayOfMonth: 31,
				timezone: 'UTC'
			};
			const nextFeb = calculateNextOccurrence(jan31, config);
			expect(nextFeb.toISOString()).toBe('2024-02-29T00:00:00.000Z');
		});
	});

	describe('isWithinGracePeriod', () => {
		const dueDate = new Date('2026-10-01T23:59:59.000Z');
		const graceHours = 4;

		it('returns true if before due date', () => {
			const check = new Date('2026-10-01T20:00:00.000Z');
			expect(isWithinGracePeriod(dueDate, check, graceHours)).toBe(true);
		});

		it('returns true if within grace window (e.g. 2 hours past due)', () => {
			// 2026-10-02 02:00:00 is within 4 hours
			const check = new Date('2026-10-02T02:00:00.000Z');
			expect(isWithinGracePeriod(dueDate, check, graceHours)).toBe(true);
		});

		it('returns false if past grace window (e.g. 5 hours past due)', () => {
			const check = new Date('2026-10-02T05:00:00.000Z');
			expect(isWithinGracePeriod(dueDate, check, graceHours)).toBe(false);
		});
	});

	describe('expandVirtualOccurrences (Calendar Virtual Projection)', () => {
		it('projects future virtual occurrences in a date window without database rows', () => {
			const rule = {
				id: 'rule-123',
				content: '每日晨跑 3 公里',
				topicHash: 'hash-run',
				frequency: 'daily' as const,
				interval: 1,
				timezone: 'UTC',
				nextRunAt: new Date('2026-10-01T07:00:00.000Z'),
				category: 'fitness'
			};

			const windowStart = new Date('2026-10-01T00:00:00.000Z');
			const windowEnd = new Date('2026-10-05T23:59:59.000Z');

			const virtualTodos = expandVirtualOccurrences([rule], windowStart, windowEnd, 'UTC');

			// Should produce 5 virtual occurrences (Oct 1, 2, 3, 4, 5)
			expect(virtualTodos.length).toBe(5);
			expect(virtualTodos[0].slotKey).toBe('2026-10-01');
			expect(virtualTodos[0].isVirtual).toBe(true);
			expect(virtualTodos[0].content).toBe('每日晨跑 3 公里');
			expect(virtualTodos[4].slotKey).toBe('2026-10-05');
		});
	});
});
