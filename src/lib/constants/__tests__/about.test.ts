import { describe, it, expect } from 'vitest';
import { ABOUT_CONTENT, generateAboutJsonLd } from '../about';

describe('about.ts constants', () => {
	it('contains complete metadata for SEO', () => {
		expect(ABOUT_CONTENT.meta.title).toContain("What's ShowTodo");
		expect(ABOUT_CONTENT.meta.description.length).toBeGreaterThan(30);
		expect(ABOUT_CONTENT.meta.canonical).toBe('https://www.showtodo.com/about');
		expect(ABOUT_CONTENT.meta.keywords.length).toBeGreaterThanOrEqual(5);
	});

	it('contains the 5 core value pillars without defensive negatives', () => {
		expect(ABOUT_CONTENT.pillars).toHaveLength(5);
		const pillarIds = ABOUT_CONTENT.pillars.map((p) => p.id);
		expect(pillarIds).toEqual([
			'companionship',
			'accountability',
			'encouragement',
			'learn-workflows',
			'build-in-public'
		]);

		// Every pillar should have a title, tagline, description, icon, and non-empty points
		for (const pillar of ABOUT_CONTENT.pillars) {
			expect(pillar.title).toBeTruthy();
			expect(pillar.tagline).toBeTruthy();
			expect(pillar.description.length).toBeGreaterThan(20);
			expect(pillar.points.length).toBeGreaterThanOrEqual(2);
		}
	});

	it('contains structured FAQs with questions, shortAnswers, and details', () => {
		expect(ABOUT_CONTENT.faqs.length).toBeGreaterThanOrEqual(4);
		for (const faq of ABOUT_CONTENT.faqs) {
			expect(faq.id).toBeTruthy();
			expect(faq.question).toBeTruthy();
			expect(faq.shortAnswer).toBeTruthy();
			expect(faq.details.length).toBeGreaterThanOrEqual(1);
		}
	});

	it('contains accurate highlights including shared goals auto-clustering without hashtag fiction', () => {
		const highlightIds = ABOUT_CONTENT.highlights.map((h) => h.id);
		expect(highlightIds).toContain('shared-goals');
		expect(highlightIds).not.toContain('topic-spaces');

		const sharedGoals = ABOUT_CONTENT.highlights.find((h) => h.id === 'shared-goals');
		expect(sharedGoals?.description).toContain('clusters them into shared goals');
		expect(sharedGoals?.description).not.toContain('#');
	});

	it('generates valid Schema.org JSON-LD string with SoftwareApplication and FAQPage', () => {
		const jsonLdStr = generateAboutJsonLd(ABOUT_CONTENT);
		expect(jsonLdStr).toBeTruthy();

		const parsed = JSON.parse(jsonLdStr);
		expect(Array.isArray(parsed)).toBe(true);
		expect(parsed).toHaveLength(3);

		const [app, org, faq] = parsed;
		expect(app['@type']).toBe('WebApplication');
		expect(app.name).toBe('ShowTodo');
		expect(org['@type']).toBe('Organization');
		expect(faq['@type']).toBe('FAQPage');
		expect(faq.mainEntity.length).toBe(ABOUT_CONTENT.faqs.length);
	});
});
