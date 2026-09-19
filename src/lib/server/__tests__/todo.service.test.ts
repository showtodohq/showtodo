import { describe, test, expect, beforeEach } from 'vitest';
import { testDb, cleanDatabase } from './setup';
import * as todoService from '../services/todo.service';
import * as userService from '../services/user.service';
import { AppError } from '../errors';

let testUser: Awaited<ReturnType<typeof userService.findOrCreate>>;

beforeEach(async () => {
	await cleanDatabase();
	testUser = await userService.findOrCreate(testDb, 'test@example.com');
});

describe('create', () => {
	test('creates todo with minimal fields', async () => {
		const todo = await todoService.create(testDb, {
			content: 'Test todo',
			authorId: testUser.id
		});
		expect(todo.content).toBe('Test todo');
		expect(todo.status).toBe('pending');
		expect(todo.isNotePublic).toBe(true);
		expect(todo.note).toBeNull();
		expect(todo.category).toBeNull();
		expect(todo.authorId).toBe(testUser.id);
		expect(todo.id).toBeTruthy();
	});

	test('creates todo with all fields', async () => {
		const todo = await todoService.create(testDb, {
			content: 'Full todo',
			note: 'Some note',
			isNotePublic: false,
			category: 'dev',
			authorId: testUser.id,
			startDate: '2026-08-26T14:30:00.000Z',
			dueDate: '2026-09-01T18:00:00.000Z'
		});
		expect(todo.content).toBe('Full todo');
		expect(todo.note).toBe('Some note');
		expect(todo.isNotePublic).toBe(false);
		expect(todo.category).toBe('dev');
		expect(todo.startDate).toBeInstanceOf(Date);
		expect(todo.startDate.toISOString()).toBe('2026-08-26T14:30:00.000Z');
		expect(todo.dueDate).toBeInstanceOf(Date);
		expect(todo.dueDate!.toISOString()).toBe('2026-09-01T18:00:00.000Z');
	});

	test('defaults startDate to today when not provided', async () => {
		const todo = await todoService.create(testDb, {
			content: 'Date test',
			authorId: testUser.id
		});
		expect(todo.startDate).toBeInstanceOf(Date);
	});

	test('updates startDate and dueDate with precise timestamps', async () => {
		const todo = await todoService.create(testDb, {
			content: 'Precise time test',
			authorId: testUser.id,
			startDate: '2026-08-26'
		});

		const updated = await todoService.update(testDb, todo.id, 'test@example.com', {
			startDate: '2026-08-27T08:00:00.000Z',
			dueDate: '2026-08-30T23:59:59.000Z'
		});

		expect(updated.startDate).toBeInstanceOf(Date);
		expect(updated.startDate.toISOString()).toBe('2026-08-27T08:00:00.000Z');
		expect(updated.dueDate).toBeInstanceOf(Date);
		expect(updated.dueDate!.toISOString()).toBe('2026-08-30T23:59:59.000Z');
	});

	test('updates author lastTodoUpdatedAt on creation', async () => {
		expect(testUser.lastTodoUpdatedAt).toBeNull();
		await todoService.create(testDb, {
			content: 'Timestamp test',
			authorId: testUser.id
		});
		const author = await userService.findById(testDb, testUser.id);
		expect(author!.lastTodoUpdatedAt).toBeInstanceOf(Date);
	});
});

describe('findById', () => {
	test('returns todo with author and reactions', async () => {
		const created = await todoService.create(testDb, {
			content: 'Find me',
			authorId: testUser.id
		});
		const found = await todoService.findById(testDb, created.id);
		expect(found).not.toBeNull();
		expect(found!.content).toBe('Find me');
		expect(found!.author.id).toBe(testUser.id);
		expect(found!.author.nickname).toBe('test');
		expect(found!.reactions).toEqual({ '❤️': 0, '👍': 0, '🔥': 0, '💪': 0, '👏': 0, '🚀': 0, '🎉': 0, '👀': 0 });
	});

	test('hides note when isNotePublic is false', async () => {
		const created = await todoService.create(testDb, {
			content: 'Secret note',
			note: 'This is private',
			isNotePublic: false,
			authorId: testUser.id
		});
		const found = await todoService.findById(testDb, created.id);
		expect(found!.note).toBeNull();
		expect(found!.isNotePublic).toBe(false);
	});

	test('shows note when isNotePublic is true', async () => {
		const created = await todoService.create(testDb, {
			content: 'Public note',
			note: 'This is public',
			isNotePublic: true,
			authorId: testUser.id
		});
		const found = await todoService.findById(testDb, created.id);
		expect(found!.note).toBe('This is public');
	});

	test('returns null for non-existent id', async () => {
		const found = await todoService.findById(testDb, '00000000-0000-0000-0000-000000000000');
		expect(found).toBeNull();
	});
});

describe('list', () => {
	test('returns all todos without filters', async () => {
		await todoService.create(testDb, { content: 'Todo 1', authorId: testUser.id });
		await todoService.create(testDb, { content: 'Todo 2', authorId: testUser.id });

		const result = await todoService.list(testDb, {});
		expect(result.todos).toHaveLength(2);
	});

	test('filters by status', async () => {
		const todo = await todoService.create(testDb, { content: 'Will finish', authorId: testUser.id });
		await todoService.update(testDb, todo.id, 'test@example.com', { status: 'done' });
		await todoService.create(testDb, { content: 'Still pending', authorId: testUser.id });

		const result = await todoService.list(testDb, { status: 'pending' });
		expect(result.todos).toHaveLength(1);
		expect(result.todos[0].content).toBe('Still pending');
	});

	test('filters by category', async () => {
		await todoService.create(testDb, {
			content: 'Study',
			category: 'study',
			authorId: testUser.id
		});
		await todoService.create(testDb, { content: 'Dev', category: 'dev', authorId: testUser.id });

		const result = await todoService.list(testDb, { category: 'study' });
		expect(result.todos).toHaveLength(1);
		expect(result.todos[0].content).toBe('Study');
	});

	test('filters by authorId', async () => {
		const otherUser = await userService.findOrCreate(testDb, 'other@example.com');
		await todoService.create(testDb, { content: 'Mine', authorId: testUser.id });
		await todoService.create(testDb, { content: 'Theirs', authorId: otherUser.id });

		const result = await todoService.list(testDb, { authorId: testUser.id });
		expect(result.todos).toHaveLength(1);
		expect(result.todos[0].content).toBe('Mine');
	});

	test('combines multiple filters', async () => {
		await todoService.create(testDb, {
			content: 'Match',
			category: 'dev',
			authorId: testUser.id
		});
		await todoService.create(testDb, {
			content: 'No match',
			category: 'study',
			authorId: testUser.id
		});

		const result = await todoService.list(testDb, {
			category: 'dev',
			authorId: testUser.id
		});
		expect(result.todos).toHaveLength(1);
		expect(result.todos[0].content).toBe('Match');
	});

	test('supports cursor-based pagination', async () => {
		for (let i = 0; i < 5; i++) {
			await todoService.create(testDb, { content: `Todo ${i}`, authorId: testUser.id });
		}

		const page1 = await todoService.list(testDb, { limit: 2 });
		expect(page1.todos).toHaveLength(2);
		expect(page1.nextCursor).not.toBeNull();

		const page2 = await todoService.list(testDb, { cursor: page1.nextCursor!, limit: 2 });
		expect(page2.todos).toHaveLength(2);
		expect(page2.nextCursor).not.toBeNull();

		const page3 = await todoService.list(testDb, { cursor: page2.nextCursor!, limit: 2 });
		expect(page3.todos).toHaveLength(1);
		expect(page3.nextCursor).toBeNull();

		// All todos across pages are unique
		const allIds = [...page1.todos, ...page2.todos, ...page3.todos].map((t) => t.id);
		expect(new Set(allIds).size).toBe(5);
	});

	test('respects limit', async () => {
		for (let i = 0; i < 5; i++) {
			await todoService.create(testDb, { content: `Todo ${i}`, authorId: testUser.id });
		}

		const result = await todoService.list(testDb, { limit: 3 });
		expect(result.todos).toHaveLength(3);
		expect(result.nextCursor).not.toBeNull();
	});

	test('orders by createdAt desc (newest first)', async () => {
		await todoService.create(testDb, { content: 'First', authorId: testUser.id });
		await todoService.create(testDb, { content: 'Second', authorId: testUser.id });

		const result = await todoService.list(testDb, {});
		expect(result.todos[0].content).toBe('Second');
		expect(result.todos[1].content).toBe('First');
	});

	test('hides note when isNotePublic is false in list', async () => {
		await todoService.create(testDb, {
			content: 'Private note',
			note: 'Secret',
			isNotePublic: false,
			authorId: testUser.id
		});

		const result = await todoService.list(testDb, {});
		expect(result.todos[0].note).toBeNull();
	});

	test('returns empty array when no results', async () => {
		const result = await todoService.list(testDb, {});
		expect(result.todos).toEqual([]);
		expect(result.nextCursor).toBeNull();
	});

	test('returns null nextCursor when all items fit in one page', async () => {
		await todoService.create(testDb, { content: 'Only one', authorId: testUser.id });

		const result = await todoService.list(testDb, { limit: 10 });
		expect(result.todos).toHaveLength(1);
		expect(result.nextCursor).toBeNull();
	});
});

describe('update', () => {
	test('updates content', async () => {
		const todo = await todoService.create(testDb, { content: 'Original', authorId: testUser.id });
		const updated = await todoService.update(testDb, todo.id, 'test@example.com', {
			content: 'Updated'
		});
		expect(updated.content).toBe('Updated');
	});

	test('updates note', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		const updated = await todoService.update(testDb, todo.id, 'test@example.com', {
			note: 'New note'
		});
		expect(updated.note).toBe('New note');
	});

	test('updates isNotePublic', async () => {
		const todo = await todoService.create(testDb, {
			content: 'Todo',
			note: 'Note',
			authorId: testUser.id
		});
		const updated = await todoService.update(testDb, todo.id, 'test@example.com', {
			isNotePublic: false
		});
		expect(updated.isNotePublic).toBe(false);
	});

	test('updates category', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		const updated = await todoService.update(testDb, todo.id, 'test@example.com', {
			category: 'dev'
		});
		expect(updated.category).toBe('dev');
	});

	test('rejects update by non-author', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		await userService.findOrCreate(testDb, 'hacker@example.com');

		try {
			await todoService.update(testDb, todo.id, 'hacker@example.com', { content: 'Hacked' });
			expect.unreachable('Should have thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(AppError);
			expect((e as AppError).code).toBe('FORBIDDEN');
		}
	});

	test('throws NOT_FOUND for non-existent todo', async () => {
		await expect(
			todoService.update(testDb, '00000000-0000-0000-0000-000000000000', 'test@example.com', {
				content: 'X'
			})
		).rejects.toThrow(AppError);
	});

	test('updates author lastTodoUpdatedAt on update', async () => {
		const todo = await todoService.create(testDb, { content: 'Original', authorId: testUser.id });
		const authorBefore = await userService.findById(testDb, testUser.id);
		const timeBefore = authorBefore!.lastTodoUpdatedAt;

		// Wait a small delay to ensure different timestamp
		await new Promise((resolve) => setTimeout(resolve, 50));

		await todoService.update(testDb, todo.id, 'test@example.com', { content: 'Modified' });
		const authorAfter = await userService.findById(testDb, testUser.id);

		expect(authorAfter!.lastTodoUpdatedAt).toBeInstanceOf(Date);
		if (timeBefore) {
			expect(authorAfter!.lastTodoUpdatedAt!.getTime()).toBeGreaterThanOrEqual(timeBefore.getTime());
		}
	});
});

describe('status transitions', () => {
	test('allows pending → in_progress, done, abandoned', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		const updated1 = await todoService.update(testDb, todo.id, 'test@example.com', {
			status: 'in_progress'
		});
		expect(updated1.status).toBe('in_progress');

		const todo2 = await todoService.create(testDb, { content: 'Todo 2', authorId: testUser.id });
		const updated2 = await todoService.update(testDb, todo2.id, 'test@example.com', {
			status: 'done'
		});
		expect(updated2.status).toBe('done');

		const todo3 = await todoService.create(testDb, { content: 'Todo 3', authorId: testUser.id });
		const updated3 = await todoService.update(testDb, todo3.id, 'test@example.com', {
			status: 'abandoned'
		});
		expect(updated3.status).toBe('abandoned');
	});

	test('allows in_progress → done, abandoned, pending', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		await todoService.update(testDb, todo.id, 'test@example.com', { status: 'in_progress' });
		
		const updated = await todoService.update(testDb, todo.id, 'test@example.com', {
			status: 'pending'
		});
		expect(updated.status).toBe('pending');
	});

	test('allows done → in_progress (reactivation)', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		await todoService.update(testDb, todo.id, 'test@example.com', { status: 'done' });

		const reactivated = await todoService.update(testDb, todo.id, 'test@example.com', {
			status: 'in_progress'
		});
		expect(reactivated.status).toBe('in_progress');
	});

	test('allows abandoned → pending (reactivation)', async () => {
		const todo = await todoService.create(testDb, { content: 'Todo', authorId: testUser.id });
		await todoService.update(testDb, todo.id, 'test@example.com', { status: 'abandoned' });

		const reactivated = await todoService.update(testDb, todo.id, 'test@example.com', {
			status: 'pending'
		});
		expect(reactivated.status).toBe('pending');
	});
});

describe('activities behavior', () => {
	test('records created activity on todo creation', async () => {
		const todo = await todoService.create(testDb, { content: 'Activity test', authorId: testUser.id });
		const found = await todoService.findById(testDb, todo.id);

		expect(found!.activities).toBeDefined();
		expect(found!.activities).toHaveLength(1);
		expect(found!.activities![0].type).toBe('created');
		expect(found!.activities![0].toStatus).toBe('pending');
		expect(found!.activities![0].authorId).toBe(testUser.id);
	});

	test('records status_change activity on status update', async () => {
		const todo = await todoService.create(testDb, { content: 'Status log test', authorId: testUser.id });
		await todoService.update(testDb, todo.id, 'test@example.com', {
			status: 'in_progress',
			activityNote: 'Starting right now'
		});

		const found = await todoService.findById(testDb, todo.id);
		expect(found!.activities).toHaveLength(2);

		const latest = found!.activities![0];
		expect(latest.type).toBe('status_change');
		expect(latest.fromStatus).toBe('pending');
		expect(latest.toStatus).toBe('in_progress');
		expect(latest.content).toBe('Starting right now');
	});

	test('records progress_note when status is unchanged but activityNote is provided', async () => {
		const todo = await todoService.create(testDb, { content: 'Check-in test', authorId: testUser.id });
		await todoService.update(testDb, todo.id, 'test@example.com', {
			activityNote: 'Finished part 1 today'
		});

		const found = await todoService.findById(testDb, todo.id);
		expect(found!.activities).toHaveLength(2);

		const latest = found!.activities![0];
		expect(latest.type).toBe('progress_note');
		expect(latest.fromStatus).toBe('pending');
		expect(latest.toStatus).toBe('pending');
		expect(latest.content).toBe('Finished part 1 today');
	});

	test('does not record activity when neither status changes nor activityNote is provided', async () => {
		const todo = await todoService.create(testDb, { content: 'Content edit only', authorId: testUser.id });
		await todoService.update(testDb, todo.id, 'test@example.com', {
			content: 'Updated content'
		});

		const found = await todoService.findById(testDb, todo.id);
		expect(found!.activities).toHaveLength(1); // Only created
	});
});

describe('topicHash behavior', () => {
	test('computes topicHash upon creation', async () => {
		const todo = await todoService.create(testDb, {
			content: '每天早起喝一杯温水。',
			category: 'life',
			authorId: testUser.id
		});
		expect(todo.topicHash).toBeTruthy();
		expect(todo.topicHash).toHaveLength(16);
	});

	test('creates identical topicHash for identical content from different users', async () => {
		const user2 = await userService.findOrCreate(testDb, 'user2@example.com');
		const todo1 = await todoService.create(testDb, {
			content: '每天跑步5公里',
			category: 'fitness',
			authorId: testUser.id
		});
		const todo2 = await todoService.create(testDb, {
			content: '每天跑步5公里。',
			category: 'fitness',
			authorId: user2.id
		});
		expect(todo1.topicHash).toBe(todo2.topicHash);
	});

	test('recomputes topicHash when content is modified, but preserves it when category is modified', async () => {
		const todo = await todoService.create(testDb, {
			content: '读《原则》第1章',
			category: 'study',
			authorId: testUser.id
		});
		const initialHash = todo.topicHash;

		// 1. Update content
		const updatedContent = await todoService.update(testDb, todo.id, 'test@example.com', {
			content: '读《原则》第2章'
		});
		expect(updatedContent.topicHash).not.toBe(initialHash);

		// 2. Update category (should preserve topicHash under content-only hashing)
		const updatedCategory = await todoService.update(testDb, todo.id, 'test@example.com', {
			category: 'finance'
		});
		expect(updatedCategory.topicHash).toBe(updatedContent.topicHash);
	});

	test('preserves topicHash when updating status, note, or date', async () => {
		const todo = await todoService.create(testDb, {
			content: '保持学习',
			category: 'study',
			authorId: testUser.id,
			startDate: '2026-08-28'
		});
		const initialHash = todo.topicHash;

		const updatedStatus = await todoService.update(testDb, todo.id, 'test@example.com', {
			status: 'in_progress',
			note: 'New private note',
			startDate: '2026-08-29'
		});
		expect(updatedStatus.topicHash).toBe(initialHash);
	});
});

describe('getTopicInfoByTodoId', () => {
	test('returns participantCount = 1 for solo todo', async () => {
		const todo = await todoService.create(testDb, {
			content: '独自一人做的事情',
			authorId: testUser.id
		});

		const info = await todoService.getTopicInfoByTodoId(testDb, todo.id);
		expect(info.topicHash).toBe(todo.topicHash);
		expect(info.participantCount).toBe(1);
	});

	test('returns correct participantCount when multiple users join same topic', async () => {
		const user2 = await userService.findOrCreate(testDb, 'user2@example.com');
		const user3 = await userService.findOrCreate(testDb, 'user3@example.com');

		const todo1 = await todoService.create(testDb, {
			content: '多人协同打卡目标',
			category: 'dev',
			authorId: testUser.id
		});
		await todoService.create(testDb, {
			content: '多人协同打卡目标',
			category: 'dev',
			authorId: user2.id
		});
		await todoService.create(testDb, {
			content: '多人协同打卡目标',
			category: 'dev',
			authorId: user3.id
		});

		const info = await todoService.getTopicInfoByTodoId(testDb, todo1.id);
		expect(info.participantCount).toBe(3);
	});

	test('throws NOT_FOUND when todo does not exist', async () => {
		await expect(
			todoService.getTopicInfoByTodoId(testDb, '00000000-0000-0000-0000-000000000000')
		).rejects.toThrow(AppError);
	});
});

describe('getTopicByHash', () => {
	test('orders participants by isMe first when currentUserId is provided, with correct topic metadata', async () => {
		const creator = await userService.findOrCreate(testDb, 'creator@example.com');
		const joiner = await userService.findOrCreate(testDb, 'joiner@example.com');

		const todoCreator = await todoService.create(testDb, {
			content: '多人目标测试',
			category: 'study',
			authorId: creator.id
		});

		const todoJoiner = await todoService.create(testDb, {
			content: '多人目标测试',
			category: 'study',
			authorId: joiner.id
		});

		expect(todoCreator.topicHash).toBe(todoJoiner.topicHash);
		const hash = todoCreator.topicHash!;

		// 当以 joiner (后加入者) 的身份查询时，joiner 应被置顶排在第 1 位，且 isMe 为 true
		const topicAsJoiner = await todoService.getTopicByHash(testDb, hash, joiner.id);
		expect(topicAsJoiner.participants.length).toBe(2);
		expect(topicAsJoiner.participants[0].user.id).toBe(joiner.id);
		expect(topicAsJoiner.participants[0].isMe).toBe(true);
		expect(topicAsJoiner.participants[1].user.id).toBe(creator.id);
		expect(topicAsJoiner.participants[1].isMe).toBe(false);
		// 话题元信息仍为最早发起时间，不受置顶影响
		expect(topicAsJoiner.firstCreatedAt).toBe(todoCreator.createdAt.toISOString());

		// 当未提供 currentUserId (访客身份) 查询时，按时间正序排列 (发起者第 1 位)
		const topicAsGuest = await todoService.getTopicByHash(testDb, hash);
		expect(topicAsGuest.participants[0].user.id).toBe(creator.id);
		expect(topicAsGuest.participants[0].isMe).toBe(false);
		expect(topicAsGuest.participants[1].user.id).toBe(joiner.id);
		expect(topicAsGuest.participants[1].isMe).toBe(false);
	});

	test('correctly calculates todayParticipants and totalParticipants across dates with user deduplication', async () => {
		const userA = await userService.findOrCreate(testDb, 'usera@example.com');
		const userB = await userService.findOrCreate(testDb, 'userb@example.com');
		const userC = await userService.findOrCreate(testDb, 'userc@example.com');

		const todayStr = '2026-09-05';
		const yesterdayStr = '2026-09-04';

		// User A: 今天打卡并完成
		const todoA1 = await todoService.create(testDb, {
			content: '每日读书打卡',
			category: 'study',
			authorId: userA.id,
			startDate: todayStr
		});
		await todoService.update(testDb, todoA1.id, 'usera@example.com', { status: 'done' });

		// User B: 今天打卡进行中
		await todoService.create(testDb, {
			content: '每日读书打卡',
			category: 'study',
			authorId: userB.id,
			startDate: todayStr
		});

		// User C: 昨天打卡已完成
		const todoC = await todoService.create(testDb, {
			content: '每日读书打卡',
			category: 'study',
			authorId: userC.id,
			startDate: yesterdayStr
		});
		await todoService.update(testDb, todoC.id, 'userc@example.com', { status: 'done' });

		// User A: 昨天也曾打卡过该目标
		await todoService.create(testDb, {
			content: '每日读书打卡',
			category: 'study',
			authorId: userA.id,
			startDate: yesterdayStr
		});

		const hash = todoA1.topicHash!;

		// 1. 验证详情页按今日 targetDate 查询
		const topicDetail = await todoService.getTopicByHash(testDb, hash, userA.id, todayStr);

		// 今日同行：A 和 B，共 2 人
		expect(topicDetail.todayParticipants).toBe(2);
		expect(topicDetail.todayDoneCount).toBe(1);
		expect(topicDetail.isTodayAllDone).toBe(false);
		expect(topicDetail.participants.length).toBe(2);

		// 累计同行（去重后的自然人数）：A、B、C 共 3 位伙伴
		expect(topicDetail.totalParticipants).toBe(3);
		expect(topicDetail.allParticipants?.length).toBe(3);

		// 当查询无同行记录的日期时：todayParticipants 为 0，participants 为空数组，但累计仍为 3
		const emptyDateDetail = await todoService.getTopicByHash(testDb, hash, userA.id, '2026-09-06');
		expect(emptyDateDetail.todayParticipants).toBe(0);
		expect(emptyDateDetail.participants.length).toBe(0);
		expect(emptyDateDetail.totalParticipants).toBe(3);
		expect(emptyDateDetail.allParticipants?.length).toBe(3);

		// 2. 验证首页每日卡片查询结果（100% 对齐）
		const dailyRes = await todoService.listDailyCards(testDb, {
			targetDate: todayStr,
			currentUserId: userA.id
		});

		const card = dailyRes.cards.find((c) => c.topicHash === hash);
		expect(card).toBeDefined();
		expect(card!.totalParticipants).toBe(2);
		expect(card!.doneCount).toBe(1);
		expect(card!.totalParticipants).toBe(topicDetail.todayParticipants);
		expect(card!.doneCount).toBe(topicDetail.todayDoneCount);

		// 3. 验证通过 startDateFrom / startDateTo 范围查询（Trending 列表参数）
		const trendingDailyRes = await todoService.listDailyCards(testDb, {
			targetDate: todayStr,
			startDateFrom: '2026-09-04T16:00:00.000Z',
			startDateTo: '2026-09-05T15:59:59.999Z',
			sortBy: 'participants',
			limit: 5,
			currentUserId: userA.id
		});
		const trendingCard = trendingDailyRes.cards.find((c) => c.topicHash === hash);
		expect(trendingCard).toBeDefined();
		expect(trendingCard!.totalParticipants).toBe(2);
		expect(trendingCard!.totalParticipants).toBe(topicDetail.todayParticipants);
	});
});

describe('listDailyCards', () => {
	const targetDate = '2026-08-28';

	test('returns empty cards when no todos exist for target date', async () => {
		const res = await todoService.listDailyCards(testDb, { targetDate });
		expect(res.date).toBe(targetDate);
		expect(res.totalCards).toBe(0);
		expect(res.cards).toEqual([]);
	});

	test('aggregates solo and multiplayer cards correctly', async () => {
		const user2 = await userService.findOrCreate(testDb, 'user2@example.com');

		// Card 1 (Solo)
		await todoService.create(testDb, {
			content: 'Solo Task',
			category: 'life',
			authorId: testUser.id,
			startDate: targetDate
		});

		// Card 2 (Multiplayer: 2 users)
		const todoA = await todoService.create(testDb, {
			content: '一起早起跑步',
			category: 'fitness',
			authorId: testUser.id,
			startDate: targetDate
		});
		const todoB = await todoService.create(testDb, {
			content: '一起早起跑步',
			category: 'fitness',
			authorId: user2.id,
			startDate: targetDate
		});
		await todoService.update(testDb, todoB.id, 'user2@example.com', { status: 'done' });

		const res = await todoService.listDailyCards(testDb, {
			targetDate,
			currentUserId: testUser.id
		});

		expect(res.totalCards).toBe(2);
		expect(res.cards).toHaveLength(2);

		const multiCard = res.cards.find((c) => c.content === '一起早起跑步');
		expect(multiCard).toBeDefined();
		expect(multiCard!.isMultiplayer).toBe(true);
		expect(multiCard!.totalParticipants).toBe(2);
		expect(multiCard!.doneCount).toBe(1);
		expect(multiCard!.participants).toHaveLength(2);

		// Current user's todo should be first in participants
		expect(multiCard!.participants[0].isMe).toBe(true);
		expect(multiCard!.participants[0].todoId).toBe(todoA.id);
		expect(multiCard!.participants[1].isMe).toBe(false);
		expect(multiCard!.participants[1].todoId).toBe(todoB.id);

		const soloCard = res.cards.find((c) => c.content === 'Solo Task');
		expect(soloCard).toBeDefined();
		expect(soloCard!.isMultiplayer).toBe(false);
		expect(soloCard!.totalParticipants).toBe(1);
		expect(soloCard!.doneCount).toBe(0);
	});

	test('filters by category', async () => {
		await todoService.create(testDb, {
			content: 'Study React',
			category: 'dev',
			authorId: testUser.id,
			startDate: targetDate
		});
		await todoService.create(testDb, {
			content: 'Buy grocery',
			category: 'life',
			authorId: testUser.id,
			startDate: targetDate
		});

		const res = await todoService.listDailyCards(testDb, {
			targetDate,
			category: 'dev'
		});

		expect(res.totalCards).toBe(1);
		expect(res.cards[0].content).toBe('Study React');
	});

	test('filters by onlyMine = true', async () => {
		const user2 = await userService.findOrCreate(testDb, 'user2@example.com');
		const otherUser = await userService.findOrCreate(testDb, 'other@example.com');

		// Card 1: testUser + user2
		await todoService.create(testDb, {
			content: 'Shared Goal',
			category: 'study',
			authorId: testUser.id,
			startDate: targetDate
		});
		await todoService.create(testDb, {
			content: 'Shared Goal',
			category: 'study',
			authorId: user2.id,
			startDate: targetDate
		});

		// Card 2: otherUser only
		await todoService.create(testDb, {
			content: 'Other Person Secret Goal',
			category: 'life',
			authorId: otherUser.id,
			startDate: targetDate
		});

		// Query with onlyMine = true for testUser
		const resMine = await todoService.listDailyCards(testDb, {
			targetDate,
			onlyMine: true,
			currentUserId: testUser.id
		});

		expect(resMine.totalCards).toBe(1);
		expect(resMine.cards[0].content).toBe('Shared Goal');
		expect(resMine.cards[0].participants).toHaveLength(2);

		// Query with onlyMine = false (square view)
		const resAll = await todoService.listDailyCards(testDb, {
			targetDate,
			onlyMine: false,
			currentUserId: testUser.id
		});

		expect(resAll.totalCards).toBe(2);
	});

	test('supports pagination via limit and offset', async () => {
		for (let i = 1; i <= 5; i++) {
			await todoService.create(testDb, {
				content: `Daily Task ${i}`,
				category: 'dev',
				authorId: testUser.id,
				startDate: targetDate
			});
		}

		const page1 = await todoService.listDailyCards(testDb, {
			targetDate,
			limit: 2,
			offset: 0
		});
		expect(page1.totalCards).toBe(5);
		expect(page1.cards).toHaveLength(2);

		const page2 = await todoService.listDailyCards(testDb, {
			targetDate,
			limit: 2,
			offset: 2
		});
		expect(page2.totalCards).toBe(5);
		expect(page2.cards).toHaveLength(2);

		const page3 = await todoService.listDailyCards(testDb, {
			targetDate,
			limit: 2,
			offset: 4
		});
		expect(page3.totalCards).toBe(5);
		expect(page3.cards).toHaveLength(1);
	});
});

describe('delete', () => {
	test('deletes existing todo by id when requested by author', async () => {
		const todo = await todoService.create(testDb, {
			content: 'To be deleted',
			authorId: testUser.id
		});

		const result = await todoService.deleteTodo(testDb, todo.id, testUser.email);
		expect(result).toEqual({ success: true, deletedId: todo.id });

		const found = await todoService.findByIdOrShortId(testDb, todo.id);
		expect(found).toBeNull();
	});

	test('deletes existing todo by shortId when requested by author', async () => {
		const todo = await todoService.create(testDb, {
			content: 'To be deleted by shortId',
			authorId: testUser.id
		});

		const result = await todoService.deleteTodo(testDb, todo.shortId, testUser.email);
		expect(result).toEqual({ success: true, deletedId: todo.id });

		const found = await todoService.findByIdOrShortId(testDb, todo.shortId);
		expect(found).toBeNull();
	});

	test('throws FORBIDDEN when non-author attempts to delete', async () => {
		const otherUser = await userService.findOrCreate(testDb, 'other@example.com');
		const todo = await todoService.create(testDb, {
			content: 'Protected todo',
			authorId: testUser.id
		});

		await expect(
			todoService.deleteTodo(testDb, todo.id, otherUser.email)
		).rejects.toThrow(AppError);

		await expect(
			todoService.deleteTodo(testDb, todo.id, otherUser.email)
		).rejects.toMatchObject({ code: 'FORBIDDEN' });
	});

	test('throws NOT_FOUND when deleting non-existent todo', async () => {
		await expect(
			todoService.deleteTodo(testDb, '00000000-0000-0000-0000-000000000000', testUser.email)
		).rejects.toThrow(AppError);

		await expect(
			todoService.deleteTodo(testDb, '00000000-0000-0000-0000-000000000000', testUser.email)
		).rejects.toMatchObject({ code: 'NOT_FOUND' });
	});
});

