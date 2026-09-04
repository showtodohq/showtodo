import { api } from '$lib/services/api';
import { userStore } from '$lib/stores/user.svelte';
import { toast } from '$lib/stores/toast.svelte';
import { todoRegistry } from '$lib/stores/entities/todo-registry.svelte';
import { todoMutations } from '$lib/stores/mutations.svelte';
import type { Todo, TodoStatus } from '$lib/types/todo';

export function createTodoDetailResource() {
	let loading = $state(true);
	let error = $state<string | null>(null);
	let todo = $state<Todo | null>(null);
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

	async function load(identifier: string) {
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
			// 2. 后台静默拉取最新全量数据（包括动态时间线与反应）
			const res = await api.getTodoById(identifier);
			// 实体仓库归一化合并，保持引用
			todo = todoRegistry.upsert(res.todo);

			if (todo.topicHash) {
				try {
					const info = await api.getTopicInfo(todo.id);
					topicParticipantCount = info.participantCount || 0;
				} catch {
					// ignore topic info failure
				}
			}
		} catch (err) {
			console.error('Failed to load todo detail:', err);
			if (!todo) {
				error = (err as Error).message || '待办不存在或已被删除';
			}
		} finally {
			loading = false;
		}
	}

	async function handleStatusChange(nextStatus: TodoStatus, e?: MouseEvent) {
		if (!todo || !userStore.email) {
			toast.info('请先绑定邮箱');
			return;
		}

		await todoMutations.toggleStatus(todo.id, nextStatus, e, todo);

		// 静默刷新动态时间线
		try {
			const updated = await api.getTodoById(todo.id);
			if (todo) {
				todo.activities = updated.todo.activities;
			}
		} catch {
			// ignore activity sync error
		}
	}

	async function handleCheckIn({ status, note }: { status: TodoStatus; note: string }) {
		if (!todo || !userStore.email) return;

		isSubmittingCheckIn = true;
		try {
			const statusChanged = status !== todo.status;
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
