import { api } from '$lib/services/api';
import { userStore } from '$lib/stores/user.svelte';
import { toast } from '$lib/stores/toast.svelte';
import { trendingStore } from '$lib/stores/trending.svelte';
import { todoRegistry } from '$lib/stores/entities/todo-registry.svelte';
import { todoMutations } from '$lib/stores/mutations.svelte';
import type { TopicDetail, TodoStatus } from '$lib/types/todo';

export function createTopicDetailResource() {
	let loading = $state(true);
	let error = $state<string | null>(null);
	let topic = $state<TopicDetail | null>(null);
	let isJoining = $state(false);

	const hasJoined = $derived(
		Boolean(
			topic &&
				userStore.id &&
				topic.participants.some((p) => p.user.id === userStore.id)
		)
	);

	const myParticipant = $derived(
		topic && userStore.id
			? topic.participants.find((p) => p.user.id === userStore.id)
			: null
	);

	let inFlightHash: string | null = null;

	async function load(hash: string) {
		if (inFlightHash === hash) {
			return;
		}
		inFlightHash = hash;
		error = null;

		// 1. 0ms 瞬时预渲染：从热门同行卡片中命中秒开
		const cachedCard = trendingStore.cards.find((c) => c.topicHash === hash);
		if (cachedCard) {
			topic = {
				topicHash: cachedCard.topicHash,
				content: cachedCard.content,
				category: cachedCard.category,
				firstCreatedAt: new Date().toISOString(),
				totalParticipants: cachedCard.totalParticipants,
				doneCount: cachedCard.doneCount,
				inProgressCount: 0,
				isAllDone:
					cachedCard.totalParticipants > 0 &&
					cachedCard.doneCount >= cachedCard.totalParticipants,
				participants: cachedCard.participants.map((p, idx) => ({
					todoId: p.todoId || `cached-${idx}`,
					shortId: p.shortId || '',
					status: p.status,
					note: p.note,
					createdAt: p.createdAt,
					user: {
						id: p.user?.id || `u-${idx}`,
						nickname: p.user?.nickname || '用户',
						handle: p.user?.handle || 'user',
						avatar: p.user?.avatar || null,
						email: '',
						createdAt: '',
						updatedAt: ''
					}
				}))
			};
			loading = false;
		} else {
			loading = true;
		}

		try {
			// 2. 后台获取全量同行清单数据注水
			const res = await api.getTopicByHash(hash, userStore.id);
			topic = res.topic;

			// 将参与者条目纳管进 todoRegistry，确保本页或其他页面打勾能 0ms 命中与同步
			if (topic?.participants) {
				for (const p of topic.participants) {
					if (p.todoId && !todoRegistry.get(p.todoId)) {
						todoRegistry.upsert({
							id: p.todoId,
							shortId: p.shortId || p.todoId,
							topicHash: topic.topicHash,
							content: topic.content,
							category: topic.category,
							authorId: p.user?.id || '',
							status: p.status,
							note: p.note || null,
							isNotePublic: true,
							startDate: p.createdAt,
							dueDate: null,
							createdAt: p.createdAt,
							updatedAt: p.createdAt,
							author: {
								id: p.user?.id || '',
								handle: p.user?.handle || 'user',
								nickname: p.user?.nickname || '用户',
								avatar: p.user?.avatar || null
							},
							reactions: { '❤️': 0, '👍': 0, '🔥': 0, '💪': 0, '👏': 0, '🚀': 0, '🎉': 0, '👀': 0 },
							myReactions: []
						});
					}
				}
			}
		} catch (err) {
			console.error('Failed to load topic detail:', err);
			if (!topic) {
				error = (err as Error).message || '该多人同行目标不存在或已解散';
			}
		} finally {
			loading = false;
			inFlightHash = null;
		}
	}

	/**
	 * 加入多人同行目标：采用统一领域动作，0ms 本地就地变异，原子替换真实 ID
	 */
	async function handleJoin() {
		if (!userStore.email) {
			toast.info('请先点击右上角头像设置邮箱再加入');
			return;
		}
		if (!topic || isJoining) return;

		isJoining = true;
		const currentUser = {
			id: userStore.id || '',
			nickname: userStore.nickname || '我',
			handle: userStore.handle || 'user',
			avatar: userStore.avatar || null,
			email: userStore.email || '',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		const tempTodoId = `temp-join-${Date.now()}`;
		const optimisticParticipant = {
			todoId: tempTodoId,
			shortId: tempTodoId,
			status: 'in_progress' as TodoStatus,
			note: null,
			createdAt: new Date().toISOString(),
			user: currentUser
		};

		// 0ms 乐观在本地话题列表插入自己
		topic.participants.unshift(optimisticParticipant);
		topic.totalParticipants += 1;

		try {
			const realTodo = await todoMutations.joinTopic({
				content: topic.content,
				category: topic.category
			});

			if (realTodo) {
				// 原子回填正式 ID，防止用户随后打勾被 temp- 校验拦截
				const p = topic.participants.find((item) => item.todoId === tempTodoId);
				if (p) {
					p.todoId = realTodo.id;
					p.shortId = realTodo.shortId || realTodo.id;
				}
			}
			toast.success('🎉 成功加入该目标！');
		} catch (err) {
			// 回滚
			topic.participants = topic.participants.filter((p) => p.todoId !== tempTodoId);
			topic.totalParticipants = Math.max(0, topic.totalParticipants - 1);
			toast.error(`加入失败: ${(err as Error).message}`);
		} finally {
			isJoining = false;
		}
	}

	/**
	 * 切换我的状态：0ms 本地就地更新 participant 状态与 doneCount，绝不全量重新拉取接口
	 */
	async function handleToggleMyStatus(nextStatus: TodoStatus, e?: MouseEvent) {
		if (!myParticipant || !userStore.email || !topic) return;

		const prevStatus = myParticipant.status;
		myParticipant.status = nextStatus;

		// 同步完成计数
		if (prevStatus !== 'done' && nextStatus === 'done') {
			topic.doneCount += 1;
		} else if (prevStatus === 'done' && nextStatus !== 'done') {
			topic.doneCount = Math.max(0, topic.doneCount - 1);
		}
		topic.isAllDone = topic.totalParticipants > 0 && topic.doneCount >= topic.totalParticipants;

		try {
			await todoMutations.toggleStatus(myParticipant.todoId, nextStatus, e);
		} catch {
			// 失败回滚
			myParticipant.status = prevStatus;
			if (prevStatus !== 'done' && nextStatus === 'done') {
				topic.doneCount = Math.max(0, topic.doneCount - 1);
			} else if (prevStatus === 'done' && nextStatus !== 'done') {
				topic.doneCount += 1;
			}
			topic.isAllDone = topic.totalParticipants > 0 && topic.doneCount >= topic.totalParticipants;
		}
	}

	return {
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get topic() {
			return topic;
		},
		get isJoining() {
			return isJoining;
		},
		get hasJoined() {
			return hasJoined;
		},
		get myParticipant() {
			return myParticipant;
		},
		load,
		handleJoin,
		handleToggleMyStatus
	};
}
