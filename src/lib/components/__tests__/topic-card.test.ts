import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import TopicCard from '../topic/TopicCard.svelte';
import TopicHeaderCard from '../topic/TopicHeaderCard.svelte';
import type { TopicItem, TopicDetail } from '$lib/types/todo';

const mockTopic: TopicItem = {
	topicHash: 'test-topic-hash',
	content: 'Learn Svelte 5 runes',
	category: 'learning',
	isMultiplayer: false,
	totalParticipants: 1,
	doneCount: 0,
	completionRate: 0,
	isAllDone: false,
	firstCreatedAt: '2026-09-19T10:00:00.000Z',
	lastUpdatedAt: '2026-09-19T10:00:00.000Z',
	participants: [
		{
			todoId: 't1',
			shortId: 's1',
			status: 'pending',
			createdAt: '2026-09-19T10:00:00.000Z',
			isMe: false,
			user: {
				id: 'u1',
				nickname: 'Alice',
				handle: 'alice',
				avatar: null
			}
		}
	]
};

describe('TopicCard "Add to my list" Button Style', () => {
	it('renders primary Button matching todo detail card when not joined', () => {
		const rendered = render(TopicCard, {
			props: {
				topic: mockTopic
			}
		});

		// Should render 'Add to my list' instead of '+ Add to my list'
		expect(rendered.body).toContain('Add to my list');
		expect(rendered.body).not.toContain('+ Add to my list');

		// Should have Button component's primary variant classes
		expect(rendered.body).toContain('bg-zinc-900');
		expect(rendered.body).toContain('text-white');
	});

	it('renders "In my list" badge when user has joined', () => {
		const joinedTopic: TopicItem = {
			...mockTopic,
			participants: [
				{
					...mockTopic.participants[0],
					isMe: true
				}
			]
		};

		const rendered = render(TopicCard, {
			props: {
				topic: joinedTopic
			}
		});

		expect(rendered.body).toContain('In my list');
		expect(rendered.body).not.toContain('Add to my list');
	});
});

describe('TopicHeaderCard "Add to my list" Button Style', () => {
	const mockDetail: TopicDetail = {
		topicHash: 'test-topic-hash',
		content: 'Learn Svelte 5 runes',
		category: 'learning',
		firstCreatedAt: '2026-09-19T10:00:00.000Z',
		todayParticipants: 1,
		todayDoneCount: 0,
		todayInProgressCount: 1,
		isTodayAllDone: false,
		totalParticipants: 1,
		doneCount: 0,
		inProgressCount: 1,
		isAllDone: false,
		participants: []
	};

	it('renders primary Button matching todo detail card when not joined', () => {
		const rendered = render(TopicHeaderCard, {
			props: {
				topic: mockDetail,
				hasJoined: false
			}
		});

		expect(rendered.body).toContain('Add to my list');
		// Button should use size xs (h-7) and primary variant matching TodoDetailCard
		expect(rendered.body).toContain('h-7');
		expect(rendered.body).toContain('px-3');
		expect(rendered.body).toContain('bg-zinc-900');
	});
});

