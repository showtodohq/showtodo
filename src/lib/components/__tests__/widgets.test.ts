import { describe, it, expect } from 'vitest';
import ActivityHeatmap from '../stats/ActivityHeatmap.svelte';
import CategoryDonutChart from '../stats/CategoryDonutChart.svelte';
import SiteStatsWidget from '../widgets/SiteStatsWidget.svelte';
import MyTodayWidget from '../widgets/MyTodayWidget.svelte';
import TrendingTopicsWidget from '../widgets/TrendingTopicsWidget.svelte';
import { statsStore } from '$lib/stores/stats.svelte';
import { userStore } from '$lib/stores/user.svelte';
import { trendingStore } from '$lib/stores/todo.svelte';
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

	it('renders SiteStatsWidget with borderless aesthetics matching settings page', () => {
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
		expect(rendered.body).toContain('Site Pulse');
		expect(rendered.body).toContain('10 people');
		expect(rendered.body).toContain('100');
		expect(rendered.body).toContain('45');
		expect(rendered.body).toContain('70 activities');
		expect(rendered.body).toContain('Overall Completion');

		// 验证无边框无背景设计，向设置页看齐
		expect(rendered.body).not.toContain('backdrop-blur');
		expect(rendered.body).not.toContain('border-zinc-200/80');
	});

	it('renders MyTodayWidget with borderless aesthetics and "View all" link when user is logged in', () => {
		userStore.setSession({
			id: 'u1',
			email: 'test@example.com',
			nickname: 'Test User',
			handle: 'test'
		});

		const rendered = render(MyTodayWidget);
		expect(rendered.body).toContain('My Today');
		expect(rendered.body).not.toContain("My Today's Todos");
		expect(rendered.body).toContain('href="/@test/todolist"');
		expect(rendered.body).toContain('View all');

		// 验证无边框无背景设计，向设置页看齐
		expect(rendered.body).not.toContain('backdrop-blur');
		expect(rendered.body).not.toContain('border-zinc-200/80');
	});

	it('renders TrendingTopicsWidget with borderless aesthetics', () => {
		trendingStore.cards = [
			{
				topicHash: 'th_1',
				content: 'Morning 5km run',
				category: 'fitness',
				totalParticipants: 3,
				doneCount: 1,
				isMultiplayer: true,
				participants: []
			}
		];
		trendingStore.loaded = true;

		const rendered = render(TrendingTopicsWidget);
		expect(rendered.body).toContain("Today's Trending");
		expect(rendered.body).not.toContain("Today's Trending Todos");
		expect(rendered.body).toContain('TOP 5');
		expect(rendered.body).toContain('Morning 5km run');

		// 验证无边框无背景设计，向设置页看齐
		expect(rendered.body).not.toContain('backdrop-blur');
		expect(rendered.body).not.toContain('border-zinc-200/80');
	});

	it('renders ActivityHeatmap fallback placeholder when days array is empty', () => {
		const rendered = render(ActivityHeatmap, {
			props: {
				days: [],
				compact: false
			}
		});
		expect(rendered.body).toContain('No records');
	});

	it('renders CategoryDonutChart EmptyState when categories array is empty', () => {
		const rendered = render(CategoryDonutChart, {
			props: {
				categories: [],
				totalTodos: 0
			}
		});
		expect(rendered.body).toContain('No category data available');
	});
});
