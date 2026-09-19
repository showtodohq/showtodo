import { describe, it, expect } from 'vitest';
import {
	TODOLIST_VIEW_MODES,
	TODOLIST_VIEW_TABS,
	TODO_STATUS_FILTER_ALL,
	TODO_STATUS_FILTER_TABS,
	TRENDING_SCOPE_MODES,
	TRENDING_SCOPE_TABS,
	TRENDING_SORT_OPTIONS,
	THEME_MODES,
	THEME_MODE_TABS,
	TOPIC_PARTICIPANT_MODES,
	TOPIC_PARTICIPANT_TABS
} from '../tabs';
import { TODO_STATUSES } from '../status';

describe('Tabs Domain Constants (DDD)', () => {
	it('defines TODOLIST_VIEW_MODES and tabs correctly', () => {
		expect(TODOLIST_VIEW_MODES.STREAM).toBe('stream');
		expect(TODOLIST_VIEW_MODES.KANBAN).toBe('kanban');
		expect(TODOLIST_VIEW_MODES.CALENDAR).toBe('calendar');
		expect(TODOLIST_VIEW_TABS.map((t) => t.id)).toEqual(['stream', 'kanban', 'calendar']);
	});

	it('derives TODO_STATUS_FILTER_TABS directly from existing TODO_STATUSES without duplicating', () => {
		expect(TODO_STATUS_FILTER_ALL).toBe('all');
		expect(TODO_STATUS_FILTER_TABS[0]).toEqual({ id: 'all', label: 'All' });
		
		// 校验其余 tab 严格继承自 status.ts 中的权威 TODO_STATUSES 配置
		const remainingTabs = TODO_STATUS_FILTER_TABS.slice(1);
		expect(remainingTabs.map((t) => t.id)).toEqual(TODO_STATUSES.map((s) => s.id));
		expect(remainingTabs.map((t) => t.label)).toEqual(TODO_STATUSES.map((s) => s.label));
	});

	it('defines TRENDING_SCOPE_MODES and tabs correctly', () => {
		expect(TRENDING_SCOPE_MODES.ALL).toBe('all');
		expect(TRENDING_SCOPE_MODES.TODAY).toBe('today');
		expect(TRENDING_SCOPE_MODES.MINE).toBe('mine');
		expect(TRENDING_SCOPE_TABS.map((t) => t.id)).toEqual(['all', 'today', 'mine']);
	});

	it('re-exports TRENDING_SORT_OPTIONS from search domain without re-inventing', () => {
		expect(TRENDING_SORT_OPTIONS.length).toBeGreaterThanOrEqual(3);
		expect(TRENDING_SORT_OPTIONS.map((o) => o.id)).toContain('participants');
	});

	it('defines THEME_MODES and tabs correctly', () => {
		expect(THEME_MODES.LIGHT).toBe('light');
		expect(THEME_MODES.DARK).toBe('dark');
		expect(THEME_MODES.SYSTEM).toBe('system');
		expect(THEME_MODE_TABS.map((t) => t.id)).toEqual(['light', 'dark', 'system']);
	});

	it('defines TOPIC_PARTICIPANT_MODES and tabs correctly', () => {
		expect(TOPIC_PARTICIPANT_MODES.TODAY).toBe('today');
		expect(TOPIC_PARTICIPANT_MODES.ALL).toBe('all');
		expect(TOPIC_PARTICIPANT_TABS.map((t) => t.id)).toEqual(['today', 'all']);
	});
});
