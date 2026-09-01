import { describe, it, expect } from 'vitest';
import { formatDate, formatRelativeTime, formatShortDate, formatScheduleRange, truncate } from '../format';

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
});
