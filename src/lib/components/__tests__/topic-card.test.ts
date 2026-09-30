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

	it('renders "1 person today · 0/1 completed" on Today tab and "1 person, 7/9 total all-time" on All tab', () => {
		const multiCheckinDetail: TopicDetail = {
			topicHash: '52e7365a39cd78b1',
			content: 'Read the taotejing',
			category: 'study',
			firstCreatedAt: '2026-09-21T00:00:00.000Z',
			todayParticipants: 1,
			todayTotalTodos: 1,
			todayDoneCount: 0,
			todayInProgressCount: 0,
			isTodayAllDone: false,
			totalParticipants: 1,
			totalTodos: 9,
			allDoneCount: 7,
			doneCount: 0,
			inProgressCount: 0,
			isAllDone: false,
			participants: [
				{
					todoId: 't-today',
					shortId: 'Wy7B5hdF',
					status: 'pending',
					createdAt: '2026-09-30T03:00:00.000Z',
					totalTodos: 1,
					doneCount: 0,
					user: { id: 'u1', nickname: 'Archer', handle: 'archer', avatar: null }
				}
			],
			allParticipants: [
				{
					todoId: 't-today',
					shortId: 'Wy7B5hdF',
					status: 'pending',
					createdAt: '2026-09-30T03:00:00.000Z',
					totalTodos: 9,
					doneCount: 7,
					user: { id: 'u1', nickname: 'Archer', handle: 'archer', avatar: null }
				}
			]
		};

		// 1. Today Tab
		const todayRender = render(TopicHeaderCard, {
			props: {
				topic: multiCheckinDetail,
				activeTab: 'today',
				hasJoined: false
			}
		});
		expect(todayRender.body).toContain('person today');
		expect(todayRender.body).toContain('0/1');
		expect(todayRender.body).toContain('completed');
		expect(todayRender.body).toContain('0% Today');

		// 2. All Tab
		const allRender = render(TopicHeaderCard, {
			props: {
				topic: multiCheckinDetail,
				activeTab: 'all',
				hasJoined: false
			}
		});
		expect(allRender.body).toContain('person');
		expect(allRender.body).toContain('7/9');
		expect(allRender.body).toContain('total all-time');
		expect(allRender.body).toContain('78% Total');
	});
});

describe('TopicParticipantList Today (1) | All (1) and peer row stats', () => {
	it('displays Today (1) | All (1) and individual participant completed count', async () => {
		const { default: TopicParticipantList } = await import('../topic/TopicParticipantList.svelte');

		const todayParticipants = [
			{
				todoId: 't-today',
				shortId: 'Wy7B5hdF',
				status: 'pending' as const,
				createdAt: '2026-09-30T03:00:00.000Z',
				totalTodos: 1,
				doneCount: 0,
				user: { id: 'u1', nickname: 'Archer', handle: 'archer', avatar: null }
			}
		];
		const allParticipants = [
			{
				todoId: 't-today',
				shortId: 'Wy7B5hdF',
				status: 'pending' as const,
				createdAt: '2026-09-30T03:00:00.000Z',
				totalTodos: 9,
				doneCount: 7,
				user: { id: 'u1', nickname: 'Archer', handle: 'archer', avatar: null }
			}
		];

		// Today tab
		const renderedToday = render(TopicParticipantList, {
			props: {
				participants: todayParticipants,
				allParticipants,
				activeTab: 'today'
			}
		});
		expect(renderedToday.body).toContain('Today (1)');
		expect(renderedToday.body).toContain('All (1)');
		expect(renderedToday.body).toContain('0/1 completed');
		expect(renderedToday.body).toContain('View activity timeline →');
		expect(renderedToday.body).toContain('/t/Wy7B5hdF');

		// All tab
		const renderedAll = render(TopicParticipantList, {
			props: {
				participants: todayParticipants,
				allParticipants,
				activeTab: 'all'
			}
		});
		expect(renderedAll.body).toContain('Today (1)');
		expect(renderedAll.body).toContain('All (1)');
		expect(renderedAll.body).toContain('7/9 completed');
		expect(renderedAll.body).toContain('View activity timeline →');
		expect(renderedAll.body).toContain('/t/Wy7B5hdF');
	});
});

