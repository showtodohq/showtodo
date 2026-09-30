import { describe, it, expect, vi } from 'vitest';
import { listTopics } from '../services/todo.service';
import type { Database } from '../db';

describe('listTopics unit tests (DDD Service Layer)', () => {
	it('returns empty result when count query returns 0', async () => {
		const mockDb = {
			execute: vi.fn().mockResolvedValueOnce([{ total: 0 }])
		} as unknown as Database;

		const result = await listTopics(mockDb, {
			category: 'study',
			scope: 'all',
			sortBy: 'participants',
			limit: 10,
			offset: 0
		});

		expect(result).toEqual({
			total: 0,
			topics: [],
			hasMore: false
		});
		expect(mockDb.execute).toHaveBeenCalledTimes(1);
	});

	it('correctly parses topics, deduplicates participants, and computes completion stats', async () => {
		const mockDb = {
			execute: vi
				.fn()
				.mockResolvedValueOnce([{ total: 2 }]) // count query
				.mockResolvedValueOnce([
					{
						topic_hash: 'hash-abc',
						content: '每天早起跑步5公里',
						category: 'fitness',
						first_created_at: '2026-09-01T08:00:00.000Z',
						last_updated_at: '2026-09-08T09:00:00.000Z',
						total_participants: 2,
						done_count: 2,
						participants: [
							{
								todoId: 't1',
								shortId: 's1',
								status: 'done',
								note: null,
								createdAt: '2026-09-01T08:00:00.000Z',
								isMe: true,
								user: { id: 'u1', nickname: '我', handle: 'me', avatar: null }
							},
							{
								todoId: 't2',
								shortId: 's2',
								status: 'done',
								note: '打卡完毕',
								createdAt: '2026-09-02T08:00:00.000Z',
								isMe: false,
								user: { id: 'u2', nickname: '伙伴', handle: 'partner', avatar: 'avatar.png' }
							}
						]
					}
				]) // topics query
		} as unknown as Database;

		const result = await listTopics(mockDb, {
			sortBy: 'completion',
			minParticipants: 2,
			limit: 1,
			offset: 0
		});

		expect(result.total).toBe(2);
		expect(result.hasMore).toBe(true);
		expect(result.topics.length).toBe(1);

		const topic = result.topics[0];
		expect(topic.topicHash).toBe('hash-abc');
		expect(topic.content).toBe('每天早起跑步5公里');
		expect(topic.category).toBe('fitness');
		expect(topic.isMultiplayer).toBe(true);
		expect(topic.totalParticipants).toBe(2);
		expect(topic.doneCount).toBe(2);
		expect(topic.completionRate).toBe(100);
		expect(topic.isAllDone).toBe(true);
		expect(topic.participants.length).toBe(2);
		expect(topic.participants[0].isMe).toBe(true);
	});

	it('deduplicates multiple todos from the same user preserving optimal status', async () => {
		const mockDb = {
			execute: vi
				.fn()
				.mockResolvedValueOnce([{ total: 1 }])
				.mockResolvedValueOnce([
					{
						topic_hash: 'hash-xyz',
						content: '复习高等数学',
						category: 'study',
						first_created_at: '2026-09-05T00:00:00.000Z',
						last_updated_at: '2026-09-06T00:00:00.000Z',
						total_participants: 1,
						done_count: 1,
						participants: [
							{
								todoId: 't1',
								shortId: 's1',
								status: 'pending',
								createdAt: '2026-09-05T00:00:00.000Z',
								isMe: false,
								user: { id: 'u1', nickname: '同学', handle: 'classmate', avatar: null }
							},
							{
								todoId: 't2',
								shortId: 's2',
								status: 'done',
								createdAt: '2026-09-06T00:00:00.000Z',
								isMe: false,
								user: { id: 'u1', nickname: '同学', handle: 'classmate', avatar: null }
							}
						]
					}
				])
		} as unknown as Database;

		const result = await listTopics(mockDb, {
			limit: 10,
			offset: 0
		});

		expect(result.topics.length).toBe(1);
		const topic = result.topics[0];
		expect(topic.participants.length).toBe(1);
		expect(topic.participants[0].status).toBe('done');
	});

	it('getTopicByHash strictly separates today participants from all history participants', async () => {
		const { getTopicByHash } = await import('../services/todo.service');

		const yesterdayStr = '2026-09-10T10:00:00.000Z';
		const mockResult = [
			{
				todos: {
					id: 't-yesterday',
					shortId: 'short1',
					topicHash: 'hash-test',
					content: '测试目标',
					category: 'study',
					status: 'done',
					note: null,
					isNotePublic: false,
					startDate: new Date('2026-09-10T10:00:00.000Z'),
					dueDate: null,
					createdAt: new Date('2026-09-10T10:00:00.000Z'),
					authorId: 'u1'
				},
				users: {
					id: 'u1',
					nickname: '昨日伙伴',
					handle: 'yesterday',
					avatar: null
				}
			}
		];

		const mockDb = {
			select: vi.fn().mockReturnValue({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockResolvedValue(mockResult)
						})
					})
				})
			})
		} as unknown as Database;

		// 针对今天 2026-09-11 进行查询
		const topicDetail = await getTopicByHash(
			mockDb,
			'hash-test',
			undefined,
			'2026-09-11',
			undefined,
			undefined,
			'Asia/Shanghai'
		);

		// 今日同行应该为 0，今日列表应该为空
		expect(topicDetail.todayParticipants).toBe(0);
		expect(topicDetail.participants.length).toBe(0);
		// 历史累计应该为 1
		expect(topicDetail.totalParticipants).toBe(1);
		expect(topicDetail.allParticipants?.length).toBe(1);
		expect(topicDetail.allParticipants?.[0].user.id).toBe('u1');
	});

	it('listTopics correctly computes completion stats when user has an older done todo and a newer pending todo', async () => {
		const mockDb = {
			execute: vi
				.fn()
				.mockResolvedValueOnce([{ total: 1 }])
				.mockResolvedValueOnce([
					{
						topic_hash: 'hash-multiday',
						content: '早睡早起',
						category: 'life',
						first_created_at: '2026-09-01T00:00:00.000Z',
						last_updated_at: '2026-09-02T00:00:00.000Z',
						total_participants: 1,
						total_todos: 2,
						done_count: 1,
						participants: [
							{
								todoId: 't-pending-today',
								shortId: 's2',
								status: 'pending',
								createdAt: '2026-09-02T00:00:00.000Z',
								isMe: false,
								user: { id: 'u1', nickname: '自律者', handle: 'disciplined', avatar: null }
							},
							{
								todoId: 't-done-yesterday',
								shortId: 's1',
								status: 'done',
								createdAt: '2026-09-01T00:00:00.000Z',
								isMe: false,
								user: { id: 'u1', nickname: '自律者', handle: 'disciplined', avatar: null }
							}
						]
					}
				])
		} as unknown as Database;

		const result = await listTopics(mockDb, {
			limit: 10,
			offset: 0
		});

		expect(result.topics.length).toBe(1);
		const topic = result.topics[0];
		// 自然人同行人数：1 位
		expect(topic.totalParticipants).toBe(1);
		// 待办条目总数：2 条，已完成 1 条，完成率 50%
		expect(topic.totalTodos).toBe(2);
		expect(topic.doneCount).toBe(1);
		expect(topic.completionRate).toBe(50);
		expect(topic.isAllDone).toBe(false);
		// 头像列表自然人去重：1 位
		expect(topic.participants.length).toBe(1);
	});

	it('getTopicByHash accurately tracks distinct participants and preserves all todo check-ins', async () => {
		const { getTopicByHash } = await import('../services/todo.service');

		const todayStr = '2026-09-12';
		const mockResult = [
			{
				todos: {
					id: 't-afternoon',
					shortId: 'short2',
					topicHash: 'hash-today-multi',
					content: '晨跑打卡',
					category: 'fitness',
					status: 'in_progress',
					note: '下午再跑一次',
					isNotePublic: false,
					startDate: new Date('2026-09-12T14:00:00.000Z'),
					dueDate: null,
					createdAt: new Date('2026-09-12T14:00:00.000Z'),
					authorId: 'u1'
				},
				users: {
					id: 'u1',
					nickname: '晨跑者',
					handle: 'runner',
					avatar: null
				}
			},
			{
				todos: {
					id: 't-morning',
					shortId: 'short1',
					topicHash: 'hash-today-multi',
					content: '晨跑打卡',
					category: 'fitness',
					status: 'done',
					note: null,
					isNotePublic: false,
					startDate: new Date('2026-09-12T08:00:00.000Z'),
					dueDate: null,
					createdAt: new Date('2026-09-12T08:00:00.000Z'),
					authorId: 'u1'
				},
				users: {
					id: 'u1',
					nickname: '晨跑者',
					handle: 'runner',
					avatar: null
				}
			}
		];

		const mockDb = {
			select: vi.fn().mockReturnValue({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockResolvedValue(mockResult)
						})
					})
				})
			})
		} as unknown as Database;

		const topicDetail = await getTopicByHash(
			mockDb,
			'hash-today-multi',
			undefined,
			todayStr,
			undefined,
			undefined,
			'Asia/Shanghai'
		);

		// 今日同行：1 人（自然人去重）
		expect(topicDetail.todayParticipants).toBe(1);
		expect(topicDetail.participants.length).toBe(1);
		expect(topicDetail.participants[0].status).toBe('in_progress');
		expect(topicDetail.participants[0].totalTodos).toBe(2);
		expect(topicDetail.participants[0].doneCount).toBe(1);
		// 今日打卡条目总数与状态统计
		expect(topicDetail.todayTotalTodos).toBe(2);
		expect(topicDetail.todayDoneCount).toBe(1);
		expect(topicDetail.todayInProgressCount).toBe(1);
		expect(topicDetail.isTodayAllDone).toBe(false);

		// 全周期同行人与打卡条目统计
		expect(topicDetail.totalParticipants).toBe(1);
		expect(topicDetail.allParticipants?.length).toBe(1);
		expect(topicDetail.allParticipants?.[0].totalTodos).toBe(2);
		expect(topicDetail.allParticipants?.[0].doneCount).toBe(1);
		expect(topicDetail.totalTodos).toBe(2);
		expect(topicDetail.allDoneCount).toBe(1);
	});

	it('findByIdOrShortId returns participantCount reflecting distinct users, not row count', async () => {
		const { findByIdOrShortId } = await import('../services/todo.service');

		const mockTodo = {
			todos: {
				id: '00000000-0000-0000-0000-000000000001',
				shortId: 'short-test',
				content: '读英语',
				topicHash: 'hash-distinct',
				authorId: '00000000-0000-0000-0000-000000000002',
				status: 'todo',
				category: 'study',
				isNotePublic: false,
				note: null,
				startDate: new Date('2026-09-12T08:00:00.000Z'),
				dueDate: null,
				createdAt: new Date('2026-09-12T08:00:00.000Z'),
				updatedAt: new Date('2026-09-12T08:00:00.000Z')
			},
			users: {
				id: '00000000-0000-0000-0000-000000000002',
				nickname: '学习者',
				handle: 'learner',
				avatar: null
			}
		};

		const reactionService = await import('../services/reaction.service');
		const activityService = await import('../services/activity.service');
		vi.spyOn(reactionService, 'getCountsByTodoIds').mockResolvedValue({});
		vi.spyOn(activityService, 'listByTodoId').mockResolvedValue([]);

		// 假设数据库中同一人发送了 5 次相同待办，但只有 1 位自然人参与者
		const mockDb = {
			select: vi
				.fn()
				// 1. 查询待办本身
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						innerJoin: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								limit: vi.fn().mockResolvedValue([mockTodo])
							})
						})
					})
				})
				// 2. 统计参与人数 count(distinct authorId) => 返回 1（即使有 5 条相同的 todo）
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([{ count: 1 }])
					})
				})
		} as unknown as Database;

		const result = await findByIdOrShortId(mockDb, '00000000-0000-0000-0000-000000000001');
		expect(result).toBeDefined();
		expect(result?.topicParticipantCount).toBe(1);
	});

	it('getTopicInfoByTodoId returns participantCount reflecting distinct users', async () => {
		const { getTopicInfoByTodoId } = await import('../services/todo.service');

		const mockDb = {
			select: vi
				.fn()
				// 1. 查询待办 topicHash
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([{ topicHash: 'hash-distinct' }])
						})
					})
				})
				// 2. 统计参与人数 count(distinct authorId) => 返回 1
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([{ count: 1 }])
					})
				})
		} as unknown as Database;

		const result = await getTopicInfoByTodoId(mockDb, '00000000-0000-0000-0000-000000000001');
		expect(result).toBeDefined();
		expect(result.participantCount).toBe(1);
	});
});
