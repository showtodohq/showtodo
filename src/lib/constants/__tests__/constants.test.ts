import { describe, it, expect } from 'vitest';
import { TODO_STATUSES, getStatusConfig } from '../status';
import { ACTIVITY_CONFIG } from '../activity';

describe('Constants Domain Ubiquitous Language (TDD)', () => {
	it('TODO_STATUSES has standard "已完成" for done status', () => {
		const doneConfig = getStatusConfig('done');
		expect(doneConfig.label).toBe('已完成');
		expect(doneConfig.actionLabel).toBe('标记完成');
		expect(doneConfig.shortActionLabel).toBe('已完成');
		expect(doneConfig.description).not.toContain('达成');
	});

	it('ACTIVITY_CONFIG defines standardized action labels and units (次)', () => {
		expect(ACTIVITY_CONFIG.total.label).toBe('足迹');
		expect(ACTIVITY_CONFIG.total.actionLabel).toBe('累计足迹');
		expect(ACTIVITY_CONFIG.total.unit).toBe('次');

		expect(ACTIVITY_CONFIG.created.label).toBe('新建');
		expect(ACTIVITY_CONFIG.created.unit).toBe('次');

		expect(ACTIVITY_CONFIG.completed.label).toBe('完成');
		expect(ACTIVITY_CONFIG.completed.unit).toBe('次');

		expect(ACTIVITY_CONFIG.notes.label).toBe('进展');
		expect(ACTIVITY_CONFIG.notes.unit).toBe('次');
	});

	it('strictly forbids "达成" across all activity and status config texts', () => {
		const allStatusTexts = Object.values(TODO_STATUSES).flatMap((s) => [
			s.label,
			s.description,
			s.actionLabel,
			s.shortActionLabel
		]);
		for (const text of allStatusTexts) {
			expect(text).not.toContain('达成');
		}

		const allActivityTexts = Object.values(ACTIVITY_CONFIG).flatMap((a) => [
			a.label,
			a.unit,
			a.actionLabel,
			a.description
		]);
		for (const text of allActivityTexts) {
			expect(text).not.toContain('达成');
		}
	});
});
