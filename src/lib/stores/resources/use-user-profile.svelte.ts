import { api } from '$lib/services/api';
import { userStore } from '$lib/stores/user.svelte';
import { todayStore } from '$lib/stores/today.svelte';
import { feedStore } from '$lib/stores/feed.svelte';
import { toast } from '$lib/stores/toast.svelte';
import { todoRegistry } from '$lib/stores/entities/todo-registry.svelte';
import { todoMutations } from '$lib/stores/mutations.svelte';
import type { Todo, TodoStatus, ReactionEmoji, CategoryId } from '$lib/types/todo';
import type { UserProfile } from '$lib/types/user';

export function createUserProfileResource() {
	let loading = $state(true);
	let error = $state<string | null>(null);
	let user = $state<UserProfile | null>(null);
	let userTodoIds = $state<string[]>([]);
	let activeTab = $state<TodoStatus | 'all'>('all');
	let activeCategory = $state<CategoryId | null>(null);

	// 派生实体列表：只要 todoRegistry 变异，自动驱动更新
	const userTodos = $derived.by(() => {
		return userTodoIds
			.map((id) => todoRegistry.get(id))
			.filter((t): t is Todo => Boolean(t));
	});

	const isMe = $derived(
		Boolean(
			user &&
				((userStore.id && user.id === userStore.id) ||
					(userStore.handle && user.handle === userStore.handle) ||
					(userStore.email && user.email === userStore.email))
		)
	);

	// 用户全局总计（供 UserStatsGrid 展示）
	const globalTotalCount = $derived(userTodos.length);
	const globalStatusCounts = $derived.by(() => {
		const counts: Record<TodoStatus, number> = {
			pending: 0,
			in_progress: 0,
			done: 0,
			abandoned: 0
		};
		for (const t of userTodos) {
			if (t.status in counts) counts[t.status]++;
		}
		return counts;
	});
	const globalCompletionRate = $derived(
		globalTotalCount > 0 ? Math.round(((globalStatusCounts.done || 0) / globalTotalCount) * 100) : 0
	);

	// 当前分类作用域下的待办
	const categoryScopedTodos = $derived(
		activeCategory ? userTodos.filter((t) => t.category === activeCategory) : userTodos
	);
	const scopedTotalCount = $derived(categoryScopedTodos.length);
	const scopedStatusCounts = $derived.by(() => {
		const counts: Record<TodoStatus, number> = {
			pending: 0,
			in_progress: 0,
			done: 0,
			abandoned: 0
		};
		for (const t of categoryScopedTodos) {
			if (t.status in counts) counts[t.status]++;
		}
		return counts;
	});

	const filteredTodos = $derived(
		activeTab === 'all'
			? categoryScopedTodos
			: categoryScopedTodos.filter((t) => t.status === activeTab)
	);

	let inFlightIdentifier: string | null = null;

	async function load(identifier: string) {
		if (inFlightIdentifier === identifier) {
			return;
		}
		inFlightIdentifier = identifier;
		error = null;

		// 1. 0ms 瞬时预填充（优先从内存已有 store 中秒开呈现，消除白屏/转圈）
		const isMeIdentity = userStore.id && (userStore.id === identifier || userStore.handle === identifier);
		if (isMeIdentity) {
			user = {
				id: userStore.id!,
				nickname: userStore.nickname || '用户',
				handle: userStore.handle || 'user',
				avatar: userStore.avatar || null,
				email: userStore.email || '',
				createdAt: '',
				updatedAt: ''
			};
			if (todayStore.todayTodoIds.length > 0) {
				userTodoIds = [...todayStore.todayTodoIds];
			}
			loading = false;
		} else {
			const knownTodo = feedStore.todos.find(
				(t) => t.author?.id === identifier || t.author?.handle === identifier
			);
			const author = knownTodo?.author;
			if (author) {
				user = {
					id: author.id,
					nickname: author.nickname,
					handle: author.handle,
					avatar: author.avatar || null,
					email: '',
					createdAt: '',
					updatedAt: ''
				};
				const matchingTodos = feedStore.todos.filter(
					(t) => t.author?.id === author.id || t.author?.handle === author.handle
				);
				userTodoIds = matchingTodos.map((t) => t.id);
				loading = false;
			} else {
				loading = true;
			}
		}

		try {
			// 2. 后台获取权威数据：若是本人 ID 已知，直接并行拉取节省等待延迟
			if (isMeIdentity && userStore.id) {
				const [userRes, todosRes] = await Promise.all([
					api.getUserById(identifier),
					api.getTodos({
						authorId: userStore.id,
						currentUserId: userStore.id,
						limit: 100
					})
				]);
				user = userRes.user;
				const fetched = todosRes.todos || [];
				todoRegistry.upsertMany(fetched);
				userTodoIds = fetched.map((t) => t.id);
			} else {
				const res = await api.getUserById(identifier);
				user = res.user;

				const todosRes = await api.getTodos({
					authorId: user.id,
					currentUserId: userStore.id,
					limit: 100
				});

				const fetched = todosRes.todos || [];
				todoRegistry.upsertMany(fetched);
				userTodoIds = fetched.map((t) => t.id);
			}
		} catch (err) {
			console.error('Failed to load user profile:', err);
			if (!user) {
				error = (err as Error).message || '用户不存在或加载失败';
			}
		} finally {
			loading = false;
			inFlightIdentifier = null;
		}
	}

	async function handleSaveProfile(data: {
		nickname: string;
		handle: string;
		avatar: string | null;
	}) {
		if (!user || !userStore.email) return;

		const res = await api.updateUser(user.id, {
			email: userStore.email,
			...data
		});

		if (res.user) {
			user = res.user;
			userStore.updateUserFromProfile(res.user);
			toast.success('资料已更新');
		}
		return res.user;
	}

	function handleToggle(todo: Todo, nextStatus: TodoStatus, e?: MouseEvent) {
		todoMutations.toggleStatus(todo.id, nextStatus, e, todo);
	}

	function handleReaction(todo: Todo, emoji?: ReactionEmoji) {
		todoMutations.toggleReaction(todo.id, emoji, todo);
	}

	return {
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get user() {
			return user;
		},
		get isMe() {
			return isMe;
		},
		get activeTab() {
			return activeTab;
		},
		set activeTab(val: TodoStatus | 'all') {
			activeTab = val;
		},
		get activeCategory() {
			return activeCategory;
		},
		set activeCategory(val: CategoryId | null) {
			activeCategory = val;
		},
		get globalTotalCount() {
			return globalTotalCount;
		},
		get globalStatusCounts() {
			return globalStatusCounts;
		},
		get globalCompletionRate() {
			return globalCompletionRate;
		},
		get scopedTotalCount() {
			return scopedTotalCount;
		},
		get scopedStatusCounts() {
			return scopedStatusCounts;
		},
		get filteredTodos() {
			return filteredTodos;
		},
		load,
		handleSaveProfile,
		handleToggle,
		handleReaction
	};
}
