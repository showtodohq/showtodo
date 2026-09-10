import { describe, it, expect, vi } from 'vitest';
import {
	formatDateKey,
	calculateHeatmapLevel,
	fillTrendDays,
	fillHeatmapDays,
	getUserHeatmapStats
} from '../services/stats.service';
import type { Database } from '../db';

describe('stats.service pure functions (TDD)', () => {
	it('formatDateKey formats date correctly to YYYY-MM-DD', () => {
		const d = new Date(2026, 8, 8); // month is 0-indexed (8 = September)
		expect(formatDateKey(d)).toBe('2026-09-08');

		const d2 = new Date(2026, 0, 5); // January 5
		expect(formatDateKey(d2)).toBe('2026-01-05');
	});

	describe('calculateHeatmapLevel', () => {
		it('returns 0 for count <= 0', () => {
			expect(calculateHeatmapLevel(0, 10)).toBe(0);
			expect(calculateHeatmapLevel(-1, 10)).toBe(0);
		});

		it('handles small maxCount (<= 4) gracefully', () => {
			expect(calculateHeatmapLevel(1, 3)).toBe(1);
			expect(calculateHeatmapLevel(2, 3)).toBe(2);
			expect(calculateHeatmapLevel(3, 3)).toBe(3);
			expect(calculateHeatmapLevel(4, 3)).toBe(4);
		});

		it('calculates dynamic 4-quantile levels for larger maxCount', () => {
			const max = 20;
			// q1=5, q2=10, q3=15, q4=20
			expect(calculateHeatmapLevel(1, max)).toBe(1);
			expect(calculateHeatmapLevel(5, max)).toBe(1);
			expect(calculateHeatmapLevel(6, max)).toBe(2);
			expect(calculateHeatmapLevel(10, max)).toBe(2);
			expect(calculateHeatmapLevel(12, max)).toBe(3);
			expect(calculateHeatmapLevel(15, max)).toBe(3);
			expect(calculateHeatmapLevel(18, max)).toBe(4);
			expect(calculateHeatmapLevel(20, max)).toBe(4);
		});
	});

	describe('fillTrendDays', () => {
		it('fills missing days with 0 and keeps existing values', () => {
			const fixedEnd = new Date(2026, 8, 8); // 2026-09-08
			const rawMap = new Map<string, { created: number; completed: number }>();
			rawMap.set('2026-09-08', { created: 5, completed: 3 });
			rawMap.set('2026-09-06', { created: 2, completed: 1 });

			const days = fillTrendDays(rawMap, 3, fixedEnd);

			expect(days).toHaveLength(3);
			expect(days[0]).toEqual({ date: '2026-09-06', created: 2, completed: 1 });
			expect(days[1]).toEqual({ date: '2026-09-07', created: 0, completed: 0 });
			expect(days[2]).toEqual({ date: '2026-09-08', created: 5, completed: 3 });
		});
	});

	describe('fillHeatmapDays', () => {
		it('generates continuous days with correct levels, totals, and maxDayCount', () => {
			const fixedEnd = new Date(2026, 8, 8); // 2026-09-08
			const rawMap = new Map<string, { created: number; completed: number; notes: number }>();
			rawMap.set('2026-09-08', { created: 4, completed: 6, notes: 0 }); // total 10
			rawMap.set('2026-09-07', { created: 1, completed: 0, notes: 1 }); // total 2

			const result = fillHeatmapDays(rawMap, 3, fixedEnd);

			expect(result.days).toHaveLength(3);
			expect(result.startDate).toBe('2026-09-06');
			expect(result.endDate).toBe('2026-09-08');
			expect(result.totalActivities).toBe(12);
			expect(result.maxDayCount).toBe(10);

			// 2026-09-06 has 0 activities => level 0
			expect(result.days[0].date).toBe('2026-09-06');
			expect(result.days[0].count).toBe(0);
			expect(result.days[0].level).toBe(0);

			// 2026-09-07 has 2 activities
			expect(result.days[1].date).toBe('2026-09-07');
			expect(result.days[1].count).toBe(2);
			expect(result.days[1].level).toBeGreaterThan(0);

			// 2026-09-08 has 10 activities (max) => level 4
			expect(result.days[2].date).toBe('2026-09-08');
			expect(result.days[2].count).toBe(10);
			expect(result.days[2].level).toBe(4);
		});

		it('supports full year 365 days generation ending strictly on endDate', () => {
			const fixedEnd = new Date(2026, 8, 9); // 2026-09-09
			const rawMap = new Map<string, { created: number; completed: number; notes: number }>();
			const result = fillHeatmapDays(rawMap, 365, fixedEnd);

			expect(result.days).toHaveLength(365);
			expect(result.endDate).toBe('2026-09-09');
			expect(result.days[result.days.length - 1].date).toBe('2026-09-09');
			// Strictly no days after 2026-09-09
			expect(result.days.every((d) => d.date <= '2026-09-09')).toBe(true);
		});
		it('supports timezone-aware days generation ending strictly on local endDate', () => {
			// At 2026-09-10T16:05:00Z:
			// In Asia/Shanghai it is already 2026-09-11
			// In UTC it is 2026-09-10
			const fixedInstant = new Date('2026-09-10T16:05:00.000Z');
			const rawMap = new Map<string, { created: number; completed: number; notes: number }>();
			rawMap.set('2026-09-11', { created: 1, completed: 1, notes: 0 });

			const resultShanghai = fillHeatmapDays(rawMap, 3, fixedInstant, 'Asia/Shanghai');
			expect(resultShanghai.endDate).toBe('2026-09-11');
			expect(resultShanghai.days.map((d) => d.date)).toEqual(['2026-09-09', '2026-09-10', '2026-09-11']);
			expect(resultShanghai.days[2].count).toBe(2);

			const resultUtc = fillHeatmapDays(rawMap, 3, fixedInstant, 'UTC');
			expect(resultUtc.endDate).toBe('2026-09-10');
			expect(resultUtc.days.map((d) => d.date)).toEqual(['2026-09-08', '2026-09-09', '2026-09-10']);
		});
	});

	describe('getUserHeatmapStats (TDD)', () => {
		it('aggregates user specific activities correctly with timezone parameter', async () => {
			const mockExecute = vi.fn().mockResolvedValue([
				{ day: '2026-09-08', created: 2, completed: 1, notes: 0 },
				{ day: '2026-09-07', created: 0, completed: 3, notes: 1 }
			]);
			const mockDb = {
				execute: mockExecute
			} as unknown as Database;

			const result = await getUserHeatmapStats(mockDb, 'user-123', 7, 'Asia/Shanghai');

			expect(mockExecute).toHaveBeenCalled();
			expect(result.days).toHaveLength(7);
			expect(result.totalActivities).toBe(7);
			const day08 = result.days.find((d) => d.date === '2026-09-08');
			expect(day08).toBeDefined();
			expect(day08?.created).toBe(2);
			expect(day08?.completed).toBe(1);
			expect(day08?.notes).toBe(0);

			const day07 = result.days.find((d) => d.date === '2026-09-07');
			expect(day07).toBeDefined();
			expect(day07?.completed).toBe(3);
			expect(day07?.notes).toBe(1);
		});
	});
});
