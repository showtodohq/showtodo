import { describe, it, expect } from 'vitest';
import ActivityHeatmap from '../stats/ActivityHeatmap.svelte';
import SiteStatsWidget from '../widgets/SiteStatsWidget.svelte';
import MyTodayWidget from '../widgets/MyTodayWidget.svelte';
import { statsStore } from '$lib/stores/stats.svelte';
import { userStore } from '$lib/stores/user.svelte';
import { render } from 'svelte/server';

describe('ActivityHeatmap & SiteStatsWidget rendering test', () => {
	it('renders ActivityHeatmap without crashing when days are provided', () => {
		const mockDays = Array.from({ length: 35 }, (_, i) => ({
			date: `2026-08-${String(i + 1).padStart(2, '0')}`,
			count: i % 5,
			level: (i % 5) as 0 | 1 | 2 | 3 | 4,
			created: 1,
			completed: 1,
			notes: 0
		}));

		const rendered = render(ActivityHeatmap, {
			props: {
				days: mockDays,
				compact: true
			}
		});

		expect(rendered.body).toBeDefined();
	});

	it('renders SiteStatsWidget without crashing', () => {
		statsStore.stats = {
			overview: {
				totalTodos: 100,
				completedTodos: 45,
				inProgressTodos: 20,
				completionRate: 45,
				totalUsers: 10,
				totalReactions: 30,
				todayCreated: 5,
				todayCompleted: 3,
				todayActiveUsers: 4
			},
			categories: [],
			trend: [],
			heatmap: {
				startDate: '2026-08-01',
				endDate: '2026-09-08',
				days: Array.from({ length: 35 }, (_, i) => ({
					date: `2026-08-${String(i + 1).padStart(2, '0')}`,
					count: 2,
					level: 2 as const,
					created: 1,
					completed: 1,
					notes: 0
				})),
				totalActivities: 70,
				maxDayCount: 5
			},
			topTopics: [],
			topUsers: [],
			updatedAt: '2026-09-08T00:00:00.000Z'
		};
		statsStore.loaded = true;

		const rendered = render(SiteStatsWidget);
		expect(rendered.body).toContain('全站数据脉搏');
		expect(rendered.body).toContain('100');
		expect(rendered.body).toContain('45');
		expect(rendered.body).toContain('70 次足迹');
		expect(rendered.body).toContain('全站完成率');
	});

	it('renders MyTodayWidget with "全部" link when user is logged in', () => {
		userStore.setSession({
			id: 'u1',
			email: 'test@example.com',
			nickname: '测试用户',
			handle: 'test'
		});

		const rendered = render(MyTodayWidget);
		expect(rendered.body).toContain('我的今日待办');
		expect(rendered.body).toContain('href="/todos"');
		expect(rendered.body).toContain('全部');
	});
});
