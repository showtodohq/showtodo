import { describe, it, expect } from 'vitest';
import { PRIVACY_POLICY } from '../privacy';

describe('privacy.ts constants', () => {
	it('contains valid policy metadata', () => {
		expect(PRIVACY_POLICY.meta.title).toContain('Privacy Policy');
		expect(PRIVACY_POLICY.meta.version).toBe('1.0.0');
		expect(PRIVACY_POLICY.meta.contactEmail).toBe('privacy@showtodo.com');
		expect(PRIVACY_POLICY.meta.effectiveDate).toBeTruthy();
	});

	it('contains high-level quick highlights for quick scanning', () => {
		expect(PRIVACY_POLICY.quickHighlights.length).toBe(3);
		for (const highlight of PRIVACY_POLICY.quickHighlights) {
			expect(highlight.title).toBeTruthy();
			expect(highlight.description).toBeTruthy();
			expect(highlight.icon).toBeTruthy();
		}
	});

	it('contains all required legal sections with unique IDs and plain takeaways', () => {
		expect(PRIVACY_POLICY.sections.length).toBeGreaterThanOrEqual(8);

		const ids = PRIVACY_POLICY.sections.map((s) => s.id);
		const uniqueIds = new Set(ids);
		expect(uniqueIds.size).toBe(ids.length); // Every section must have a unique anchor ID

		for (const section of PRIVACY_POLICY.sections) {
			expect(section.id).toBeTruthy();
			expect(section.title).toBeTruthy();
			expect(section.plainTakeaway.length).toBeGreaterThan(15);
			expect(section.content.length).toBeGreaterThan(0);
		}
	});

	it('explicitly mentions GDPR, CCPA, and no-sale commitments', () => {
		const fullText = JSON.stringify(PRIVACY_POLICY);
		expect(fullText).toContain('GDPR');
		expect(fullText).toContain('CCPA');
		expect(fullText).toContain('sell');
	});
});
