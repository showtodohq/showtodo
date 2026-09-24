import { describe, test, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SITE_BASE_URL, CRAWLER_DOCS } from '../seo';

const STATIC_DIR = path.resolve(process.cwd(), 'static');

describe('Crawler and LLM Discoverability Documents Specification', () => {
	test('CRAWLER_DOCS paths are properly defined', () => {
		expect(CRAWLER_DOCS.ROBOTS).toBe('/robots.txt');
		expect(CRAWLER_DOCS.LLMS).toBe('/llms.txt');
		expect(CRAWLER_DOCS.LLMS_FULL).toBe('/llms-full.txt');
		expect(CRAWLER_DOCS.SITEMAP).toBe('/sitemap.xml');
		expect(CRAWLER_DOCS.WELL_KNOWN_LLMS).toBe('/.well-known/llms.txt');
	});

	describe('robots.txt', () => {
		const robotsPath = path.join(STATIC_DIR, 'robots.txt');
		const content = fs.readFileSync(robotsPath, 'utf-8');

		test('file exists and is not empty', () => {
			expect(fs.existsSync(robotsPath)).toBe(true);
			expect(content.length).toBeGreaterThan(50);
		});

		test('allows all public web pages under wildcard user-agent', () => {
			expect(content).toContain('User-agent: *');
			expect(content).toContain('Allow: /');
		});

		test('disallows crawling backend api endpoints and removes dev artifacts', () => {
			expect(content).toContain('Disallow: /api/');
			expect(content).not.toContain('(dev)');
		});

		test('references sitemap and llms.txt context documentation', () => {
			expect(content).toContain(`Sitemap: ${SITE_BASE_URL}/sitemap.xml`);
			expect(content).toContain(`${SITE_BASE_URL}/llms.txt`);
			expect(content).toContain(`${SITE_BASE_URL}/llms-full.txt`);
		});
	});

	describe('llms.txt', () => {
		const llmsPath = path.join(STATIC_DIR, 'llms.txt');
		const content = fs.readFileSync(llmsPath, 'utf-8');

		test('file exists and follows llmstxt.org structure', () => {
			expect(fs.existsSync(llmsPath)).toBe(true);
			// Must start with H1 title
			expect(content.trim().startsWith('# ShowTodo')).toBe(true);
			// Must have blockquote summary
			expect(content).toMatch(/>\s+ShowTodo is an open/);
		});

		test('includes links to all core public web pages using canonical SITE_BASE_URL', () => {
			expect(content).toContain(`[Home Feed](${SITE_BASE_URL}/)`);
			expect(content).toContain(`[What is ShowTodo](${SITE_BASE_URL}/about)`);
			expect(content).toContain(`[Trending Goals](${SITE_BASE_URL}/trending)`);
			expect(content).toContain(`[Goals Directory](${SITE_BASE_URL}/goals)`);
			expect(content).toContain(`[Stats Dashboard](${SITE_BASE_URL}/stats)`);
			expect(content).toContain(`[Privacy Policy](${SITE_BASE_URL}/privacy)`);
		});

		test('documents public REST API endpoints for agent discovery', () => {
			expect(content).toContain('GET /api/daily');
			expect(content).toContain('GET /api/topics');
			expect(content).toContain('GET /api/todos/{id}');
			expect(content).toContain('GET /api/users/{id}');
			expect(content).toContain('GET /api/stats');
		});

		test('points to full context document and sitemap', () => {
			expect(content).toContain(`[Full LLM Context](${SITE_BASE_URL}/llms-full.txt)`);
			expect(content).toContain(`[Sitemap](${SITE_BASE_URL}/sitemap.xml)`);
		});
	});

	describe('llms-full.txt', () => {
		const llmsFullPath = path.join(STATIC_DIR, 'llms-full.txt');
		const content = fs.readFileSync(llmsFullPath, 'utf-8');

		test('file exists and contains comprehensive system context', () => {
			expect(fs.existsSync(llmsFullPath)).toBe(true);
			expect(content).toContain('# ShowTodo - Comprehensive Context for LLMs & AI Agents');
		});

		test('documents complete domain taxonomy and lifecycles', () => {
			// Todo status
			expect(content).toContain('pending');
			expect(content).toContain('in_progress');
			expect(content).toContain('completed');
			expect(content).toContain('abandoned');

			// Categories
			expect(content).toContain('dev');
			expect(content).toContain('study');
			expect(content).toContain('fitness');
			expect(content).toContain('finance');
			expect(content).toContain('life');

			// Reactions
			expect(content).toContain('cheer');
			expect(content).toContain('salute');
			expect(content).toContain('fire');
		});

		test('documents detailed API request/response JSON schemas', () => {
			expect(content).toContain('GET /api/daily');
			expect(content).toContain('GET /api/topics/{hash}');
			expect(content).toContain('GET /api/todos/{id}');
			expect(content).toContain('GET /api/users/{id}/heatmap');
			expect(content).toContain('"reactions"');
		});
	});

	describe('sitemap.xml', () => {
		const sitemapPath = path.join(STATIC_DIR, 'sitemap.xml');
		const content = fs.readFileSync(sitemapPath, 'utf-8');

		test('file exists and adheres to sitemaps.org XML schema', () => {
			expect(fs.existsSync(sitemapPath)).toBe(true);
			expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
			expect(content).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
			expect(content).toContain('</urlset>');
		});

		test('indexes all essential canonical public routes', () => {
			const expectedRoutes = [
				`${SITE_BASE_URL}/`,
				`${SITE_BASE_URL}/about`,
				`${SITE_BASE_URL}/trending`,
				`${SITE_BASE_URL}/stats`,
				`${SITE_BASE_URL}/privacy`,
				`${SITE_BASE_URL}/llms.txt`,
				`${SITE_BASE_URL}/llms-full.txt`
			];

			for (const route of expectedRoutes) {
				expect(content).toContain(`<loc>${route}</loc>`);
			}
		});

		test('every url entry has changefreq and priority elements', () => {
			const urlMatches = content.match(/<url>/g);
			const locMatches = content.match(/<loc>/g);
			const changefreqMatches = content.match(/<changefreq>/g);
			const priorityMatches = content.match(/<priority>/g);

			expect(urlMatches).toBeDefined();
			expect(urlMatches?.length).toBe(locMatches?.length);
			expect(urlMatches?.length).toBe(changefreqMatches?.length);
			expect(urlMatches?.length).toBe(priorityMatches?.length);
		});
	});

	describe('.well-known/llms.txt', () => {
		const wellKnownPath = path.join(STATIC_DIR, '.well-known', 'llms.txt');
		const rootLlmsPath = path.join(STATIC_DIR, 'llms.txt');

		test('exists and mirrors root llms.txt', () => {
			expect(fs.existsSync(wellKnownPath)).toBe(true);
			const wellKnownContent = fs.readFileSync(wellKnownPath, 'utf-8');
			const rootContent = fs.readFileSync(rootLlmsPath, 'utf-8');
			expect(wellKnownContent.trim()).toBe(rootContent.trim());
		});
	});
});
