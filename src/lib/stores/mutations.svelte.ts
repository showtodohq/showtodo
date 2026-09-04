import { api } from '$lib/services/api';
import { toast } from '$lib/stores/toast.svelte';
import { userStore } from '$lib/stores/user.svelte';
import { confetti } from '$lib/utils/confetti';
import { optimisticAction } from '$lib/utils/mutation';
import { todoRegistry } from '$lib/stores/entities/todo-registry.svelte';
import { feedStore } from '$lib/stores/feed.svelte';
import { todayStore } from '$lib/stores/today.svelte';
import { trendingStore } from '$lib/stores/trending.svelte';
import type { Todo, TodoStatus, ReactionEmoji, CategoryId } from '$lib/types/todo';

class TodoMutations {
	/**
	 * 创建公开待办事项
	 */
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

		let createdTodo: Todo | undefined = undefined;

		try {
			await optimisticAction({
				apply: () => {
					todoRegistry.upsert(tempTodo);
					if (!feedStore.activeCategory || feedStore.activeCategory === data.category) {
						feedStore.insertTop(tempId);
					}
					todayStore.insertTop(tempId);
					rollbackTrendingCard = trendingStore.syncJoin(data.content, tempId, currentUser);
				},
				rollback: () => {
					todoRegistry.remove(tempId);
					feedStore.removeId(tempId);
					todayStore.removeId(tempId);
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

					createdTodo = res.todo;

					// 归一化替换实体
					todoRegistry.replace(tempId, res.todo);
					feedStore.replaceId(tempId, res.todo.id);
					todayStore.replaceId(tempId, res.todo.id);
					trendingStore.syncReplaceId(tempId, res.todo);

					if (res.author) userStore.updateUserFromProfile(res.author);
					return res;
				},
				onError: (err) => {
					toast.error(`发布失败: ${(err as Error).message}`);
				}
			});
			toast.success('已发布公开待办！');
			return createdTodo;
		} catch {
			// handled in optimisticAction
			return undefined;
		}
	}

	/**
	 * 加入多人同行目标（统一领域行为）
	 */
	async joinTopic(data: { content: string; category?: CategoryId | string | null }): Promise<Todo | undefined> {
		const email = userStore.email;
		if (!email) {
			toast.info('请先点击右上角头像绑定邮箱后再加入');
			return undefined;
		}

		return await this.createTodo({
			content: data.content,
			category: data.category
		});
	}

	/**
	 * 切换待办状态（4 态流转机 + 庆祝彩屑）
	 */
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

		const target = todoRegistry.get(todoId) || fallbackTodo;
		if (!target) return;

		// 确保实体已受纳管
		todoRegistry.upsert(target);

		const prevStatus = target.status;
		const targetStatus: TodoStatus = nextStatus || (prevStatus === 'done' ? 'pending' : 'done');

		if (targetStatus === 'done') {
			const isAllDone =
				todayStore.todos.length > 0 &&
				todayStore.todos.every((t) => (t.id === todoId ? true : t.status === 'done'));

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
					todoRegistry.mutate(todoId, (t) => {
						t.status = targetStatus;
					});
					if (fallbackTodo) fallbackTodo.status = targetStatus;
					trendingStore.syncStatus(todoId, prevStatus, targetStatus);
				},
				rollback: () => {
					todoRegistry.mutate(todoId, (t) => {
						t.status = prevStatus;
					});
					if (fallbackTodo) fallbackTodo.status = prevStatus;
					trendingStore.syncStatus(todoId, targetStatus, prevStatus);
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
			// handled in optimisticAction
		}
	}

	/**
	 * 表态 / 点赞 / 取消表态
	 */
	async toggleReaction(todoId: string, emoji?: ReactionEmoji, fallbackTodo?: Todo) {
		if (!userStore.email) {
			toast.info('请先点击右上角头像绑定邮箱再表态');
			return;
		}
		if (todoId.startsWith('temp-')) {
			toast.info('正在发布中，请稍候...');
			return;
		}

		const target = todoRegistry.get(todoId) || fallbackTodo;
		if (!target) return;

		todoRegistry.upsert(target);

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
					todoRegistry.mutate(todoId, (item) => updateReactions(item, isLiked));
					if (fallbackTodo) updateReactions(fallbackTodo, isLiked);
				},
				rollback: () => {
					todoRegistry.mutate(todoId, (item) => {
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

export const todoMutations = new TodoMutations();
