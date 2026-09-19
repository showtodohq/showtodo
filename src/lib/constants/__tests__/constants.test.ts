import { describe, it, expect } from 'vitest';
import {
	TODO_STATUS,
	ALL_TODO_STATUSES,
	TODO_STATUSES,
	TODO_STATUS_ICON_SIZES,
	getStatusConfig,
	isStatusDone,
	isStatusInProgress,
	isStatusPending,
	isStatusAbandoned,
	isStatusCompletedOrAbandoned
} from '../status';
import { ACTIVITY_CONFIG } from '../activity';

describe('Constants Domain Ubiquitous Language (TDD)', () => {
	it('defines TODO_STATUS enum constants and ALL_TODO_STATUSES without hardcoding', () => {
		expect(TODO_STATUS.PENDING).toBe('pending');
		expect(TODO_STATUS.IN_PROGRESS).toBe('in_progress');
		expect(TODO_STATUS.DONE).toBe('done');
		expect(TODO_STATUS.ABANDONED).toBe('abandoned');

		expect(ALL_TODO_STATUSES).toEqual([
			TODO_STATUS.PENDING,
			TODO_STATUS.IN_PROGRESS,
			TODO_STATUS.DONE,
			TODO_STATUS.ABANDONED
		]);
	});

	it('provides domain predicate helpers for status checking', () => {
		expect(isStatusDone(TODO_STATUS.DONE)).toBe(true);
		expect(isStatusDone(TODO_STATUS.PENDING)).toBe(false);

		expect(isStatusInProgress(TODO_STATUS.IN_PROGRESS)).toBe(true);
		expect(isStatusInProgress(TODO_STATUS.DONE)).toBe(false);

		expect(isStatusPending(TODO_STATUS.PENDING)).toBe(true);
		expect(isStatusPending(TODO_STATUS.ABANDONED)).toBe(false);

		expect(isStatusAbandoned(TODO_STATUS.ABANDONED)).toBe(true);
		expect(isStatusAbandoned(TODO_STATUS.DONE)).toBe(false);

		expect(isStatusCompletedOrAbandoned(TODO_STATUS.DONE)).toBe(true);
		expect(isStatusCompletedOrAbandoned(TODO_STATUS.ABANDONED)).toBe(true);
		expect(isStatusCompletedOrAbandoned(TODO_STATUS.PENDING)).toBe(false);
		expect(isStatusCompletedOrAbandoned(TODO_STATUS.IN_PROGRESS)).toBe(false);
	});

	it('TODO_STATUSES has standard "Completed" for done status', () => {
		const doneConfig = getStatusConfig(TODO_STATUS.DONE);
		expect(doneConfig.label).toBe('Completed');
		expect(doneConfig.actionLabel).toBe('Mark Completed');
		expect(doneConfig.shortActionLabel).toBe('Completed');
	});

	it('ACTIVITY_CONFIG defines standardized action labels and units (times)', () => {
		expect(ACTIVITY_CONFIG.total.label).toBe('Activities');
		expect(ACTIVITY_CONFIG.total.actionLabel).toBe('Total Activities');
		expect(ACTIVITY_CONFIG.total.unit).toBe('times');

		expect(ACTIVITY_CONFIG.created.label).toBe('Created');
		expect(ACTIVITY_CONFIG.created.unit).toBe('times');

		expect(ACTIVITY_CONFIG.completed.label).toBe('Completed');
		expect(ACTIVITY_CONFIG.completed.unit).toBe('times');

		expect(ACTIVITY_CONFIG.notes.label).toBe('Updates');
		expect(ACTIVITY_CONFIG.notes.unit).toBe('times');
	});

	it('validates all status and activity configs have non-empty english text', () => {
		const allStatusTexts = Object.values(TODO_STATUSES).flatMap((s) => [
			s.label,
			s.description,
			s.actionLabel,
			s.shortActionLabel
		]);
		for (const text of allStatusTexts) {
			expect(text.length).toBeGreaterThan(0);
		}

		const allActivityTexts = Object.values(ACTIVITY_CONFIG).flatMap((a) => [
			a.label,
			a.unit,
			a.actionLabel,
			a.description
		]);
		for (const text of allActivityTexts) {
			expect(text.length).toBeGreaterThan(0);
		}
	});

	it('defines standardized status icon size classes without hardcoding', () => {
		expect(TODO_STATUS_ICON_SIZES.xs).toBe('h-2.5 w-2.5');
		expect(TODO_STATUS_ICON_SIZES.sm).toBe('h-3.5 w-3.5');
		expect(TODO_STATUS_ICON_SIZES.md).toBe('h-4 w-4');
		expect(TODO_STATUS_ICON_SIZES.lg).toBe('h-5 w-5');
	});

	it('ensures StatusConfig does not contain legacy icon string properties', () => {
		for (const st of TODO_STATUSES) {
			// @ts-expect-error icon should no longer exist
			expect(st.icon).toBeUndefined();
			// @ts-expect-error actionIcon should no longer exist
			expect(st.actionIcon).toBeUndefined();
		}
	});
});
