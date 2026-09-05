import { describe, it, expect } from 'vitest';
import type { TopicParticipant } from '$lib/types/todo';

/**
 * 辅助排序函数，与 TopicParticipantList 保持一致的领域规范
 */
export function sortTopicParticipants(
	participants: TopicParticipant[],
	currentUserId?: string
): TopicParticipant[] {
	if (!currentUserId || participants.length <= 1) return participants;
	const myIndex = participants.findIndex(
		(p) => p.isMe || (currentUserId && p.user?.id === currentUserId)
	);
	if (myIndex <= 0) return participants;
	return [
		participants[myIndex],
		...participants.slice(0, myIndex),
		...participants.slice(myIndex + 1)
	];
}

describe('Topic Participants Sorting (Plan A)', () => {
	const p1: TopicParticipant = {
		todoId: 'todo-1',
		shortId: 'short-1',
		status: 'done',
		createdAt: '2026-09-01T00:00:00.000Z',
		user: { id: 'u-creator', nickname: '发起者', handle: 'creator', avatar: null }
	};
	const p2: TopicParticipant = {
		todoId: 'todo-2',
		shortId: 'short-2',
		status: 'in_progress',
		createdAt: '2026-09-02T00:00:00.000Z',
		user: { id: 'u-user2', nickname: '伙伴B', handle: 'user2', avatar: null }
	};
	const p3: TopicParticipant = {
		todoId: 'todo-3',
		shortId: 'short-3',
		status: 'pending',
		createdAt: '2026-09-03T00:00:00.000Z',
		user: { id: 'u-me', nickname: '我', handle: 'me', avatar: null }
	};

	it('should keep original order when currentUserId is not provided (guest)', () => {
		const list = [p1, p2, p3];
		const result = sortTopicParticipants(list, undefined);
		expect(result[0].user.id).toBe('u-creator');
		expect(result[1].user.id).toBe('u-user2');
		expect(result[2].user.id).toBe('u-me');
	});

	it('should hoist current user to first position (Plan A)', () => {
		const list = [p1, p2, p3];
		const result = sortTopicParticipants(list, 'u-me');
		expect(result[0].user.id).toBe('u-me');
		expect(result[1].user.id).toBe('u-creator');
		expect(result[2].user.id).toBe('u-user2');
	});

	it('should preserve order when current user is already at top (isMe from API)', () => {
		const p3WithIsMe = { ...p3, isMe: true };
		const list = [p3WithIsMe, p1, p2];
		const result = sortTopicParticipants(list, 'u-me');
		expect(result[0].user.id).toBe('u-me');
		expect(result[1].user.id).toBe('u-creator');
		expect(result[2].user.id).toBe('u-user2');
	});

	it('should handle single participant list smoothly', () => {
		const result = sortTopicParticipants([p1], 'u-creator');
		expect(result.length).toBe(1);
		expect(result[0].user.id).toBe('u-creator');
	});
});
