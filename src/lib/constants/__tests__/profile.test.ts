import { describe, it, expect } from 'vitest';
import {
	PROFILE_ACTIONS,
	PROFILE_ACTION_BUTTON_CLASS,
	PROFILE_ACTION_ICON_CLASS
} from '../profile';

describe('Profile constants', () => {
	it('defines consistent metadata and styles for profile action buttons', () => {
		expect(PROFILE_ACTIONS.TODOLIST.LABEL).toBe('Todo List');
		expect(PROFILE_ACTIONS.TODOLIST.ICON).toBe('lucide:check-square');
		expect(PROFILE_ACTIONS.TODOLIST.TITLE).toBe('View Todo List (Kanban & Calendar)');

		expect(PROFILE_ACTIONS.EDIT.LABEL).toBe('Edit Profile');
		expect(PROFILE_ACTIONS.EDIT.SHORT_LABEL).toBe('Edit');
		expect(PROFILE_ACTIONS.EDIT.ICON).toBe('lucide:pencil');
		expect(PROFILE_ACTIONS.EDIT.TITLE).toBe('Edit Profile');

		expect(PROFILE_ACTION_BUTTON_CLASS).toContain('bg-zinc-100/70');
		expect(PROFILE_ACTION_BUTTON_CLASS).toContain('hover:bg-zinc-200/70');
		expect(PROFILE_ACTION_BUTTON_CLASS).toContain('border-0');
		expect(PROFILE_ACTION_ICON_CLASS).toContain('group-hover:scale-110');
	});
});
