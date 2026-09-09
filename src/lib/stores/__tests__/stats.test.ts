import { describe, it, expect, beforeEach, vi } from 'vitest';
import { statsStore } from '../stats.svelte';
import { api } from '$lib/services/api';
import type { GlobalStatsData } from '$lib/types/stats';

vi.mock('$lib/services/api', () => ({
	api: {
		getGlobalStats: vi.fn()
	}
}));

describe('statsStore', () => {
	beforeEach(() => {
		statsStore.stats = null;
		statsStore.loading = false;
		statsStore.loaded = false;
		vi.clearAllMocks();
	});

	it('loads stats on initial call and sets loaded to true', async () => {
		const mockData: GlobalStatsData = {
			overview: {
				totalTodos: 10,
				completedTodos: 5,
				inProgressTodos: 2,
				completionRate: 50,
				totalUsers: 3,
				totalReactions: 8,
				todayCreated: 2,
				todayCompleted: 1,
				todayActiveUsers: 2
			},
			categories: [],
			trend: [],
			heatmap: {
				startDate: '2026-03-01',
				endDate: '2026-09-08',
				days: [],
				totalActivities: 15,
				maxDayCount: 5
			},
			topTopics: [],
			topUsers: [],
			updatedAt: '2026-09-08T00:00:00.000Z'
		};

		vi.mocked(api.getGlobalStats).mockResolvedValueOnce(mockData);

		await statsStore.load();

		expect(api.getGlobalStats).toHaveBeenCalledTimes(1);
		expect(statsStore.stats).toEqual(mockData);
		expect(statsStore.loaded).toBe(true);
		expect(statsStore.loading).toBe(false);
	});
});
