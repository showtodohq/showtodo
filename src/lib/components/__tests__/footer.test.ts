import { describe, it, expect } from 'vitest';
import Footer from '../layout/Footer.svelte';
import { render } from 'svelte/server';

describe('Footer component test', () => {
	it('renders navigation links to What\'s ShowTodo (/about) and Privacy (/privacy)', () => {
		const rendered = render(Footer);

		// 1. About Link
		expect(rendered.body).toContain('href="/about"');
		expect(rendered.body).toContain("What's ShowTodo");

		// 2. Privacy Link
		expect(rendered.body).toContain('href="/privacy"');
		expect(rendered.body).toContain('Privacy');

		// 3. Existing Stats and Trending
		expect(rendered.body).toContain('href="/stats"');
		expect(rendered.body).toContain('href="/trending"');
	});

	it('renders the accurate tagline representing the public task network', () => {
		const rendered = render(Footer);
		expect(rendered.body).toContain('The Public Todo Network');
		// Must not contain the outdated "collaborative"
		expect(rendered.body).not.toContain('Public Collaborative Todos');
	});
});
