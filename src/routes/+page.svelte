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

	let selectedStatus = $state<TodoStatus | 'all'>('all');
	let selectedCategory = $state<string | 'all'>('all');
	let onlyMine = $state(false);

	let isSyncingFromUrl = false;

	$effect(() => {
		const searchParams = page.url.searchParams;
		const statusParam = searchParams.get('status') as TodoStatus | null;
		const categoryParam = searchParams.get('category');
		const mineParam = searchParams.get('mine');

		isSyncingFromUrl = true;
		if (
			statusParam &&
			['pending', 'in_progress', 'done', 'abandoned'].includes(statusParam)
		) {
			selectedStatus = statusParam;
		} else {
			selectedStatus = 'all';
		}

		if (categoryParam) {
			selectedCategory = categoryParam;
		} else {
			selectedCategory = 'all';
		}

		onlyMine = mineParam === 'true';
		isSyncingFromUrl = false;
	});

	$effect(() => {
		const st = selectedStatus;
		const cat = selectedCategory;
		const mine = onlyMine;

		if (isSyncingFromUrl) return;

		const currentParams = page.url.searchParams;
		const nextParams = new URLSearchParams();

		if (st !== 'all') nextParams.set('status', st);
		if (cat !== 'all') nextParams.set('category', cat);
		if (mine) nextParams.set('mine', 'true');

		const currentStr = currentParams.toString();
		const nextStr = nextParams.toString();

		if (currentStr !== nextStr) {
			const targetUrl = nextStr ? `/?${nextStr}` : '/';
			goto(targetUrl, { replaceState: true, keepFocus: true, noScroll: true });
		}

		loadTodos(true);
	});

	async function loadTodos(reset = false) {
		if (reset) {
			isLoading = true;
			nextCursor = null;
		} else {
			isLoadingMore = true;
		}

		try {
			const queryParams: any = {
				limit: 20
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
			toast.error(error.message || '加载待办列表失败');
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
				handle: author.handle,
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
	<!-- Create Card -->
	<section>
		<CreateTodoCard onCreated={handleTodoCreated} />
	</section>

	<!-- Filter Bar -->
	<section>
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
