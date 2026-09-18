import { api } from '$lib/services/api';
import { userStore } from '$lib/stores/user.svelte';
import { getLocalDayAsUtcRange } from '$lib/utils/format';
import { todoRegistry } from '$lib/stores/entities/todo-registry.svelte';
import type { Todo } from '$lib/types/todo';
import { isStatusDone } from '$lib/constants/status';

class TodayStore {
	todayTodoIds = $state<string[]>([]);
	loading = $state(false);
	loaded = $state(false);

	// 派生今日待办实体列表
	todos = $derived.by(() => {
		return this.todayTodoIds
			.map((id) => todoRegistry.get(id))
			.filter((t): t is Todo => Boolean(t));
	});

	// 派生今日完成与总计指标
	doneCount = $derived(this.todos.filter((t) => isStatusDone(t.status)).length);
	totalCount = $derived(this.todos.length);
	isAllDone = $derived(this.totalCount > 0 && this.doneCount >= this.totalCount);

	insertTop(todoId: string) {
		if (!this.todayTodoIds.includes(todoId)) {
			this.todayTodoIds = [todoId, ...this.todayTodoIds];
		}
	}

	replaceId(oldId: string, newId: string) {
		const idx = this.todayTodoIds.indexOf(oldId);
		if (idx !== -1) {
			const next = [...this.todayTodoIds];
			next[idx] = newId;
			this.todayTodoIds = next;
		}
	}

	removeId(id: string) {
		this.todayTodoIds = this.todayTodoIds.filter((item) => item !== id);
	}

	/**
	 * 判断当前用户今日是否已参与某内容的话题
	 */
	isTopicJoined(content: string): boolean {
		const norm = content.trim().toLowerCase();
		return this.todos.some((t) => t.content.trim().toLowerCase() === norm);
	}

	private requestVersion = 0;
	private requestKey: string | null = null;
	private loadedKey: string | null = null;

	async load(force = false) {
		const viewerId = userStore.id;
		const { startDateFrom, startDateTo } = getLocalDayAsUtcRange();
		const key = JSON.stringify([viewerId, startDateFrom, startDateTo]);
		// 没有服务端用户 ID 时绝不能发送不带 authorId 的全站查询。
		if (!viewerId) {
			++this.requestVersion;
			this.requestKey = this.loadedKey = null;
			this.todayTodoIds = [];
			this.loaded = false;
			this.loading = false;
			return;
		}
		if (this.loading && this.requestKey === key && !force) return;
		if (!force && this.loaded && this.loadedKey === key) return;

		const version = ++this.requestVersion;
		this.requestKey = key;
		if (this.loadedKey !== key) {
			this.todayTodoIds = [];
			this.loaded = false;
		}
		const isCurrent = () => version === this.requestVersion && viewerId === userStore.id;
		this.loading = true;
		try {
			const fetched: Todo[] = [];
			let cursor: string | undefined;
			do {
				const res = await api.getTodos({
					authorId: viewerId,
					currentUserId: viewerId,
					startDateFrom,
					startDateTo,
					limit: 100,
					cursor
				});
				if (!isCurrent()) return;
				fetched.push(...(res.todos || []));
				cursor = res.nextCursor || undefined;
			} while (cursor);
			todoRegistry.upsertMany(fetched);
			this.todayTodoIds = [...new Set(fetched.map((t) => t.id))];
			this.loadedKey = key;
			this.loaded = true;
		} catch (error) {
			if (isCurrent()) console.error('Failed to load today todos:', error);
		} finally {
			if (version === this.requestVersion) {
				this.loading = false;
				this.requestKey = null;
			}
		}
	}
}

export const todayStore = new TodayStore();
