<script lang="ts">
	import { page } from '$app/state';
	import { getStatusConfig } from '$lib/constants/status';
	import { api } from '$lib/services/api';
	import { toast } from '$lib/stores/toast.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import type { Todo, TodoStatus } from '$lib/types/todo';
	import type { UserProfile } from '$lib/types/user';
	import Avatar from '$lib/components/common/Avatar.svelte';
	import TodoFilter from '$lib/components/todo/TodoFilter.svelte';
	import TodoList from '$lib/components/todo/TodoList.svelte';
	import UserProfileModal from '$lib/components/user/UserProfileModal.svelte';
	import Icon from '@iconify/svelte';

	let userHandle = $derived(page.params.user);

	let user = $state<UserProfile | null>(null);
	let todos = $state<Todo[]>([]);
	let nextCursor = $state<string | null>(null);
	let isLoadingUser = $state(true);
	let isLoadingTodos = $state(true);
	let isLoadingMore = $state(false);
	let isProfileModalOpen = $state(false);

	let selectedStatus = $state<TodoStatus | 'all'>('all');
	let selectedCategory = $state<string | 'all'>('all');

	let isCurrentUser = $derived(
		user ? userStore.isAuthor(user.id, user.email, user.handle) : false
	);

	$effect(() => {
		if (userHandle) {
			loadUserData();
		}
	});

	$effect(() => {
		if (user) {
			const st = selectedStatus;
			const cat = selectedCategory;
			loadUserTodos(true);
		}
	});

	async function loadUserData() {
		if (!userHandle) return;
		isLoadingUser = true;
		try {
			const res = await api.getUserById(userHandle);
			user = res.user;
		} catch (error: any) {
			toast.error('未找到该用户');
		} finally {
			isLoadingUser = false;
		}
	}

	async function loadUserTodos(reset = false) {
		if (!user) return;
		if (reset) {
			isLoadingTodos = true;
			nextCursor = null;
		} else {
			isLoadingMore = true;
		}

		try {
			const queryParams: any = {
				authorId: user.id,
				limit: 20
			};
			if (selectedStatus !== 'all') {
				queryParams.status = selectedStatus;
			}
			if (selectedCategory !== 'all') {
				queryParams.category = selectedCategory;
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
			toast.error('加载待办失败');
		} finally {
			isLoadingTodos = false;
			isLoadingMore = false;
		}
	}

	function handleTodoUpdated(updated: Todo) {
		todos = todos.map((t) => (t.id === updated.id ? updated : t));
	}

	// 统计数据
	let totalTodos = $derived(todos.length);
	let inProgressCount = $derived(todos.filter((t) => t.status === 'in_progress').length);
	let doneCount = $derived(todos.filter((t) => t.status === 'done').length);
	let totalReactions = $derived(
		todos.reduce((sum, t) => {
			if (!t.reactions) return sum;
			return sum + Object.values(t.reactions).reduce((s, c) => s + (c || 0), 0);
		}, 0)
	);
</script>

<svelte:head>
	<title>{user ? `${user.nickname} (@${user.handle})` : '用户主页'} — Public Todo</title>
</svelte:head>

<div class="space-y-6">
	<!-- Back link -->
	<div>
		<a
			href="/"
			class="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
		>
			<Icon icon="lucide:arrow-left" class="w-3.5 h-3.5" />
			<span>返回广场</span>
		</a>
	</div>

	<!-- User Profile Header Card -->
	{#if isLoadingUser}
		<div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-6 animate-pulse flex items-center gap-4">
			<div class="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
			<div class="space-y-2 flex-1">
				<div class="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
				<div class="h-3 w-48 bg-zinc-100 dark:bg-zinc-800/60 rounded"></div>
			</div>
		</div>
	{:else if user}
		<section
			class="relative rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-6 shadow-xs"
		>
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div class="flex items-center gap-4">
					<Avatar avatar={user.avatar} seed={user.nickname} size="xl" />
					<div class="space-y-1">
						<div class="flex items-center gap-2">
							<h1 class="text-xl font-bold text-zinc-900 dark:text-zinc-50">
								{user.nickname}
							</h1>
							<span class="text-xs font-mono font-medium text-zinc-400">
								@{user.handle}
							</span>
							{#if isCurrentUser}
								<span class="px-2 py-0.5 rounded-full text-[10px] bg-zinc-100 dark:bg-zinc-800 font-medium text-zinc-600 dark:text-zinc-300">
									我自己
								</span>
							{/if}
						</div>
						<p class="text-xs text-zinc-400 font-mono">
							加入于 {new Date(user.createdAt).toLocaleDateString()}
						</p>
					</div>
				</div>

				{#if isCurrentUser}
					<button
						type="button"
						onclick={() => (isProfileModalOpen = true)}
						class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer self-start sm:self-auto"
					>
						<Icon icon="lucide:settings" class="w-3.5 h-3.5 text-zinc-500" />
						<span>编辑资料</span>
					</button>
				{/if}
			</div>

			<!-- User Stats Row -->
			<div class="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
				<div class="p-2 rounded-xl bg-zinc-50/60 dark:bg-zinc-800/40">
					<div class="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
						{totalTodos}
					</div>
					<div class="text-[11px] text-zinc-400">全部</div>
				</div>
				<div class="p-2 rounded-xl bg-blue-50/50 dark:bg-blue-950/30">
					<div class="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">
						{inProgressCount}
					</div>
					<div class="text-[11px] text-zinc-400">{getStatusConfig('in_progress').label}</div>
				</div>
				<div class="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30">
					<div class="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
						{doneCount}
					</div>
					<div class="text-[11px] text-zinc-400">{getStatusConfig('done').label}</div>
				</div>
				<div class="p-2 rounded-xl bg-orange-50/50 dark:bg-orange-950/30 col-span-3 sm:col-span-1">
					<div class="text-base sm:text-lg font-bold text-orange-600 dark:text-orange-400 font-mono">
						{totalReactions}
					</div>
					<div class="text-[11px] text-zinc-400">获赞</div>
				</div>
			</div>
		</section>
	{/if}

	<!-- Filters -->
	<section>
		<TodoFilter
			{selectedStatus}
			{selectedCategory}
			onlyMine={false}
			onStatusChange={(st) => (selectedStatus = st)}
			onCategoryChange={(cat) => (selectedCategory = cat)}
			onOnlyMineChange={() => {}}
		/>
	</section>

	<!-- User Todos List -->
	<section>
		<TodoList
			{todos}
			isLoading={isLoadingTodos}
			{isLoadingMore}
			hasMore={!!nextCursor}
			onLoadMore={() => loadUserTodos(false)}
			onTodoUpdated={handleTodoUpdated}
			emptyMessage="暂无待办事项"
		/>
	</section>
</div>

{#if user}
	<UserProfileModal
		isOpen={isProfileModalOpen}
		currentUser={user}
		onClose={() => {
			isProfileModalOpen = false;
			loadUserData();
		}}
	/>
{/if}
