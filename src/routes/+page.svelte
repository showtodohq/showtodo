<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { api } from '$lib/services/api';
	import { toast } from '$lib/stores/toast.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import type { Author, Todo, TodoStatus } from '$lib/types/todo';
	import CreateTodoCard from '$lib/components/todo/CreateTodoCard.svelte';
	import TodoFilter from '$lib/components/todo/TodoFilter.svelte';
	import TodoList from '$lib/components/todo/TodoList.svelte';

	let todos = $state<Todo[]>([]);
	let nextCursor = $state<string | null>(null);
	let isLoading = $state(true);
	let isLoadingMore = $state(false);

	// Filter state
	let selectedStatus = $state<TodoStatus | 'all'>('all');
	let selectedCategory = $state<string | 'all'>('all');
	let onlyMine = $state(false);

	// 从 URL 参数恢复筛选状态
	$effect(() => {
		const statusParam = page.url.searchParams.get('status');
		const categoryParam = page.url.searchParams.get('category');
		const mineParam = page.url.searchParams.get('mine');

		if (statusParam && ['pending', 'in_progress', 'done', 'abandoned'].includes(statusParam)) {
			selectedStatus = statusParam as TodoStatus;
		}
		if (categoryParam) {
			selectedCategory = categoryParam;
		}
		if (mineParam === 'true') {
			onlyMine = true;
		}
	});

	// 当筛选条件变化时重新加载列表并同步 URL
	$effect(() => {
		// 收集响应式依赖
		const status = selectedStatus;
		const cat = selectedCategory;
		const mine = onlyMine;
		const currentUserId = userStore.id;

		syncUrl(status, cat, mine);
		loadTodos(true);
	});

	function syncUrl(status: string, cat: string, mine: boolean) {
		if (typeof window === 'undefined') return;
		const url = new URL(window.location.href);
		if (status !== 'all') {
			url.searchParams.set('status', status);
		} else {
			url.searchParams.delete('status');
		}

		if (cat !== 'all') {
			url.searchParams.set('category', cat);
		} else {
			url.searchParams.delete('category');
		}

		if (mine) {
			url.searchParams.set('mine', 'true');
		} else {
			url.searchParams.delete('mine');
		}

		goto(url.pathname + url.search, { replaceState: true, noScroll: true, keepFocus: true });
	}

	async function loadTodos(reset = false) {
		if (reset) {
			isLoading = true;
			nextCursor = null;
		} else {
			isLoadingMore = true;
		}

		try {
			const queryParams: any = {
				limit: 15
			};

			if (selectedStatus !== 'all') {
				queryParams.status = selectedStatus;
			}
			if (selectedCategory !== 'all') {
				queryParams.category = selectedCategory;
			}
			if (onlyMine && userStore.id) {
				queryParams.authorId = userStore.id;
			}
			if (!reset && nextCursor) {
				queryParams.cursor = nextCursor;
			}

			const res = await api.getTodos(queryParams);
			if (reset) {
				todos = res.todos;
			} else {
				todos = [...todos, ...res.todos];
			}
			nextCursor = res.nextCursor;
		} catch (error: any) {
			toast.error('加载 Todo 列表失败: ' + (error.message || '请检查网络'));
		} finally {
			isLoading = false;
			isLoadingMore = false;
		}
	}

	function handleTodoCreated(newTodo: Todo, author: Author) {
		const fullTodo: Todo = {
			...newTodo,
			author: {
				id: author.id,
				nickname: author.nickname,
				avatar: author.avatar
			},
			reactions: {}
		};
		todos = [fullTodo, ...todos];
	}

	function handleTodoUpdated(updatedTodo: Todo) {
		todos = todos.map((t) => (t.id === updatedTodo.id ? updatedTodo : t));
	}
</script>

<div class="space-y-6">
	<!-- Hero / Intro -->
	<section class="space-y-1">
		<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
			公开待办广场 🎯
		</h1>
		<p class="text-xs sm:text-sm text-zinc-500">
			围观大家的公开目标，立下自己的 Flag，互相打气与见证！
		</p>
	</section>

	<!-- Create Card -->
	<section>
		<CreateTodoCard onCreated={handleTodoCreated} />
	</section>

	<!-- Filter Bar -->
	<section class="pt-2">
		<TodoFilter
			{selectedStatus}
			{selectedCategory}
			{onlyMine}
			onStatusChange={(st) => (selectedStatus = st)}
			onCategoryChange={(cat) => (selectedCategory = cat)}
			onOnlyMineChange={(mine) => (onlyMine = mine)}
		/>
	</section>

	<!-- Todos Feed -->
	<section>
		<TodoList
			{todos}
			{isLoading}
			{isLoadingMore}
			hasMore={!!nextCursor}
			onLoadMore={() => loadTodos(false)}
			onTodoUpdated={handleTodoUpdated}
		/>
	</section>
</div>
