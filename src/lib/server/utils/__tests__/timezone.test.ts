import { describe, it, expect } from 'vitest';
import {
	isValidTimezone,
	resolveTimezone,
	formatDateInTimezone,
	getTodayInTimezone,
	getPastDaysList
} from '../timezone';

describe('Timezone Utility (TDD)', () => {
	describe('isValidTimezone', () => {
		it('returns true for valid IANA timezones', () => {
			expect(isValidTimezone('Asia/Shanghai')).toBe(true);
			expect(isValidTimezone('Asia/Seoul')).toBe(true);
			expect(isValidTimezone('UTC')).toBe(true);
			expect(isValidTimezone('America/New_York')).toBe(true);
			expect(isValidTimezone('Europe/London')).toBe(true);
		});

		it('returns false for invalid or malicious timezone strings', () => {
			expect(isValidTimezone('')).toBe(false);
			expect(isValidTimezone('Invalid/Zone')).toBe(false);
			expect(isValidTimezone("Asia/Shanghai'; DROP TABLE users;--")).toBe(false);
			expect(isValidTimezone('12345')).toBe(false);
			expect(isValidTimezone('null')).toBe(false);
			expect(isValidTimezone(undefined as any)).toBe(false);
			expect(isValidTimezone(null as any)).toBe(false);
		});
	});

	describe('resolveTimezone', () => {
		it('resolves valid timezone from param', () => {
			expect(resolveTimezone('Asia/Tokyo', null)).toBe('Asia/Tokyo');
		});

		it('resolves valid timezone from header when param is absent', () => {
			expect(resolveTimezone(null, 'Europe/Paris')).toBe('Europe/Paris');
			expect(resolveTimezone('', 'Europe/Paris')).toBe('Europe/Paris');
		});

		it('falls back to default timezone when both are absent or invalid', () => {
			expect(resolveTimezone(null, null)).toBe('Asia/Shanghai');
			expect(resolveTimezone('invalid', 'attack--')).toBe('Asia/Shanghai');
		});

		it('allows custom fallback timezone', () => {
			expect(resolveTimezone(null, null, 'UTC')).toBe('UTC');
		});
	});

	describe('formatDateInTimezone', () => {
		it('formats a UTC Date to specific timezone YYYY-MM-DD correctly', () => {
			// 2026-09-10T16:05:18Z is 2026-09-11 00:05:18 in Asia/Shanghai (UTC+8)
			const date = new Date('2026-09-10T16:05:18.000Z');
			expect(formatDateInTimezone(date, 'Asia/Shanghai')).toBe('2026-09-11');
			expect(formatDateInTimezone(date, 'Asia/Seoul')).toBe('2026-09-11'); // UTC+9 is 01:05:18
			expect(formatDateInTimezone(date, 'UTC')).toBe('2026-09-10');
			expect(formatDateInTimezone(date, 'America/New_York')).toBe('2026-09-10'); // UTC-4 is 12:05:18
		});
	});

	describe('getTodayInTimezone', () => {
		it('returns a valid YYYY-MM-DD string matching current date in that timezone', () => {
			const todayStr = getTodayInTimezone('Asia/Shanghai');
			expect(todayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		});
	});

	describe('getPastDaysList', () => {
		it('generates continuous list of past N days ending at endDate in timezone', () => {
			// At 2026-09-10T16:05:00Z:
			// In Asia/Shanghai it is 2026-09-11 00:05
			// In UTC it is 2026-09-10 16:05
			const fixedDate = new Date('2026-09-10T16:05:00.000Z');
			const listShanghai = getPastDaysList(3, fixedDate, 'Asia/Shanghai');
			expect(listShanghai).toEqual(['2026-09-09', '2026-09-10', '2026-09-11']);

			const listUtc = getPastDaysList(3, fixedDate, 'UTC');
			expect(listUtc).toEqual(['2026-09-08', '2026-09-09', '2026-09-10']);
		});
	});
});
