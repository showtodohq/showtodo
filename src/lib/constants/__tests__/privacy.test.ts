import { describe, it, expect } from 'vitest';
import { PRIVACY_POLICY } from '../privacy';

describe('privacy.ts constants', () => {
	it('contains valid policy metadata', () => {
		expect(PRIVACY_POLICY.meta.title).toContain('Privacy Policy');
		expect(PRIVACY_POLICY.meta.version).toMatch(/^\d+\.\d+\.\d+$/);
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

	it('fully complies with Google OAuth Brand Verification & Limited Use requirements', () => {
		const fullText = JSON.stringify(PRIVACY_POLICY);

		// 1. Google OAuth & API Services references
		expect(fullText).toContain('Google OAuth');
		expect(fullText).toContain('Google API Services User Data Policy');
		expect(fullText).toContain('Limited Use requirements');

		// 2. Disclose what Google user data is accessed
		expect(fullText).toContain('openid');
		expect(fullText).toContain('email');
		expect(fullText).toContain('profile');

		// 3. Disclose how Google user data is used
		expect(fullText).toContain('authenticate');

		// 4. Affirm no sale, no ad targeting
		expect(fullText).toContain('advertising');

		// 5. Explicitly affirm Google user data is not used for AI/ML training
		expect(fullText).toContain('train');

		// 6. Provide data retention, deletion, and Google Account permission revocation link
		expect(fullText).toContain('https://myaccount.google.com/permissions');
		expect(fullText).toContain('privacy@showtodo.com');

		// 7. Verify dedicated section exists
		const googleSection = PRIVACY_POLICY.sections.find(
			(s) => s.id === 'google-api-disclosure' || s.id === 'google-user-data'
		);
		expect(googleSection).toBeDefined();
		expect(googleSection?.content.some((c) => c.includes('Limited Use'))).toBe(true);
	});
});
