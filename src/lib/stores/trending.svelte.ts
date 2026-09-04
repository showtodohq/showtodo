import { api } from '$lib/services/api';
import { userStore } from '$lib/stores/user.svelte';
import { getTodayString } from '$lib/utils/format';
import type { DailyCard, TodoStatus, Todo } from '$lib/types/todo';

function normalizeText(text: string) {
	return text.trim().toLowerCase();
}

class TrendingStore {
	cards = $state<DailyCard[]>([]);
	loading = $state(false);
	loaded = $state(false);

	async load(force = false) {
		if (!force && this.loaded && this.cards.length > 0) {
			return;
		}

		this.loading = true;
		try {
			const res = await api.getDailyCards({
				date: getTodayString(),
				currentUserId: userStore.id,
				limit: 5,
				sortBy: 'participants'
			});

			this.cards = (res.cards || [])
				.sort((a, b) => b.totalParticipants - a.totalParticipants)
				.slice(0, 5);
			this.loaded = true;
		} catch (error) {
			console.error('Failed to load trending topics:', error);
		} finally {
			this.loading = false;
		}
	}

	/**
	 * 0ms 乐观同步话题卡片的达成人数与 participant 状态
	 */
	syncStatus(todoId: string, prevStatus: TodoStatus, targetStatus: TodoStatus) {
		let changed = false;
		for (const card of this.cards) {
			const p = card.participants.find(
				(item) => item.todoId === todoId || (item.shortId && item.shortId === todoId)
			);
			if (p) {
				p.status = targetStatus;
				if (prevStatus !== 'done' && targetStatus === 'done') {
					card.doneCount += 1;
				} else if (prevStatus === 'done' && targetStatus !== 'done') {
					card.doneCount = Math.max(0, card.doneCount - 1);
				}
				changed = true;
			}
		}
		if (changed) {
			this.cards = [...this.cards];
		}
	}

	/**
	 * 0ms 乐观加入话题卡片：同行人数+1、头像堆叠插入当前用户
	 */
	syncJoin(content: string, tempId: string, currentUser: Todo['author']) {
		const norm = normalizeText(content);
		const card = this.cards.find((c) => normalizeText(c.content) === norm);
		if (!card || !currentUser) return null;

		const alreadyIn = card.participants.some(
			(p) => p.isMe || (currentUser.id && p.user.id === currentUser.id) || p.todoId === tempId
		);
		if (alreadyIn) return null;

		const participant = {
			todoId: tempId,
			shortId: tempId,
			status: 'pending' as TodoStatus,
			createdAt: new Date().toISOString(),
			isMe: true,
			user: {
				id: currentUser.id || '',
				nickname: currentUser.nickname,
				handle: currentUser.handle,
				avatar: currentUser.avatar
			}
		};
		card.participants = [participant, ...card.participants];
		card.totalParticipants += 1;
		card.isMultiplayer = card.totalParticipants > 1;
		this.cards = [...this.cards];

		return () => {
			card.participants = card.participants.filter((p) => p.todoId !== tempId);
			card.totalParticipants = Math.max(0, card.totalParticipants - 1);
			card.isMultiplayer = card.totalParticipants > 1;
			this.cards = [...this.cards];
		};
	}

	syncReplaceId(tempId: string, realTodo: Todo) {
		let replaced = false;
		for (const card of this.cards) {
			const p = card.participants.find((item) => item.todoId === tempId);
			if (p) {
				p.todoId = realTodo.id;
				p.shortId = realTodo.shortId;
				replaced = true;
			}
		}
		if (replaced) {
			this.cards = [...this.cards];
		}
	}
}

export const trendingStore = new TrendingStore();
