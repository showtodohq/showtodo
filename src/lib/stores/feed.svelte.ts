import { api } from '$lib/services/api';
import { toast } from '$lib/stores/toast.svelte';
import { userStore } from '$lib/stores/user.svelte';
import { todoRegistry } from '$lib/stores/entities/todo-registry.svelte';
import type { Todo, CategoryId } from '$lib/types/todo';

class FeedStore {
	todoIds = $state<string[]>([]);
	loading = $state(false);
	loadingMore = $state(false);
	nextCursor = $state<string | null>(null);
	activeCategory = $state<CategoryId | null>(null);
	loaded = $state(false);

	// 派生实体列表：只要 todoRegistry 中对应的实体被修改，这里立即自动响应
	todos = $derived.by(() => {
		return this.todoIds
			.map((id) => todoRegistry.get(id))
			.filter((t): t is Todo => Boolean(t));
	});

	insertTop(todoId: string) {
		if (!this.todoIds.includes(todoId)) {
			this.todoIds = [todoId, ...this.todoIds];
		}
	}

	replaceId(oldId: string, newId: string) {
		const idx = this.todoIds.indexOf(oldId);
		if (idx !== -1) {
			const next = [...this.todoIds];
			next[idx] = newId;
			this.todoIds = next;
		}
	}

	removeId(id: string) {
		this.todoIds = this.todoIds.filter((item) => item !== id);
	}

	async load(
		isInitial = true,
		category: CategoryId | null = this.activeCategory,
		force = false
	) {
		// 在途请求合并防抖：加载中避免重复发出相同请求
		if (isInitial && this.loading) return;
		if (!isInitial && this.loadingMore) return;

		if (isInitial && !force && this.loaded && this.activeCategory === category) {
			return;
		}

		this.activeCategory = category;
		if (isInitial) this.loading = true;
		else this.loadingMore = true;

		try {
			const res = await api.getTodos({
				category: category || undefined,
				currentUserId: userStore.id,
				cursor: isInitial ? undefined : (this.nextCursor ?? undefined),
				limit: 20
			});

			const fetchedTodos = res.todos || [];
			// 归一化存入实体中心
			todoRegistry.upsertMany(fetchedTodos);

			const ids = fetchedTodos.map((t) => t.id);
			this.todoIds = isInitial ? ids : [...this.todoIds, ...ids];
			this.nextCursor = res.nextCursor;
			this.loaded = true;
		} catch (error) {
			console.error('Failed to load feed todos:', error);
			toast.error('加载待办流失败，请重试');
		} finally {
			this.loading = false;
			this.loadingMore = false;
		}
	}
}

export const feedStore = new FeedStore();
