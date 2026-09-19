import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import UserProfileCard from '../user/UserProfileCard.svelte';
import { PROFILE_ACTIONS } from '$lib/constants/profile';
import type { UserProfile } from '$lib/types/user';

const mockUser: UserProfile = {
	id: 'usr_1',
	handle: 'testuser',
	nickname: 'Test User',
	avatar: 'https://example.com/avatar.png',
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z',
	lastTodoUpdatedAt: null
};

describe('UserProfileCard action buttons consistency (TDD & Design System)', () => {
	it('renders both Todolist and Edit Profile buttons on the same line as username, showing icon-only on mobile', () => {
		const rendered = render(UserProfileCard, {
			props: {
				user: mockUser,
				isMe: true
			}
		});

		const body = rendered.body;

		// 检查 Todolist 按钮: 是一个链接按钮，指向用户的 todolist
		expect(body).toContain('href="/@testuser/todolist"');
		expect(body).toContain('Kanban');
		expect(body).toContain(PROFILE_ACTIONS.TODOLIST.LABEL);

		// 检查 Edit Profile 按钮: 包含编辑按钮标题与文本
		expect(body).toContain(`title="${PROFILE_ACTIONS.EDIT.TITLE}"`);
		expect(body).toContain(PROFILE_ACTIONS.EDIT.LABEL);

		// 验证两者统一使用相同设计规范的尺寸与样式 (size="xs": h-7 rounded-md border-zinc-300)
		expect(body).toContain('border-zinc-300');
		expect(body).toContain('rounded-md');

		// 移动端仅显示图标：按钮文字包裹在 hidden sm:inline 中
		expect(body).toContain(`<span class="hidden sm:inline">${PROFILE_ACTIONS.TODOLIST.LABEL}</span>`);
		expect(body).toContain(`<span class="hidden sm:inline">${PROFILE_ACTIONS.EDIT.LABEL}</span>`);

		// 移动端正方形图标尺寸响应式类名 (w-7 sm:w-auto p-0 sm:px-2)
		expect(body).toContain('w-7 sm:w-auto');

		// 验证用户名与按钮在同一个横向 flex justify-between 容器中
		expect(body).toContain('flex items-center justify-between gap-2');
	});

	it('does not render "Your Profile" badge and supports mobile line break for handle and join date', () => {
		const rendered = render(UserProfileCard, {
			props: {
				user: mockUser,
				isMe: true
			}
		});

		// 用户名后面不应出现 "Your Profile" 徽章
		expect(rendered.body).not.toContain('Your Profile');

		// 验证 handle 与 join 时间容器支持移动端换行 (flex-col sm:flex-row)
		expect(rendered.body).toContain('flex-col sm:flex-row');
		expect(rendered.body).toContain('hidden sm:inline');
	});

	it('renders only Todolist button when isMe=false', () => {
		const rendered = render(UserProfileCard, {
			props: {
				user: mockUser,
				isMe: false
			}
		});

		expect(rendered.body).toContain('href="/@testuser/todolist"');
		expect(rendered.body).toContain(PROFILE_ACTIONS.TODOLIST.LABEL);
		expect(rendered.body).not.toContain(PROFILE_ACTIONS.EDIT.LABEL);
		expect(rendered.body).not.toContain(`title="${PROFILE_ACTIONS.EDIT.TITLE}"`);
		expect(rendered.body).not.toContain('Your Profile');
	});
});
