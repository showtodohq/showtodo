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

	hydrate(data: { todos: Todo[]; nextCursor?: string | null; category?: CategoryId | null }) {
		const fetchedTodos = data.todos || [];
		todoRegistry.upsertMany(fetchedTodos);
		this.todoIds = fetchedTodos.map((t) => t.id);
		this.nextCursor = data.nextCursor ?? null;
		this.activeCategory = data.category ?? null;
		this.loadedKey = JSON.stringify([this.activeCategory, userStore.id]);
		this.loaded = true;
		this.loading = false;
	}

	private requestVersion = 0;
	private requestKey: string | null = null;
	private loadedKey: string | null = null;

	async load(
		isInitial = true,
		category: CategoryId | null = this.activeCategory,
		force = false
	) {
		const viewerId = userStore.id;
		const key = JSON.stringify([category, viewerId]);
		const guestKey = JSON.stringify([category, undefined]);
		if (isInitial && this.loading && this.requestKey === key && !force) return;
		if (!isInitial && (this.loading || this.loadingMore || !this.nextCursor || (this.loadedKey !== key && this.loadedKey !== guestKey))) return;
		if (isInitial && !force && this.loaded && (this.loadedKey === key || this.loadedKey === guestKey)) return;

		const version = ++this.requestVersion;
		this.requestKey = key;
		const isCurrent = () => version === this.requestVersion && viewerId === userStore.id;
		if (isInitial && this.loadedKey !== key) {
			this.todoIds = [];
			this.nextCursor = null;
			this.loaded = false;
		}
		this.activeCategory = category;
		this.loading = isInitial;
		this.loadingMore = !isInitial;

		try {
			const res = await api.getTodos({
				category: category || undefined,
				currentUserId: userStore.id,
				cursor: isInitial ? undefined : (this.nextCursor ?? undefined),
				limit: 20
			});

			if (!isCurrent()) return;
			const fetchedTodos = res.todos || [];
			// 归一化存入实体中心
			todoRegistry.upsertMany(fetchedTodos);

			const ids = fetchedTodos.map((t) => t.id);
			this.todoIds = [...new Set(isInitial ? ids : [...this.todoIds, ...ids])];
			this.nextCursor = res.nextCursor;
			this.loadedKey = key;
			this.loaded = true;
		} catch (error) {
			if (!isCurrent()) return;
			console.error('Failed to load feed todos:', error);
			toast.error('Failed to load feed todos, please try again');
		} finally {
			if (version === this.requestVersion) {
				this.loading = false;
				this.loadingMore = false;
				this.requestKey = null;
			}
		}
	}
}

export const feedStore = new FeedStore();
