import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import Modal from '../ui/Modal.svelte';

describe('Modal rendering and body scroll lock', () => {
	it('renders dialog with overscroll-contain to isolate scroll chaining', () => {
		const rendered = render(Modal, {
			props: {
				open: true,
				title: '测试弹窗'
			}
		});

		expect(rendered.body).toContain('role="dialog"');
		expect(rendered.body).toContain('overscroll-contain');
		expect(rendered.body).toContain('测试弹窗');
	});
});
