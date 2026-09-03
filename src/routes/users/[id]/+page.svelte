<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { api } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import { todoStore } from '$lib/stores/todo.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { TODO_STATUSES } from '$lib/constants/status';
	import type { Todo, TodoStatus, ReactionEmoji } from '$lib/types/todo';
	import type { UserProfile } from '$lib/types/user';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TodoItem from '$lib/components/todo/TodoItem.svelte';
	import UserProfileCard from '$lib/components/user/UserProfileCard.svelte';
	import UserStatsGrid from '$lib/components/user/UserStatsGrid.svelte';

	let loading = $state(true);
	let error = $state<string | null>(null);
	let user = $state<UserProfile | null>(null);
	let userTodos = $state<Todo[]>([]);
	let activeTab = $state<TodoStatus | 'all'>('all');

	const isMe = $derived(
		Boolean(
			user &&
				((userStore.id && user.id === userStore.id) ||
					(userStore.handle && user.handle === userStore.handle) ||
					(userStore.email && user.email === userStore.email))
		)
	);

	const statusCounts = $derived.by(() => {
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

	const totalTodos = $derived(userTodos.length);
	const completionRate = $derived(
		totalTodos > 0 ? Math.round(((statusCounts.done || 0) / totalTodos) * 100) : 0
	);

	const filteredTodos = $derived(
		activeTab === 'all'
			? userTodos
			: userTodos.filter((t) => t.status === activeTab)
	);

	async function loadUserData(identifier: string) {
		error = null;

		// 1. 0ms 瞬时预填充：若是本人或流中已知作者，立即呈现名片信息
		if (userStore.id && (userStore.id === identifier || userStore.handle === identifier)) {
			user = {
				id: userStore.id,
				nickname: userStore.nickname || '用户',
				handle: userStore.handle || 'user',
				avatar: userStore.avatar || null,
				email: userStore.email || '',
				createdAt: '',
				updatedAt: ''
			};
			if (todoStore.todayTodos.length > 0) {
				userTodos = [...todoStore.todayTodos];
			}
			loading = false;
		} else {
			const knownAuthor = todoStore.feedTodos.find(
				(t) => t.author?.id === identifier || t.author?.handle === identifier
			)?.author;
			if (knownAuthor) {
				user = {
					id: knownAuthor.id,
					nickname: knownAuthor.nickname,
					handle: knownAuthor.handle,
					avatar: knownAuthor.avatar || null,
					email: '',
					createdAt: '',
					updatedAt: ''
				};
				loading = false;
			} else {
				loading = true;
			}
		}

		try {
			// 2. 后台获取最新权威实体及全部待办列表
			const res = await api.getUserById(identifier);
			user = res.user;

			const todosRes = await api.getTodos({
				authorId: user.id,
				currentUserId: userStore.id,
				limit: 100
			});
			userTodos = todosRes.todos || [];
		} catch (err) {
			console.error('Failed to load user:', err);
			if (!user) {
				error = (err as Error).message || '用户不存在或加载失败';
			}
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const paramId = page.params.id;
		if (paramId) {
			loadUserData(paramId);
		}
	});

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
	}

	function handleToggle(todo: Todo, nextStatus: TodoStatus, e?: MouseEvent) {
		todoStore.toggleStatus(todo.id, nextStatus, e, todo);
	}

	function handleReaction(todo: Todo, emoji?: ReactionEmoji) {
		todoStore.toggleReaction(todo.id, emoji, todo);
	}
</script>

<svelte:head>
	<title>{user ? `${user.nickname} (@${user.handle}) - 个人主页` : '用户主页 - Public Todo'}</title>
</svelte:head>

<div class="w-full space-y-6 sm:space-y-8">
	<!-- 顶部返回导航 -->
	<div class="flex items-center justify-between">
		<button
			type="button"
			onclick={() => (history.length > 1 ? history.back() : goto('/'))}
			class="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
		>
			<span>←</span>
			<span>返回广场</span>
		</button>
	</div>

	{#if loading}
		<div class="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
			<Spinner size="md" />
			<span class="text-xs">加载用户主页...</span>
		</div>
	{:else if error || !user}
		<div
			class="p-8 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3"
		>
			<div class="text-2xl">👤</div>
			<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
				{error || '未找到该用户'}
			</div>
			<p class="text-xs text-zinc-500 max-w-sm mx-auto">
				该用户可能未注册或链接无效，请返回广场查看活跃用户。
			</p>
			<Button variant="outline" size="sm" onclick={() => goto('/')}>
				返回公共待办广场
			</Button>
		</div>
	{:else}
		<!-- 用户名片与统计指标 -->
		<UserProfileCard {user} {isMe} onsaveprofile={handleSaveProfile}>
			<UserStatsGrid
				totalCount={totalTodos}
				{statusCounts}
				{completionRate}
			/>
		</UserProfileCard>

		<!-- 待办清单与分类筛选 -->
		<div class="space-y-4">
			<!-- 状态筛选 Tab 胶囊 -->
			<div
				class="flex items-center gap-1.5 text-xs font-medium border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3 flex-wrap"
			>
				<button
					type="button"
					onclick={() => (activeTab = 'all')}
					class="px-3 py-1.5 rounded-lg transition-colors cursor-pointer {activeTab === 'all'
						? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'}"
				>
					全部 ({totalTodos})
				</button>

				{#each TODO_STATUSES as st}
					<button
						type="button"
						onclick={() => (activeTab = st.id)}
						class="px-3 py-1.5 rounded-lg transition-colors cursor-pointer {activeTab === st.id
							? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
							: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'}"
					>
						{st.label} ({statusCounts[st.id] || 0})
					</button>
				{/each}
			</div>

			<!-- 待办条目列表 -->
			{#if filteredTodos.length === 0}
				<div
					class="p-12 text-center rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 space-y-2"
				>
					<div class="text-2xl">🌱</div>
					<div class="text-xs">当前筛选下暂无待办事项</div>
				</div>
			{:else}
				<div class="space-y-2">
					{#each filteredTodos as todo (todo.id)}
						<div
							class="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
						>
							<TodoItem
								{todo}
								isMine={Boolean(isMe)}
								ontoggle={handleToggle}
								onreaction={handleReaction}
							/>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
