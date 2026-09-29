import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import TodoComposer from '../todo/TodoComposer.svelte';

describe('TodoComposer component (TDD & UI Aesthetics)', () => {
	it('renders default state with hairline border and without container shadow', () => {
		const rendered = render(TodoComposer);

		// 验证使用了极细微弱边框 (hairline border)
		expect(rendered.body).toContain('border-zinc-200/60');
		expect(rendered.body).toContain('dark:border-zinc-800/60');

		// 验证默认状态无阴影
		const containerHtml = rendered.body.slice(0, 300);
		expect(containerHtml).not.toContain('shadow-2xs');
		expect(containerHtml).not.toContain('shadow-xs');
		expect(containerHtml).not.toContain('shadow-sm');
		expect(containerHtml).not.toContain('shadow-md');
	});

	it('renders placeholder and textarea', () => {
		const rendered = render(TodoComposer, {
			props: {
				placeholder: 'Custom test placeholder'
			}
		});

		expect(rendered.body).toContain('placeholder="Custom test placeholder"');
	});
});
