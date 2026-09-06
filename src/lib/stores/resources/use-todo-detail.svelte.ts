import { api } from '$lib/services/api';
import { userStore } from '$lib/stores/user.svelte';
import { todayStore } from '$lib/stores/today.svelte';
import { toast } from '$lib/stores/toast.svelte';
import { todoRegistry } from '$lib/stores/entities/todo-registry.svelte';
import { todoMutations } from '$lib/stores/mutations.svelte';
import type { Todo, TodoStatus, TodoActivityType } from '$lib/types/todo';

export function createTodoDetailResource(initialIdentifier?: string) {
	const initialCached = initialIdentifier ? (todoRegistry.get(initialIdentifier) || null) : null;
	let loading = $state(!initialCached);
	let isRevalidating = $state(false);
	let error = $state<string | null>(null);
	let todo = $state<Todo | null>(initialCached);
	let topicParticipantCount = $state<number>(initialCached?.topicParticipantCount || 0);
	let isSubmittingCheckIn = $state(false);
	let isJoining = $state(false);

	const isMine = $derived(
		Boolean(
			todo &&
				((userStore.id && todo.authorId === userStore.id) ||
					(userStore.handle && todo.author?.handle === userStore.handle) ||
					(userStore.email && todo.author?.email === userStore.email))
		)
	);

	const myJoinedTodo = $derived.by(() => {
		if (isMine || !todo) return undefined;
		const currentUserId = userStore.id;
		const currentUserEmail = userStore.email;
		const currentUserHandle = userStore.handle;
		if (!currentUserId && !currentUserEmail && !currentUserHandle) return undefined;

		const targetHash = todo.topicHash;
		const targetContentNorm = todo.content.trim().toLowerCase();

		return todayStore.todos.find((t) => {
			const isMyTodo = userStore.isAuthor(t.authorId, t.author?.email, t.author?.handle);
			if (!isMyTodo) return false;
			if (targetHash && t.topicHash === targetHash) return true;
			return t.content.trim().toLowerCase() === targetContentNorm;
		});
	});

	const hasJoined = $derived(
		Boolean(
			!isMine &&
				todo &&
				(Boolean(myJoinedTodo) || (Boolean(userStore.email) && todayStore.isTopicJoined(todo.content)))
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
			if (cached.topicParticipantCount !== undefined) {
				topicParticipantCount = cached.topicParticipantCount;
			}
			loading = false;
			isRevalidating = true;
		} else if (!todo) {
			loading = true;
			isRevalidating = false;
		}

		try {
			// 2. 后台拉取单条待办完整数据（已聚合返回 topicParticipantCount，仅需单次 HTTP 请求）
			const res = await api.getTodoById(identifier);
			todo = todoRegistry.upsert(res.todo);
			if (res.todo.topicParticipantCount !== undefined) {
				topicParticipantCount = res.todo.topicParticipantCount;
			}
		} catch (err) {
			console.error('Failed to load todo detail:', err);
			if (!todo) {
				error = (err as Error).message || '待办不存在或已被删除';
			}
		} finally {
			loading = false;
			isRevalidating = false;
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

	async function handleJoinTopic() {
		if (!userStore.email) {
			toast.info('请先点击右上角头像绑定邮箱后再加入');
			return;
		}
		if (!todo || isJoining) return;

		isJoining = true;
		topicParticipantCount += 1;

		try {
			const joined = await todoMutations.joinTopic({
				content: todo.content,
				category: todo.category
			});
			if (joined) {
				toast.success('🎉 成功加入该目标！');
			}
		} catch (err) {
			topicParticipantCount = Math.max(0, topicParticipantCount - 1);
			console.error('Failed to join topic:', err);
			toast.error(`加入失败: ${(err as Error).message}`);
		} finally {
			isJoining = false;
		}
	}

	async function handleToggleMyStatus(nextStatus?: TodoStatus, e?: MouseEvent) {
		if (!myJoinedTodo || !userStore.email) return;
		await todoMutations.toggleStatus(myJoinedTodo.id, nextStatus, e, myJoinedTodo);
	}

	return {
		get loading() {
			return loading;
		},
		get isRevalidating() {
			return isRevalidating;
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
		get isJoining() {
			return isJoining;
		},
		get hasJoined() {
			return hasJoined;
		},
		get myJoinedTodo() {
			return myJoinedTodo;
		},
		load,
		handleStatusChange,
		handleCheckIn,
		handleSaveEdit,
		handleJoinTopic,
		handleToggleMyStatus
	};
}
