import { describe, it, expect } from 'vitest';
import {
	formatDate,
	formatRelativeTime,
	formatShortDate,
	formatScheduleRange,
	truncate,
	getLocalDayAsUtcRange
} from '../format';

describe('format utilities', () => {
	it('formats short date correctly', () => {
		expect(formatShortDate('2026-09-01T12:00:00Z')).toBe('09-01');
		expect(formatShortDate('invalid')).toBe('');
	});

	it('formats schedule range correctly', () => {
		expect(formatScheduleRange('2026-09-01', '2026-09-03')).toBe('09-01 ~ 09-03');
		expect(formatScheduleRange('2026-09-01', '2026-09-01')).toBe('09-01');
		expect(formatScheduleRange(null, '2026-09-05')).toBe('截止 09-05');
		expect(formatScheduleRange('2026-09-02', null)).toBe('09-02');
		expect(formatScheduleRange(null, null)).toBeNull();
	});

	it('formats relative time', () => {
		const now = Date.now();
		expect(formatRelativeTime(new Date(now - 30 * 1000))).toBe('刚刚');
		expect(formatRelativeTime(new Date(now - 5 * 60 * 1000))).toBe('5分钟前');
		expect(formatRelativeTime(new Date(now - 3 * 3600 * 1000))).toBe('3小时前');
	});

	it('truncates strings', () => {
		expect(truncate('Hello world', 5)).toBe('Hello...');
		expect(truncate('Hi', 5)).toBe('Hi');
	});

	it('converts local calendar day to UTC range correctly', () => {
		const testDate = new Date(2026, 8, 7, 15, 30, 45); // 2026-09-07 15:30:45 本地时间
		const { startDateFrom, startDateTo } = getLocalDayAsUtcRange(testDate);

		const fromDate = new Date(startDateFrom);
		const toDate = new Date(startDateTo);

		// 1. 验证是标准的 UTC ISO 字符串
		expect(startDateFrom.endsWith('Z')).toBe(true);
		expect(startDateTo.endsWith('Z')).toBe(true);

		// 2. 验证两端在本地时间下分别是对齐到 00:00:00.000 和 23:59:59.999
		expect(fromDate.getFullYear()).toBe(2026);
		expect(fromDate.getMonth()).toBe(8);
		expect(fromDate.getDate()).toBe(7);
		expect(fromDate.getHours()).toBe(0);
		expect(fromDate.getMinutes()).toBe(0);
		expect(fromDate.getSeconds()).toBe(0);
		expect(fromDate.getMilliseconds()).toBe(0);

		expect(toDate.getFullYear()).toBe(2026);
		expect(toDate.getMonth()).toBe(8);
		expect(toDate.getDate()).toBe(7);
		expect(toDate.getHours()).toBe(23);
		expect(toDate.getMinutes()).toBe(59);
		expect(toDate.getSeconds()).toBe(59);
		expect(toDate.getMilliseconds()).toBe(999);

		// 3. 验证区间正好是 24 小时（毫秒数）
		expect(toDate.getTime() - fromDate.getTime()).toBe(86399999);
	});

	it('supports string date input in getLocalDayAsUtcRange', () => {
		const { startDateFrom, startDateTo } = getLocalDayAsUtcRange('2026-09-07');
		const fromDate = new Date(startDateFrom);
		const toDate = new Date(startDateTo);

		expect(fromDate.getFullYear()).toBe(2026);
		expect(fromDate.getMonth()).toBe(8);
		expect(fromDate.getDate()).toBe(7);
		expect(fromDate.getHours()).toBe(0);

		expect(toDate.getDate()).toBe(7);
		expect(toDate.getHours()).toBe(23);
	});
});
