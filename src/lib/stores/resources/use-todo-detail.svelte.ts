import { api } from '$lib/services/api';
import { userStore } from '$lib/stores/user.svelte';
import { todayStore } from '$lib/stores/today.svelte';
import { toast } from '$lib/stores/toast.svelte';
import { todoRegistry } from '$lib/stores/entities/todo-registry.svelte';
import { todoMutations } from '$lib/stores/mutations.svelte';
import type { Todo, TodoStatus, TodoActivityType } from '$lib/types/todo';
import { TODO_STATUS, isStatusDone } from '$lib/constants/status';

export function createTodoDetailResource(initialIdentifier?: string) {
	const initialCached = initialIdentifier ? (todoRegistry.get(initialIdentifier) || null) : null;
	let loading = $state(!initialCached);
	let isRevalidating = $state(false);
	let error = $state<string | null>(null);
	let todo = $state<Todo | null>(initialCached);
	let topicParticipantCount = $state<number>(initialCached?.topicParticipantCount || 0);
	let isSubmittingCheckIn = $state(false);
	let isJoining = $state(false);
	let serverMyJoinedTodo = $state<{ id: string; shortId?: string | null; status: TodoStatus } | null>(
		initialCached?.myJoinedTodo || null
	);

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

		// 1. 优先从本地已载入的待办实体中寻找（保证 0ms 乐观更新与打勾即时联动）
		const inStore = todayStore.todos.find((t) => {
			const isMyTodo = userStore.isAuthor(t.authorId, t.author?.email, t.author?.handle);
			if (!isMyTodo) return false;
			if (targetHash && t.topicHash === targetHash) return true;
			return t.content.trim().toLowerCase() === targetContentNorm;
		});
		if (inStore) return inStore;

		// 2. 若本地今日待办未包含，但服务端权威返回了当前用户的参与记录
		if (serverMyJoinedTodo?.id) {
			const cached = todoRegistry.get(serverMyJoinedTodo.id);
			if (cached) return cached;
			return {
				id: serverMyJoinedTodo.id,
				shortId: serverMyJoinedTodo.shortId || serverMyJoinedTodo.id,
				status: serverMyJoinedTodo.status,
				content: todo.content,
				topicHash: todo.topicHash,
				authorId: userStore.id || '',
				isNotePublic: true,
				note: null,
				category: todo.category,
				startDate: new Date().toISOString(),
				dueDate: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			} as Todo;
		}

		return undefined;
	});

	const hasJoined = $derived(
		Boolean(
			!isMine &&
				todo &&
				(Boolean(myJoinedTodo) ||
					Boolean(serverMyJoinedTodo) ||
					(Boolean(userStore.email) && todayStore.isTopicJoined(todo.content)))
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
			if (cached.myJoinedTodo !== undefined) {
				serverMyJoinedTodo = cached.myJoinedTodo;
			}
			loading = false;
			isRevalidating = true;
		} else if (!todo) {
			loading = true;
			isRevalidating = false;
			serverMyJoinedTodo = null;
		}

		try {
			// 2. 后台拉取单条待办完整数据（携带当前登录用户 ID，已聚合返回 topicParticipantCount 及 myJoinedTodo）
			const res = await api.getTodoById(identifier, userStore.id);
			todo = todoRegistry.upsert(res.todo);
			if (res.todo.topicParticipantCount !== undefined) {
				topicParticipantCount = res.todo.topicParticipantCount;
			}
			if (res.todo.myJoinedTodo !== undefined) {
				serverMyJoinedTodo = res.todo.myJoinedTodo;
			}
		} catch (err) {
			console.error('Failed to load todo detail:', err);
			if (!todo) {
				error = (err as Error).message || 'Todo does not exist or has been deleted';
			}
		} finally {
			loading = false;
			isRevalidating = false;
			inFlightIdentifier = null;
		}
	}

	async function handleStatusChange(nextStatus: TodoStatus, e?: MouseEvent) {
		if (!todo || !userStore.email) {
			toast.info('Please set your email in the top right avatar first');
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
			toast.success('Progress logged!');
		} catch (err) {
			if (todo) {
				todo.activities = prevActivities;
			}
			console.error('Failed to submit check-in:', err);
			toast.error(`Failed to log progress: ${(err as Error).message}`);
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
				todo = todoRegistry.upsert(res.todo);
				toast.success('Todo updated');
			}
		} catch (err) {
			toast.error(`Failed to update: ${(err as Error).message}`);
		}
	}

	async function handleJoinTopic() {
		if (!userStore.email) {
			toast.info('Please set your email in the top right avatar before joining');
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
				serverMyJoinedTodo = {
					id: joined.id,
					shortId: joined.shortId,
					status: joined.status
				};
				toast.success('Successfully joined this goal!');
			}
		} catch (err) {
			topicParticipantCount = Math.max(0, topicParticipantCount - 1);
			console.error('Failed to join topic:', err);
			toast.error(`Failed to join: ${(err as Error).message}`);
		} finally {
			isJoining = false;
		}
	}

	async function handleToggleMyStatus(nextStatus?: TodoStatus, e?: MouseEvent) {
		if (!myJoinedTodo || !userStore.email) return;

		const targetStatus: TodoStatus =
			nextStatus || (isStatusDone(myJoinedTodo.status) ? TODO_STATUS.PENDING : TODO_STATUS.DONE);
		const prevStatus = myJoinedTodo.status;
		if (serverMyJoinedTodo) {
			serverMyJoinedTodo.status = targetStatus;
		}

		try {
			await todoMutations.toggleStatus(myJoinedTodo.id, targetStatus, e, myJoinedTodo);
		} catch (err) {
			if (serverMyJoinedTodo) {
				serverMyJoinedTodo.status = prevStatus;
			}
			throw err;
		}
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
