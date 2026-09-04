import { todoRegistry } from '$lib/stores/entities/todo-registry.svelte';
import { feedStore } from '$lib/stores/feed.svelte';
import { todayStore } from '$lib/stores/today.svelte';
import { trendingStore } from '$lib/stores/trending.svelte';
import { todoMutations } from '$lib/stores/mutations.svelte';
import type { Todo, TodoStatus, ReactionEmoji, CategoryId, DailyCard } from '$lib/types/todo';

/**
 * TodoStore Facade 门面类
 * 
 * 聚合标准化实体中心 (todoRegistry) 与三大独立领域模型 (feedStore, todayStore, trendingStore)，
 * 并代理乐观变异动作 (todoMutations)。
 * 对外维持 100% 优雅兼容的接口签名。
 */
class TodoStore {
	// 广场流状态代理
	get feedTodos(): Todo[] {
		return feedStore.todos;
	}
	get feedLoading(): boolean {
		return feedStore.loading;
	}
	get feedLoadingMore(): boolean {
		return feedStore.loadingMore;
	}
	get feedNextCursor(): string | null {
		return feedStore.nextCursor;
	}
	get activeCategory(): CategoryId | null {
		return feedStore.activeCategory;
	}
	get feedLoaded(): boolean {
		return feedStore.loaded;
	}

	// 今日待办状态代理
	get todayTodos(): Todo[] {
		return todayStore.todos;
	}
	get todayLoading(): boolean {
		return todayStore.loading;
	}
	get todayLoaded(): boolean {
		return todayStore.loaded;
	}
	get todayDoneCount(): number {
		return todayStore.doneCount;
	}
	get todayTotalCount(): number {
		return todayStore.totalCount;
	}

	// 热门多人卡片代理
	get trendingCards(): DailyCard[] {
		return trendingStore.cards;
	}
	get trendingLoading(): boolean {
		return trendingStore.loading;
	}
	get trendingLoaded(): boolean {
		return trendingStore.loaded;
	}

	// 数据拉取方法代理
	loadFeed(
		isInitial = true,
		category: CategoryId | null = feedStore.activeCategory,
		force = false
	) {
		return feedStore.load(isInitial, category, force);
	}

	loadTodayTodos(force = false) {
		return todayStore.load(force);
	}

	loadTrendingCards(force = false) {
		return trendingStore.load(force);
	}

	// 实体检索与缓存代理
	cacheTodo(todo: Todo) {
		return todoRegistry.upsert(todo);
	}

	getTodo(identifier: string): Todo | undefined {
		return todoRegistry.get(identifier);
	}

	isTopicJoined(content: string): boolean {
		return todayStore.isTopicJoined(content);
	}

	// 变异操作代理
	createTodo(data: {
		content: string;
		note?: string | null;
		isNotePublic?: boolean;
		category?: CategoryId | string | null;
	}) {
		return todoMutations.createTodo(data);
	}

	joinTopic(data: { content: string; category?: CategoryId | string | null }) {
		return todoMutations.joinTopic(data);
	}

	toggleStatus(
		todoId: string,
		nextStatus?: TodoStatus,
		event?: MouseEvent,
		fallbackTodo?: Todo,
		options?: { activityNote?: string }
	) {
		return todoMutations.toggleStatus(todoId, nextStatus, event, fallbackTodo, options);
	}

	toggleReaction(todoId: string, emoji?: ReactionEmoji, fallbackTodo?: Todo) {
		return todoMutations.toggleReaction(todoId, emoji, fallbackTodo);
	}
}

export const todoStore = new TodoStore();

// 导出所有拆分后的领域 Store 与统一实体中心
export { todoRegistry } from '$lib/stores/entities/todo-registry.svelte';
export { feedStore } from '$lib/stores/feed.svelte';
export { todayStore } from '$lib/stores/today.svelte';
export { trendingStore } from '$lib/stores/trending.svelte';
export { todoMutations } from '$lib/stores/mutations.svelte';
