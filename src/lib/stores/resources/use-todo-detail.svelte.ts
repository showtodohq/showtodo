import { api } from '$lib/services/api';
import { userStore } from '$lib/stores/user.svelte';
import { toast } from '$lib/stores/toast.svelte';
import { todoRegistry } from '$lib/stores/entities/todo-registry.svelte';
import { todoMutations } from '$lib/stores/mutations.svelte';
import type { Todo, TodoStatus, TodoActivityType } from '$lib/types/todo';

export function createTodoDetailResource(initialIdentifier?: string) {
	const initialCached = initialIdentifier ? (todoRegistry.get(initialIdentifier) || null) : null;
	let loading = $state(!initialCached);
	let error = $state<string | null>(null);
	let todo = $state<Todo | null>(initialCached);
	let topicParticipantCount = $state<number>(0);
	let isSubmittingCheckIn = $state(false);

	const isMine = $derived(
		Boolean(
			todo &&
				((userStore.id && todo.authorId === userStore.id) ||
					(userStore.handle && todo.author?.handle === userStore.handle) ||
					(userStore.email && todo.author?.email === userStore.email))
		)
	);

	let inFlightIdentifier: string | null = null;

	async function load(identifier: string) {
		// 在途请求去重：如果该 ID 正在请求中，不重复触发
		if (inFlightIdentifier === identifier) {
			return;
		}
		inFlightIdentifier = identifier;
		error = null;

		// 1. 0ms 瞬时预渲染：从实体仓库中检索已存在的 Todo
		const cached = todoRegistry.get(identifier);
		if (cached) {
			todo = cached;
			loading = false;
		} else {
			loading = true;
		}

		try {
			// 2. 后台静默拉取数据：若已有 cached 且带话题，直接并行发起请求节省 RTT
			if (cached?.topicHash && cached.id) {
				const [todoRes, topicRes] = await Promise.allSettled([
					api.getTodoById(identifier),
					api.getTopicInfo(cached.id)
				]);

				if (todoRes.status === 'fulfilled') {
					todo = todoRegistry.upsert(todoRes.value.todo);
				} else {
					throw todoRes.reason;
				}

				if (topicRes.status === 'fulfilled') {
					topicParticipantCount = topicRes.value.participantCount || 0;
				}
			} else {
				// 未缓存时正常先拉取 Todo
				const res = await api.getTodoById(identifier);
				todo = todoRegistry.upsert(res.todo);

				if (todo.topicHash) {
					try {
						const info = await api.getTopicInfo(todo.id);
						topicParticipantCount = info.participantCount || 0;
					} catch {
						// ignore topic info failure
					}
				}
			}
		} catch (err) {
			console.error('Failed to load todo detail:', err);
			if (!todo) {
				error = (err as Error).message || '待办不存在或已被删除';
			}
		} finally {
			loading = false;
			inFlightIdentifier = null;
		}
	}

	async function handleStatusChange(nextStatus: TodoStatus, e?: MouseEvent) {
		if (!todo || !userStore.email) {
			toast.info('请先绑定邮箱');
			return;
		}

		const prevStatus = todo.status;
		const prevActivities = [...(todo.activities || [])];
		const optimisticActivity = {
			id: `temp-act-${Date.now()}`,
			todoId: todo.id,
			authorId: userStore.id || '',
			type: 'status_change' as const,
			fromStatus: prevStatus,
			toStatus: nextStatus,
			content: null,
			createdAt: new Date().toISOString()
		};

		// 0ms 乐观在动态时间线顶端插入记录
		todo.activities = [optimisticActivity, ...prevActivities];

		try {
			await todoMutations.toggleStatus(todo.id, nextStatus, e, todo);

			// 静默刷新权威动态时间线
			const updated = await api.getTodoById(todo.id);
			if (todo) {
				todo.activities = updated.todo.activities;
			}
		} catch {
			if (todo) {
				todo.activities = prevActivities;
			}
		}
	}

	async function handleCheckIn({ status, note }: { status: TodoStatus; note: string }) {
		if (!todo || !userStore.email) return;

		isSubmittingCheckIn = true;
		const prevActivities = [...(todo.activities || [])];
		const statusChanged = status !== todo.status;
		const optimisticActivity = {
			id: `temp-act-${Date.now()}`,
			todoId: todo.id,
			authorId: userStore.id || '',
			type: (statusChanged ? 'status_change' : 'progress_note') as TodoActivityType,
			fromStatus: todo.status,
			toStatus: status,
			content: note,
			createdAt: new Date().toISOString()
		};

		// 0ms 乐观插入最新打卡动态
		todo.activities = [optimisticActivity, ...prevActivities];

		try {
			if (statusChanged) {
				await todoMutations.toggleStatus(todo.id, status, undefined, todo, {
					activityNote: note
				});
			} else {
				await api.updateTodo(todo.id, {
					email: userStore.email,
					activityNote: note
				});
			}

			// 静默刷新动态时间线
			const updated = await api.getTodoById(todo.id);
			if (todo) {
				todo.activities = updated.todo.activities;
			}
			toast.success('已记录最新进展！');
		} catch (err) {
			if (todo) {
				todo.activities = prevActivities;
			}
			console.error('Failed to submit check-in:', err);
			toast.error(`记录进展失败: ${(err as Error).message}`);
		} finally {
			isSubmittingCheckIn = false;
		}
	}

	async function handleSaveEdit(content: string, note?: string | null) {
		if (!todo || !userStore.email) return;

		try {
			const res = await api.updateTodo(todo.id, {
				email: userStore.email,
				content,
				note
			});

			if (res.todo) {
				todoRegistry.upsert(res.todo);
				todo = res.todo;
				toast.success('待办已更新');
			}
		} catch (err) {
			toast.error(`更新失败: ${(err as Error).message}`);
		}
	}

	return {
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get todo() {
			return todo;
		},
		get isMine() {
			return isMine;
		},
		get topicParticipantCount() {
			return topicParticipantCount;
		},
		get isSubmittingCheckIn() {
			return isSubmittingCheckIn;
		},
		load,
		handleStatusChange,
		handleCheckIn,
		handleSaveEdit
	};
}
