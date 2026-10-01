import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import { createRawSnippet } from 'svelte';
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

	it('renders outer viewport scroll container with min-h-full centering wrapper to prevent flexbox overflow clipping', () => {
		const rendered = render(Modal, {
			props: {
				open: true,
				title: '高弹窗测试'
			}
		});

		// 验证最外层视口滚动容器具备 overflow-y-auto 与 fixed inset-0
		expect(rendered.body).toContain('fixed inset-0 z-50 overflow-y-auto overscroll-contain');
		// 验证抗截断的居中包装层具备 min-h-full 与 items-center
		expect(rendered.body).toContain('flex min-h-full items-center justify-center');
		// 验证卡片本体设置了视口最大高度约束与 flex-col 布局
		expect(rendered.body).toContain('flex flex-col');
	});

	it('renders content body in a scrollable container with shrink-0 pinned header and footer', () => {
		const childrenSnippet = createRawSnippet(() => ({
			render: () => '<p>表单长内容测试</p>'
		}));

		const rendered = render(Modal, {
			props: {
				open: true,
				title: '长表单弹窗',
				description: '包含大量输入框',
				children: childrenSnippet
			}
		});

		// 验证标题区 shrink-0 吸顶
		expect(rendered.body).toContain('shrink-0 flex items-start justify-between');
		// 验证内容主体具备 flex-1 overflow-y-auto min-h-0，支持自适应内部顺畅滚动
		expect(rendered.body).toContain('flex-1 overflow-y-auto overscroll-contain min-h-0');
		expect(rendered.body).toContain('表单长内容测试');
	});

	it('handles p-0 class cleanly to prevent duplicate padding with inner content', () => {
		const rendered = render(Modal, {
			props: {
				open: true,
				class: 'p-0 overflow-hidden'
			}
		});

		// 当外层指定 p-0 时，内容容器不应强行叠加默认的 px-6 py-5 内边距
		expect(rendered.body).not.toContain('px-6 py-5');
	});
});
