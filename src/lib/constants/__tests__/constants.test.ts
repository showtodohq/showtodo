import { describe, it, expect } from 'vitest';
import { TODO_STATUSES, getStatusConfig } from '../status';
import { ACTIVITY_CONFIG } from '../activity';

describe('Constants Domain Ubiquitous Language (TDD)', () => {
	it('TODO_STATUSES has standard "Completed" for done status', () => {
		const doneConfig = getStatusConfig('done');
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
});
