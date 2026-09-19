import { describe, it, expect } from 'vitest';
import { PROFILE_ACTIONS } from '../profile';

describe('Profile constants', () => {
	it('defines consistent metadata for profile action buttons', () => {
		expect(PROFILE_ACTIONS.TODOLIST.LABEL).toBe('Todolist');
		expect(PROFILE_ACTIONS.TODOLIST.ICON).toBe('lucide:kanban');
		expect(PROFILE_ACTIONS.TODOLIST.TITLE).toBe('View Todolist (Kanban & Calendar)');

		expect(PROFILE_ACTIONS.EDIT.LABEL).toBe('Edit Profile');
		expect(PROFILE_ACTIONS.EDIT.SHORT_LABEL).toBe('Edit');
		expect(PROFILE_ACTIONS.EDIT.ICON).toBe('lucide:pencil');
		expect(PROFILE_ACTIONS.EDIT.TITLE).toBe('Edit Profile');
	});
});
