import { api } from '$lib/services/api';
import { userStore } from '$lib/stores/user.svelte';
import { getLocalDayAsUtcRange } from '$lib/utils/format';
import { todoRegistry } from '$lib/stores/entities/todo-registry.svelte';
import type { Todo } from '$lib/types/todo';

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
	doneCount = $derived(this.todos.filter((t) => t.status === 'done').length);
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

	async load(force = false) {
		if (!userStore.id && !userStore.email) {
			this.todayTodoIds = [];
			this.loaded = false;
			return;
		}
		// 在途请求合并防抖：若正在加载中，避免同一瞬间重复发出多次请求
		if (this.loading) {
			return;
		}
		// 内存缓存拦截：非强制刷新下，只要已经加载过（即使是 0 条待办），均不再发起重复网络请求
		if (!force && this.loaded) {
			return;
		}

		this.loading = true;
		try {
			const { startDateFrom, startDateTo } = getLocalDayAsUtcRange();
			const res = await api.getTodos({
				authorId: userStore.id,
				startDateFrom,
				startDateTo,
				limit: 30
			});

			const fetched = res.todos || [];
			todoRegistry.upsertMany(fetched);
			this.todayTodoIds = fetched.map((t) => t.id);
			this.loaded = true;
		} catch (error) {
			console.error('Failed to load today todos:', error);
		} finally {
			this.loading = false;
		}
	}
}

export const todayStore = new TodayStore();
