import { describe, it, expect } from 'vitest';
import BreadcrumbNav from '../ui/BreadcrumbNav.svelte';
import { render } from 'svelte/server';

describe('BreadcrumbNav rendering test', () => {
	it('renders back label text when no crumbs are provided', () => {
		const rendered = render(BreadcrumbNav, {
			props: {
				backHref: '/trending',
				backLabel: 'Back to Trending'
			}
		});

		expect(rendered.body).toContain('Back to Trending');
	});

	it('renders crumbs and hides redundant back label text when crumbs are provided', () => {
		const rendered = render(BreadcrumbNav, {
			props: {
				backHref: '/',
				backLabel: 'Back to Feed',
				crumbs: [
					{ label: 'Feed', href: '/' },
					{ label: '#Morning Run' }
				]
			}
		});

		// Contains breadcrumb items
		expect(rendered.body).toContain('Feed');
		expect(rendered.body).toContain('href="/"');
		expect(rendered.body).toContain('#Morning Run');

		// Ensure redundant visible span is hidden
		expect(rendered.body).not.toContain('<span class="ml-1 font-medium">Back to Feed</span>');
		// Kept in title and aria-label for accessibility
		expect(rendered.body).toContain('title="Back to Feed"');
	});
});
