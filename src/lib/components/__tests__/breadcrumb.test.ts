import { describe, it, expect } from 'vitest';
import BreadcrumbNav from '../ui/BreadcrumbNav.svelte';
import { render } from 'svelte/server';

describe('BreadcrumbNav rendering test', () => {
	it('renders back label text when no crumbs are provided', () => {
		const rendered = render(BreadcrumbNav, {
			props: {
				backHref: '/topics',
				backLabel: '返回同行广场'
			}
		});

		expect(rendered.body).toContain('返回同行广场');
	});

	it('renders crumbs and hides redundant back label text when crumbs are provided', () => {
		const rendered = render(BreadcrumbNav, {
			props: {
				backHref: '/',
				backLabel: '返回动态流',
				crumbs: [
					{ label: '动态流', href: '/' },
					{ label: '#晨跑打卡' }
				]
			}
		});

		// 包含面包屑项
		expect(rendered.body).toContain('动态流');
		expect(rendered.body).toContain('href="/"');
		expect(rendered.body).toContain('#晨跑打卡');

		// 确保不出现重复的“返回动态流”可见文本 span
		expect(rendered.body).not.toContain('<span class="ml-1 font-medium">返回动态流</span>');
		// 但依然保留在 title 和 aria-label 中供无障碍使用
		expect(rendered.body).toContain('title="返回动态流"');
	});
});
