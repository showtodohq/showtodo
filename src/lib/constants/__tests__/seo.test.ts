import { describe, test, expect } from 'vitest';
import {
	getHomeSeo,
	getUserProfileSeo,
	getUserWorkbenchSeo,
	getTrendingSeo,
	getTodoDetailSeo,
	ALL_TARGET_KEYWORDS,
	SITE_NAME,
	SITE_BASE_URL
} from '../seo';

describe('SEO Domain Constants & Functions', () => {
	test('ALL_TARGET_KEYWORDS includes all expected core keywords', () => {
		const keywords = ALL_TARGET_KEYWORDS.map((k) => k.toLowerCase());
		expect(keywords).toContain('public todo list');
		expect(keywords).toContain('daily checklist');
		expect(keywords).toContain('what are people doing');
		expect(keywords).toContain('founder todo list');
		expect(keywords).toContain('developer todo list');
		expect(keywords).toContain('build in public');
		expect(keywords).toContain('accountability partner');
		expect(keywords).toContain('show your todo');
		expect(keywords).toContain('show me todo');
		expect(keywords).toContain('see someone\'s plans');
	});

	describe('getHomeSeo', () => {
		test('returns general home SEO when no category is provided', () => {
			const seo = getHomeSeo();
			expect(seo.title).toContain(SITE_NAME);
			expect(seo.title).toContain('Public Todo List');
			expect(seo.description).toContain('what people are doing');
			expect(seo.canonical).toBe(SITE_BASE_URL);
			expect(seo.ogType).toBe('website');
			expect(seo.jsonLd).toBeDefined();
		});

		test('returns targeted category SEO when dev category is provided', () => {
			const seo = getHomeSeo('dev');
			expect(seo.title).toContain('Dev Todos');
			expect(seo.title).toContain('Developer Todo List');
			expect(seo.description).toContain('developer todo lists');
			expect(seo.keywords).toContain('developer todo list');
			expect(seo.canonical).toContain('category=dev');
		});

		test('falls back gracefully on unknown category', () => {
			const seo = getHomeSeo('unknown_cat');
			expect(seo.title).toContain('Public Todo List');
			expect(seo.canonical).toBe(SITE_BASE_URL);
		});
	});

	describe('getUserProfileSeo', () => {
		test('generates dynamic user profile showcase SEO', () => {
			const user = {
				nickname: 'Alice Zhang',
				handle: 'alice'
			};
			const seo = getUserProfileSeo(user);
			expect(seo.title).toBe(`Alice Zhang (@alice) · Public Profile & Activity Footprint · ${SITE_NAME}`);
			expect(seo.description).toContain('Explore Alice Zhang\'s public profile on ShowTodo');
			expect(seo.canonical).toBe(`${SITE_BASE_URL}/@alice`);
			expect(seo.keywords).toContain('Alice Zhang profile');
			expect(seo.keywords).toContain('activity footprint');
			expect(seo.ogType).toBe('profile');
			expect(seo.jsonLd).toBeDefined();
		});

		test('handles fallback when user has no handle or is undefined', () => {
			const seo = getUserProfileSeo(undefined);
			expect(seo.title).toContain('User Profile');
			expect(seo.canonical).toBe(`${SITE_BASE_URL}/`);
		});
	});

	describe('getUserWorkbenchSeo', () => {
		test('generates dynamic user todo workbench SEO', () => {
			const user = {
				nickname: 'Alice Zhang',
				handle: 'alice'
			};
			const seo = getUserWorkbenchSeo(user);
			expect(seo.title).toBe(`Alice Zhang's Public Todo List & Daily Checklist (Stream, Kanban, Calendar) · ${SITE_NAME}`);
			expect(seo.description).toContain('multi-view kanban board');
			expect(seo.canonical).toBe(`${SITE_BASE_URL}/@alice/todolist`);
			expect(seo.keywords).toContain('public todo list');
			expect(seo.keywords).toContain('daily checklist');
			expect(seo.keywords).toContain('Alice Zhang todo list');
			expect(seo.ogType).toBe('website');
			expect(seo.jsonLd).toBeDefined();
		});

		test('handles fallback when user has no handle or is undefined', () => {
			const seo = getUserWorkbenchSeo(undefined);
			expect(seo.title).toContain('Todo List & Task Workbench');
			expect(seo.canonical).toBe(`${SITE_BASE_URL}/`);
		});
	});

	describe('getTrendingSeo', () => {
		test('generates trending SEO with target keywords', () => {
			const seo = getTrendingSeo();
			expect(seo.title).toContain('Trending Public Goals & What People Are Doing');
			expect(seo.description).toContain('trending public goals');
			expect(seo.keywords).toContain('what are people doing');
			expect(seo.keywords).toContain('public goals');
			expect(seo.keywords).toContain('accountability partner');
			expect(seo.canonical).toBe(`${SITE_BASE_URL}/trending`);
		});

		test('includes query when user searches in trending', () => {
			const seo = getTrendingSeo('SvelteKit');
			expect(seo.title).toContain('for "SvelteKit"');
		});
	});

	describe('getTodoDetailSeo', () => {
		test('generates detail SEO for single public todo item with datePublished and author.url', () => {
			const todo = {
				id: 'uuid-1234',
				shortId: 'short123',
				content: 'Release version 1.0 of open-source dashboard',
				author: {
					nickname: 'Bob',
					handle: 'bob_dev',
					avatar: 'https://example.com/avatar.png'
				},
				createdAt: '2026-09-20T10:00:00.000Z',
				updatedAt: '2026-09-20T11:00:00.000Z'
			};
			const seo = getTodoDetailSeo(todo);
			expect(seo.title).toContain('"Release version 1.0 of open-source dashboard" by Bob');
			expect(seo.description).toContain('Tracked publicly by Bob');
			expect(seo.canonical).toBe(`${SITE_BASE_URL}/t/short123`);
			expect(seo.ogType).toBe('article');
			expect(seo.publishedTime).toBe('2026-09-20T10:00:00.000Z');
			expect(seo.modifiedTime).toBe('2026-09-20T11:00:00.000Z');
			expect(seo.jsonLd).toBeDefined();

			const jsonLd = seo.jsonLd as Record<string, any>;
			expect(jsonLd['@type']).toBe('SocialMediaPosting');
			expect(jsonLd.datePublished).toBe('2026-09-20T10:00:00.000Z');
			expect(jsonLd.dateModified).toBe('2026-09-20T11:00:00.000Z');
			expect(jsonLd.author).toEqual({
				'@type': 'Person',
				name: 'Bob',
				url: `${SITE_BASE_URL}/@bob_dev`,
				image: 'https://example.com/avatar.png'
			});
			expect(jsonLd.publisher).toEqual({
				'@type': 'Organization',
				name: SITE_NAME,
				url: SITE_BASE_URL,
				logo: {
					'@type': 'ImageObject',
					url: `${SITE_BASE_URL}/favicon.svg`
				}
			});
			expect(jsonLd.mainEntityOfPage).toEqual({
				'@type': 'WebPage',
				'@id': `${SITE_BASE_URL}/t/short123`
			});
		});

		test('handles Date objects and fallbacks for dates and author url', () => {
			const createDate = new Date('2026-09-19T08:30:00.000Z');
			const todo = {
				id: 'uuid-5678',
				content: 'Task without handle or update date',
				author: null,
				createdAt: createDate
			};
			const seo = getTodoDetailSeo(todo);
			const jsonLd = seo.jsonLd as Record<string, any>;
			expect(jsonLd.datePublished).toBe('2026-09-19T08:30:00.000Z');
			expect(jsonLd.dateModified).toBe('2026-09-19T08:30:00.000Z');
			expect(jsonLd.author.url).toBe(`${SITE_BASE_URL}/`);
		});

		test('truncates very long task content in title', () => {
			const todo = {
				id: 'uuid-1234',
				content: 'A'.repeat(80),
				author: { nickname: 'Bob' }
			};
			const seo = getTodoDetailSeo(todo);
			expect(seo.title).toContain('...');
			const jsonLd = seo.jsonLd as Record<string, any>;
			expect(jsonLd.datePublished).toBeDefined();
		});

		test('handles fallback when todo is undefined', () => {
			const seo = getTodoDetailSeo(undefined);
			expect(seo.title).toContain('Todo Details');
		});
	});
});
