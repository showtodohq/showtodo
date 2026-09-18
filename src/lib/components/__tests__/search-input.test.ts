import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import SearchInput from '../ui/SearchInput.svelte';
import { SEARCH_PLACEHOLDERS, SEARCH_FOCUS_SHORTCUT } from '$lib/constants/search';

describe('SearchInput Component', () => {
	it('renders default search input correctly', () => {
		const rendered = render(SearchInput, {
			props: {
				placeholder: SEARCH_PLACEHOLDERS.TRENDING
			}
		});

		expect(rendered.body).toContain('role="search"');
		expect(rendered.body).toContain('type="search"');
		expect(rendered.body).toContain(SEARCH_PLACEHOLDERS.TRENDING);
	});

	it('renders clear button when value is non-empty', () => {
		const rendered = render(SearchInput, {
			props: {
				value: '跑步',
				placeholder: 'Search...'
			}
		});

		expect(rendered.body).toContain('title="Clear search (Esc)"');
		expect(rendered.body).toContain('aria-label="Clear search"');
	});

	it('renders loading spinner when loading is true', () => {
		const rendered = render(SearchInput, {
			props: {
				value: '健身',
				loading: true
			}
		});

		// Spinner SVG
		expect(rendered.body).toContain('animate-spin');
	});

	it('renders global shortcut indicator when enableGlobalShortcut is true and value is empty', () => {
		const rendered = render(SearchInput, {
			props: {
				value: '',
				enableGlobalShortcut: true
			}
		});

		expect(rendered.body).toContain(SEARCH_FOCUS_SHORTCUT);
		expect(rendered.body).toContain('title="Press / to search"');
	});
});
