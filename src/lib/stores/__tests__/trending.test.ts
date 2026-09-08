import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trendingStore } from '../trending.svelte';
import { api } from '$lib/services/api';
import type { DailyCard, Todo } from '$lib/types/todo';

vi.mock('$lib/services/api', () => ({
	api: {
		getDailyCards: vi.fn()
	}
}));

describe('trendingStore (Trending Topics Store)', () => {
	beforeEach(() => {
		trendingStore.cards = [];
		trendingStore.loading = false;
		trendingStore.loaded = false;
		vi.clearAllMocks();
	});

	it('loads cards on initial call and sets loaded to true', async () => {
		const mockCards: DailyCard[] = [
			{
				topicHash: 'hash-1',
				content: '每日晨跑 5 公里',
				category: 'fitness',
				isMultiplayer: true,
				totalParticipants: 3,
				doneCount: 1,
				participants: []
			}
		];

		vi.mocked(api.getDailyCards).mockResolvedValueOnce({
			date: '2026-09-07',
			totalCards: 1,
			cards: mockCards
		});

		await trendingStore.load();

		expect(api.getDailyCards).toHaveBeenCalledTimes(1);
		expect(trendingStore.cards.length).toBe(1);
		expect(trendingStore.cards[0].content).toBe('每日晨跑 5 公里');
		expect(trendingStore.loaded).toBe(true);
		expect(trendingStore.loading).toBe(false);
	});

	it('supports SWR: background revalidation when loaded is true', async () => {
		// 初始状态为已加载
		trendingStore.cards = [
			{
				topicHash: 'hash-1',
				content: '旧数据',
				category: 'study',
				isMultiplayer: false,
				totalParticipants: 1,
				doneCount: 0,
				participants: []
			}
		];
		trendingStore.loaded = true;

		const freshCards: DailyCard[] = [
			{
				topicHash: 'hash-1',
				content: '新数据',
				category: 'study',
				isMultiplayer: true,
				totalParticipants: 2,
				doneCount: 1,
				participants: []
			}
		];

		vi.mocked(api.getDailyCards).mockResolvedValueOnce({
			date: '2026-09-07',
			totalCards: 1,
			cards: freshCards
		});

		// 即使 force 为 false，SWR 机制也应在后台重新注水
		await trendingStore.load(false);

		expect(api.getDailyCards).toHaveBeenCalledTimes(1);
		expect(trendingStore.cards[0].content).toBe('新数据');
		expect(trendingStore.cards[0].totalParticipants).toBe(2);
	});

	it('syncJoin optimistically increments participant count on existing card', () => {
		trendingStore.cards = [
			{
				topicHash: 'hash-abc',
				content: '背 50 个单词',
				category: 'study',
				isMultiplayer: false,
				totalParticipants: 1,
				doneCount: 0,
				participants: [
					{
						todoId: 'todo-1',
						shortId: 'short-1',
						status: 'pending',
						createdAt: '2026-09-07T08:00:00.000Z',
						isMe: false,
						user: { id: 'u1', nickname: 'Alice', handle: 'alice', avatar: null }
					}
				]
			}
		];

		const currentUser: Todo['author'] = {
			id: 'u2',
			nickname: 'Bob',
			handle: 'bob',
			avatar: null
		};

		const rollback = trendingStore.syncJoin('背 50 个单词', 'temp-123', currentUser);

		expect(trendingStore.cards[0].totalParticipants).toBe(2);
		expect(trendingStore.cards[0].isMultiplayer).toBe(true);
		expect(trendingStore.cards[0].participants.length).toBe(2);
		expect(trendingStore.cards[0].participants[0].user.id).toBe('u2');

		// 回滚测试
		rollback?.();
		expect(trendingStore.cards[0].totalParticipants).toBe(1);
		expect(trendingStore.cards[0].isMultiplayer).toBe(false);
	});
});
