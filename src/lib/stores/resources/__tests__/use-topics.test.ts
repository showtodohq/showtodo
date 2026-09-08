import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTopicsResource } from '../use-topics.svelte';
import { userStore } from '$lib/stores/user.svelte';
import { api } from '$lib/services/api';
import { todoMutations } from '$lib/stores/mutations.svelte';
import type { TopicItem } from '$lib/types/todo';

function mockTopic(hash: string, content: string, count = 2, done = 1): TopicItem {
	return {
		topicHash: hash,
		content,
		category: 'study',
		isMultiplayer: count > 1,
		totalParticipants: count,
		doneCount: done,
		completionRate: Math.round((done / count) * 100),
		isAllDone: done >= count && count > 0,
		firstCreatedAt: '2026-09-08T00:00:00.000Z',
		lastUpdatedAt: '2026-09-08T01:00:00.000Z',
		participants: [
			{
				todoId: 't1',
				shortId: 's1',
				status: 'done',
				createdAt: '2026-09-08T00:00:00.000Z',
				isMe: false,
				user: {
					id: 'u1',
					nickname: '张三',
					handle: 'zhangsan',
					avatar: null
				}
			},
			{
				todoId: 't2',
				shortId: 's2',
				status: 'pending',
				createdAt: '2026-09-08T01:00:00.000Z',
				isMe: false,
				user: {
					id: 'u2',
					nickname: '李四',
					handle: 'lisi',
					avatar: null
				}
			}
		]
	};
}

describe('createTopicsResource', () => {
	beforeEach(() => {
		userStore.clearSession();
		vi.restoreAllMocks();
	});

	it('initializes with default states', () => {
		const res = createTopicsResource();
		expect(res.topics).toEqual([]);
		expect(res.total).toBe(0);
		expect(res.loading).toBe(false);
		expect(res.loaded).toBe(false);
		expect(res.error).toBeNull();
		expect(res.category).toBe('all');
		expect(res.scope).toBe('all');
		expect(res.sortBy).toBe('participants');
		expect(res.timeRange).toBe('all');
		expect(res.search).toBe('');
		expect(res.minParticipants).toBe(1);
	});

	it('loads topics successfully', async () => {
		const res = createTopicsResource();
		const mockData = [mockTopic('h1', '每日背单词', 3, 2)];

		vi.spyOn(api, 'getTopics').mockResolvedValueOnce({
			total: 1,
			topics: mockData,
			hasMore: false
		});

		await res.load();

		expect(res.topics.length).toBe(1);
		expect(res.topics[0].content).toBe('每日背单词');
		expect(res.total).toBe(1);
		expect(res.hasMore).toBe(false);
		expect(res.loaded).toBe(true);
		expect(res.loading).toBe(false);
	});

	it('updates filters and triggers reload', async () => {
		const res = createTopicsResource();
		const spy = vi.spyOn(api, 'getTopics').mockResolvedValue({
			total: 0,
			topics: [],
			hasMore: false
		});

		res.setCategory('fitness');
		expect(res.category).toBe('fitness');

		res.setScope('mine');
		expect(res.scope).toBe('mine');

		res.setSortBy('completion');
		expect(res.sortBy).toBe('completion');

		res.setTimeRange('today');
		expect(res.timeRange).toBe('today');

		res.setMinParticipants(2);
		expect(res.minParticipants).toBe(2);

		expect(spy).toHaveBeenCalled();
	});

	it('supports pagination via loadMore', async () => {
		const res = createTopicsResource();
		const topic1 = mockTopic('h1', '目标1');
		const topic2 = mockTopic('h2', '目标2');

		vi.spyOn(api, 'getTopics')
			.mockResolvedValueOnce({
				total: 2,
				topics: [topic1],
				hasMore: true
			})
			.mockResolvedValueOnce({
				total: 2,
				topics: [topic2],
				hasMore: false
			});

		await res.load(true);
		expect(res.topics.length).toBe(1);
		expect(res.hasMore).toBe(true);

		await res.loadMore();
		expect(res.topics.length).toBe(2);
		expect(res.hasMore).toBe(false);
	});

	it('handles optimistic join topic', async () => {
		userStore.setSession({
			id: 'my-id',
			email: 'me@example.com',
			nickname: '测试用户',
			handle: 'tester'
		});

		const res = createTopicsResource();
		const topic = mockTopic('h1', '每日跑步5公里', 1, 0);

		vi.spyOn(api, 'getTopics').mockResolvedValueOnce({
			total: 1,
			topics: [topic],
			hasMore: false
		});

		const joinSpy = vi.spyOn(todoMutations, 'joinTopic').mockResolvedValueOnce({} as any);

		await res.load();
		expect(res.topics[0].totalParticipants).toBe(1);

		await res.handleJoin(res.topics[0]);

		expect(res.topics[0].totalParticipants).toBe(2);
		expect(res.topics[0].isMultiplayer).toBe(true);
		expect(res.topics[0].participants[0].isMe).toBe(true);
		expect(joinSpy).toHaveBeenCalledWith({
			content: '每日跑步5公里',
			category: 'study'
		});
	});
});
