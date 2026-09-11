import { describe, it, expect } from 'vitest';
import BreadcrumbNav from '../ui/BreadcrumbNav.svelte';
import { render } from 'svelte/server';

describe('BreadcrumbNav rendering test', () => {
	it('renders default back label and fallback href', () => {
		const rendered = render(BreadcrumbNav, {
			props: {
				backHref: '/topics',
				backLabel: '返回多人广场'
			}
		});

		expect(rendered.body).toContain('返回多人广场');
	});

	it('renders crumbs when provided', () => {
		const rendered = render(BreadcrumbNav, {
			props: {
				backHref: '/topics',
				backLabel: '返回多人广场',
				crumbs: [
					{ label: '多人广场', href: '/topics' },
					{ label: '#晨跑打卡' }
				]
			}
		});

		expect(rendered.body).toContain('多人广场');
		expect(rendered.body).toContain('href="/topics"');
		expect(rendered.body).toContain('#晨跑打卡');
	});
});
