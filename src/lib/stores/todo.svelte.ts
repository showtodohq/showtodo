import { api } from '$lib/services/api';
import { toast } from '$lib/stores/toast.svelte';
import { userStore } from '$lib/stores/user.svelte';
import { confetti } from '$lib/utils/confetti';
import { getTodayString } from '$lib/utils/format';
import { optimisticAction } from '$lib/utils/mutation';
import type { Todo, TodoStatus, ReactionEmoji, CategoryId, DailyCard } from '$lib/types/todo';

function normalizeText(text: string) {
	return text.trim().toLowerCase();
}

class TodoStore {
	// 核心状态集合
	feedTodos = $state<Todo[]>([]);
	feedLoading = $state(false);
	feedLoadingMore = $state(false);
	feedNextCursor = $state<string | null>(null);
	activeCategory = $state<CategoryId | null>(null);

	todayTodos = $state<Todo[]>([]);
	todayLoading = $state(false);

	trendingCards = $state<DailyCard[]>([]);
	trendingLoading = $state(false);

	// 派生指标
	todayDoneCount = $derived(this.todayTodos.filter((t) => t.status === 'done').length);
	todayTotalCount = $derived(this.todayTodos.length);

	// ---------------------------------------------------------------------------
	// 内部就地变异辅助工具 (统一跨列表同步，消灭重复样板代码)
	// ---------------------------------------------------------------------------
	private mutateTodo(todoId: string, updater: (t: Todo) => void) {
		for (const list of [this.feedTodos, this.todayTodos]) {
			const item = list.find((t) => t.id === todoId);
			if (item) updater(item);
		}
	}

	private replaceTempTodo(tempId: string, realTodo: Todo) {
		for (const list of [this.feedTodos, this.todayTodos]) {
			const idx = list.findIndex((t) => t.id === tempId);
			if (idx !== -1) list[idx] = realTodo;
		}
	}

	private removeTempTodo(tempId: string) {
		this.feedTodos = this.feedTodos.filter((t) => t.id !== tempId);
		this.todayTodos = this.todayTodos.filter((t) => t.id !== tempId);
	}

	private todoCache = new Map<string, Todo>();

	/**
	 * 将已知的 Todo 缓存入全局缓存字典，支持按 UUID 或 shortId 0ms 预取
	 */
	cacheTodo(todo: Todo) {
		this.todoCache.set(todo.id, todo);
		if (todo.shortId) {
			this.todoCache.set(todo.shortId, todo);
		}
	}

	/**
	 * 从本地 Store (feed/today/cache) 中检索待办条目，支持 0ms 瞬时预渲染
	 */
	getTodo(identifier: string): Todo | undefined {
		if (this.todoCache.has(identifier)) {
			return this.todoCache.get(identifier);
		}
		const found =
			this.feedTodos.find((t) => t.id === identifier || t.shortId === identifier) ||
			this.todayTodos.find((t) => t.id === identifier || t.shortId === identifier);
		if (found) {
			this.cacheTodo(found);
			return found;
		}
		return undefined;
	}

	/**
	 * 判断当前用户今日是否已加入某话题 (供热门卡片 0ms 派生「已同行」)
	 */
	isTopicJoined(content: string): boolean {
		const targetNorm = normalizeText(content);
		return this.todayTodos.some((t) => normalizeText(t.content) === targetNorm);
	}

	// ---------------------------------------------------------------------------
	// 1. 数据拉取方法
	// ---------------------------------------------------------------------------
	async loadFeed(isInitial = true, category: CategoryId | null = this.activeCategory) {
		this.activeCategory = category;
		if (isInitial) this.feedLoading = true;
		else this.feedLoadingMore = true;

		try {
			const res = await api.getTodos({
				category: category || undefined,
				currentUserId: userStore.id,
				cursor: isInitial ? undefined : (this.feedNextCursor ?? undefined),
				limit: 20
			});
			this.feedTodos = isInitial ? res.todos || [] : [...this.feedTodos, ...(res.todos || [])];
			this.feedNextCursor = res.nextCursor;
		} catch (error) {
			console.error('Failed to load feed todos:', error);
			toast.error('加载待办流失败，请重试');
		} finally {
			this.feedLoading = false;
			this.feedLoadingMore = false;
		}
	}

	async loadTodayTodos() {
		if (!userStore.id && !userStore.email) {
			this.todayTodos = [];
			return;
		}

		this.todayLoading = true;
		try {
			const today = getTodayString();
			const res = await api.getTodos({
				authorId: userStore.id,
				startDateFrom: `${today}T00:00:00.000Z`,
				startDateTo: `${today}T23:59:59.999Z`,
				limit: 30
			});
			this.todayTodos = res.todos || [];
		} catch (error) {
			console.error('Failed to load today todos:', error);
		} finally {
			this.todayLoading = false;
		}
	}

	async loadTrendingCards() {
		this.trendingLoading = true;
		try {
			const res = await api.getDailyCards({
				date: getTodayString(),
				currentUserId: userStore.id,
				limit: 5,
				sortBy: 'participants'
			});
			// 固定展示 5 条，纯粹按同行者人数排序
			this.trendingCards = (res.cards || [])
				.sort((a, b) => b.totalParticipants - a.totalParticipants)
				.slice(0, 5);
		} catch (error) {
			console.error('Failed to load trending topics:', error);
		} finally {
			this.trendingLoading = false;
		}
	}

	/**
	 * 0ms 乐观加入话题卡片：同行人数+1、头像堆叠插入当前用户
	 */
	private syncJoinTrendingCard(content: string, tempId: string, currentUser: Todo['author']) {
		const norm = normalizeText(content);
		const card = this.trendingCards.find((c) => normalizeText(c.content) === norm);
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
		card.participants.unshift(participant);
		card.totalParticipants += 1;
		card.isMultiplayer = card.totalParticipants > 1;

		return () => {
			card.participants = card.participants.filter((p) => p.todoId !== tempId);
			card.totalParticipants = Math.max(0, card.totalParticipants - 1);
			card.isMultiplayer = card.totalParticipants > 1;
		};
	}

	/**
	 * 0ms 乐观同步话题卡片的达成人数与 participant 状态
	 */
	private syncStatusTrendingCard(todoId: string, prevStatus: TodoStatus, targetStatus: TodoStatus) {
		for (const card of this.trendingCards) {
			const p = card.participants.find((item) => item.todoId === todoId);
			if (p) {
				p.status = targetStatus;
				if (prevStatus !== 'done' && targetStatus === 'done') {
					card.doneCount += 1;
				} else if (prevStatus === 'done' && targetStatus !== 'done') {
					card.doneCount = Math.max(0, card.doneCount - 1);
				}
			}
		}
	}

	// ---------------------------------------------------------------------------
	// 2. 核心通用操作 (0ms 乐观更新与全域多维同步)
	// ---------------------------------------------------------------------------
	async createTodo(data: {
		content: string;
		note?: string | null;
		isNotePublic?: boolean;
		category?: CategoryId | string | null;
	}) {
		const email = userStore.email;
		if (!email) {
			toast.info('请先点击右上角头像绑定邮箱');
			return;
		}

		const tempId = `temp-${Date.now()}`;
		const nowIso = new Date().toISOString();
		const currentUser = {
			id: userStore.id || '',
			handle: userStore.handle,
			nickname: userStore.nickname,
			avatar: userStore.avatar
		};

		const isNotePublic = data.isNotePublic ?? true;

		const tempTodo: Todo = {
			id: tempId,
			shortId: tempId,
			topicHash: `topic-${Date.now()}`,
			content: data.content,
			note: data.note ?? null,
			isNotePublic,
			category: data.category ?? null,
			authorId: currentUser.id,
			status: 'pending',
			startDate: nowIso,
			dueDate: null,
			createdAt: nowIso,
			updatedAt: nowIso,
			author: currentUser,
			reactions: { '❤️': 0, '👍': 0, '🔥': 0, '💪': 0, '👏': 0, '🚀': 0, '🎉': 0, '👀': 0 },
			myReactions: []
		};

		let rollbackTrendingCard: (() => void) | null = null;

		try {
			await optimisticAction({
				apply: () => {
					if (!this.activeCategory || this.activeCategory === data.category) {
						this.feedTodos.unshift(tempTodo);
					}
					this.todayTodos.unshift(tempTodo);
					rollbackTrendingCard = this.syncJoinTrendingCard(data.content, tempId, currentUser);
				},
				rollback: () => {
					this.removeTempTodo(tempId);
					rollbackTrendingCard?.();
				},
				action: async () => {
					const res = await api.createTodo({
						email,
						content: data.content,
						note: data.note,
						isNotePublic,
						category: data.category ?? undefined
					});
					this.replaceTempTodo(tempId, res.todo);

					// 静默替换卡片中的参与者 ID
					for (const card of this.trendingCards) {
						const p = card.participants.find((item) => item.todoId === tempId);
						if (p) {
							p.todoId = res.todo.id;
							p.shortId = res.todo.shortId;
						}
					}

					if (res.author) userStore.updateUserFromProfile(res.author);
					return res;
				},
				onError: (err) => {
					toast.error(`发布失败: ${(err as Error).message}`);
				}
			});
			toast.success('已发布公开待办！');
		} catch {
			// handled
		}
	}

	async toggleStatus(
		todoId: string,
		nextStatus?: TodoStatus,
		event?: MouseEvent,
		fallbackTodo?: Todo,
		options?: { activityNote?: string }
	) {
		if (!userStore.email) {
			toast.info('请先点击右上角头像设置邮箱');
			return;
		}
		if (todoId.startsWith('temp-')) {
			toast.info('正在发布中，请稍候...');
			return;
		}

		const target =
			this.feedTodos.find((t) => t.id === todoId) ||
			this.todayTodos.find((t) => t.id === todoId) ||
			fallbackTodo;
		if (!target) return;

		const prevStatus = target.status;
		const targetStatus: TodoStatus = nextStatus || (prevStatus === 'done' ? 'pending' : 'done');

		if (targetStatus === 'done') {
			const isAllDone =
				this.todayTodos.length > 0 &&
				this.todayTodos.every((t) => (t.id === todoId ? true : t.status === 'done'));

			if (isAllDone) {
				confetti.tripleCelebration();
				toast.success('🎉 太棒了！今日全部待办已全部达成！');
			} else {
				confetti.burst(event?.clientX, event?.clientY, 300);
			}
		}

		try {
			await optimisticAction({
				apply: () => {
					this.mutateTodo(todoId, (t) => (t.status = targetStatus));
					if (fallbackTodo) fallbackTodo.status = targetStatus;
					this.syncStatusTrendingCard(todoId, prevStatus, targetStatus);
				},
				rollback: () => {
					this.mutateTodo(todoId, (t) => (t.status = prevStatus));
					if (fallbackTodo) fallbackTodo.status = prevStatus;
					this.syncStatusTrendingCard(todoId, targetStatus, prevStatus);
				},
				action: async () => {
					await api.updateTodo(todoId, {
						email: userStore.email!,
						status: targetStatus,
						activityNote: options?.activityNote
					});
				},
				onError: (err) => {
					toast.error(`状态更新失败: ${(err as Error).message}`);
				}
			});
		} catch {
			// handled
		}
	}

	async toggleReaction(todoId: string, emoji?: ReactionEmoji, fallbackTodo?: Todo) {
		if (!userStore.email) {
			toast.info('请先点击右上角头像绑定邮箱再表态');
			return;
		}
		if (todoId.startsWith('temp-')) {
			toast.info('正在发布中，请稍候...');
			return;
		}

		const target =
			this.feedTodos.find((t) => t.id === todoId) ||
			this.todayTodos.find((t) => t.id === todoId) ||
			fallbackTodo;
		if (!target) return;

		target.reactions ??= { '❤️': 0, '👍': 0, '🔥': 0, '💪': 0, '👏': 0, '🚀': 0, '🎉': 0, '👀': 0 };
		target.myReactions ??= [];

		const prevReactions = { ...target.reactions };
		const prevMyReactions = [...target.myReactions];
		const targetEmoji = emoji || (target.myReactions.length > 0 ? undefined : '❤️');
		const isLiked = targetEmoji ? target.myReactions.includes(targetEmoji) : true;

		const updateReactions = (item: Todo, liked: boolean) => {
			item.reactions ??= { '❤️': 0, '👍': 0, '🔥': 0, '💪': 0, '👏': 0, '🚀': 0, '🎉': 0, '👀': 0 };
			item.myReactions ??= [];
			if (liked) {
				if (!targetEmoji) {
					for (const e of prevMyReactions) item.reactions[e] = Math.max(0, (item.reactions[e] || 1) - 1);
					item.myReactions = [];
				} else {
					item.reactions[targetEmoji] = Math.max(0, (item.reactions[targetEmoji] || 1) - 1);
					item.myReactions = item.myReactions.filter((e) => e !== targetEmoji);
				}
			} else {
				item.reactions[targetEmoji!] = (item.reactions[targetEmoji!] || 0) + 1;
				item.myReactions = [...item.myReactions, targetEmoji!];
			}
		};

		try {
			await optimisticAction({
				apply: () => {
					this.mutateTodo(todoId, (item) => updateReactions(item, isLiked));
					if (fallbackTodo) updateReactions(fallbackTodo, isLiked);
				},
				rollback: () => {
					this.mutateTodo(todoId, (item) => {
						item.reactions = { ...prevReactions };
						item.myReactions = [...prevMyReactions];
					});
					if (fallbackTodo) {
						fallbackTodo.reactions = { ...prevReactions };
						fallbackTodo.myReactions = [...prevMyReactions];
					}
				},
				action: async () => {
					if (isLiked) {
						await api.removeReaction(todoId, targetEmoji, userStore.email!);
					} else {
						await api.addReaction(todoId, targetEmoji!, userStore.email!);
					}
				},
				onError: (err) => {
					toast.error(`表态操作失败: ${(err as Error).message}`);
				}
			});
		} catch {
			// handled
		}
	}
}

export const todoStore = new TodoStore();
