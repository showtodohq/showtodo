import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import UserProfileCard from '../user/UserProfileCard.svelte';
import {
	PROFILE_ACTIONS,
	PROFILE_ACTION_BUTTON_CLASS,
	PROFILE_ACTION_ICON_CLASS
} from '$lib/constants/profile';
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

describe('UserProfileCard design consistency with settings page (TDD & Design System)', () => {
	it('renders borderless and backgroundless profile section matching settings page design specs', () => {
		const rendered = render(UserProfileCard, {
			props: {
				user: mockUser,
				isMe: true
			}
		});

		const body = rendered.body;

		// 检查 Todolist 按钮: 是一个链接按钮，指向用户的 todolist
		expect(body).toContain('href="/@testuser/todolist"');
		expect(body).toContain(PROFILE_ACTIONS.TODOLIST.LABEL);
		expect(body).toContain(`title="${PROFILE_ACTIONS.TODOLIST.TITLE.replace('&', '&amp;')}"`);

		// 检查 Edit Profile 按钮: 包含编辑按钮标题与文本
		expect(body).toContain(`title="${PROFILE_ACTIONS.EDIT.TITLE}"`);
		expect(body).toContain(PROFILE_ACTIONS.EDIT.LABEL);

		// 验证向设置页设计看齐：无边框无背景 (borderless & backgroundless)，不包含旧版封闭大卡片样式
		expect(body).not.toContain('rounded-3xl');
		expect(body).not.toContain('backdrop-blur');

		// 验证按钮统一采用二次背景无边框与统一尺寸 (size="sm": h-8 rounded-lg)
		expect(body).toContain('rounded-lg');
		expect(body).toContain('bg-zinc-100/70');
		expect(body).toContain('border-0');

		// 验证向设置页看齐的响应式布局结构 (flex flex-col sm:flex-row sm:items-center justify-between gap-4)
		expect(body).toContain('flex flex-col sm:flex-row sm:items-center justify-between gap-4');
	});

	it('does not render "Your Profile" badge and displays user handle and join date', () => {
		const rendered = render(UserProfileCard, {
			props: {
				user: mockUser,
				isMe: true
			}
		});

		// 用户名后面不应出现 "Your Profile" 徽章
		expect(rendered.body).not.toContain('Your Profile');

		// 验证 handle 与 join 时间展示
		expect(rendered.body).toContain('@testuser');
		expect(rendered.body).toContain('Joined 2026-01-01');
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
