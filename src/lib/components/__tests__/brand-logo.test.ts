import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import BrandLogo from '../ui/BrandLogo.svelte';

describe('BrandLogo component', () => {
	it('renders svg with default size and ShowTodo brand mark', () => {
		const rendered = render(BrandLogo);
		expect(rendered.body).toContain('<svg');
		expect(rendered.body).toContain('viewBox="0 0 32 32"');
		expect(rendered.body).toContain('showtodo-brand-logo');
	});

	it('supports custom size variants (sm, md, lg)', () => {
		const smRendered = render(BrandLogo, { props: { size: 'sm' } });
		expect(smRendered.body).toContain('w-5 h-5');

		const mdRendered = render(BrandLogo, { props: { size: 'md' } });
		expect(mdRendered.body).toContain('w-7 h-7');

		const lgRendered = render(BrandLogo, { props: { size: 'lg' } });
		expect(lgRendered.body).toContain('w-9 h-9');
	});

	it('renders accessible title and aria attributes', () => {
		const rendered = render(BrandLogo, { props: { title: 'ShowTodo Logo' } });
		expect(rendered.body).toContain('<title>ShowTodo Logo</title>');
		expect(rendered.body).toContain('role="img"');
	});

	it('renders wordmark when showText is true', () => {
		const withText = render(BrandLogo, { props: { showText: true } });
		expect(withText.body).toContain('font-semibold');
		expect(withText.body).toContain('ShowTodo</span>');

		const withoutText = render(BrandLogo, { props: { showText: false } });
		expect(withoutText.body).not.toContain('ShowTodo</span>');
	});
});
