<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/services/api';
	import type { Todo, ReactionEmoji, TodoStatus, CategoryId } from '$lib/types/todo';
	import { userStore } from '$lib/stores/user.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { optimisticAction } from '$lib/utils/mutation';
	import { confetti } from '$lib/utils/confetti';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import TodoItem from '$lib/components/todo/TodoItem.svelte';
	import TodoComposer from '$lib/components/todo/TodoComposer.svelte';
	import MyTodayWidget from '$lib/components/widgets/MyTodayWidget.svelte';
	import TrendingTopicsWidget from '$lib/components/widgets/TrendingTopicsWidget.svelte';

	// ---------------------------------------------------------------------------
	// 列表数据与分页加载状态
	// ---------------------------------------------------------------------------
	let todos = $state<Todo[]>([]);
	let nextCursor = $state<string | null>(null);
	let loading = $state(true);
	let loadingMore = $state(false);

	let myTodayWidgetRef = $state<ReturnType<typeof MyTodayWidget> | null>(null);
	let trendingWidgetRef = $state<ReturnType<typeof TrendingTopicsWidget> | null>(null);

	let prevUserId = $state<string | undefined>(undefined);

	async function loadLatestTodos(isInitial = true) {
		if (isInitial) {
			loading = true;
		} else {
			loadingMore = true;
		}

		try {
			const res = await api.getTodos({
				currentUserId: userStore.id,
				cursor: isInitial ? undefined : (nextCursor ?? undefined),
				limit: 20
			});

			if (isInitial) {
				todos = res.todos || [];
			} else {
				todos = [...todos, ...(res.todos || [])];
			}
			nextCursor = res.nextCursor;
		} catch (error) {
			console.error('Failed to load todos:', error);
			toast.error('加载最新待办失败，请重试');
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	$effect(() => {
		const curUserId = userStore.id;
		if (curUserId !== prevUserId) {
			prevUserId = curUserId;
			loadLatestTodos(true);
		}
	});

	onMount(() => {
		loadLatestTodos(true);
	});

	// ---------------------------------------------------------------------------
	// 快速发布待办
	// ---------------------------------------------------------------------------
	async function handleCreateTodo(data: {
		content: string;
		note: string | null;
		category: CategoryId | null;
	}) {
		const email = userStore.email;
		if (!email) return;

		const tempId = `temp-${Date.now()}`;
		const tempTodo: Todo = {
			id: tempId,
			shortId: tempId,
			topicHash: `topic-${Date.now()}`,
			content: data.content,
			note: data.note,
			isNotePublic: true,
			category: data.category,
			authorId: userStore.id || '',
			status: 'pending',
			startDate: new Date().toISOString(),
			dueDate: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			author: {
				id: userStore.id || '',
				handle: userStore.handle,
				nickname: userStore.nickname,
				avatar: userStore.avatar
			},
			reactions: { '❤️': 0, '👍': 0, '🔥': 0, '💪': 0, '👏': 0, '🚀': 0, '🎉': 0, '👀': 0 },
			myReactions: []
		};

		const prevTodos = [...todos];
		try {
			await optimisticAction({
				apply: () => {
					todos.unshift(tempTodo);
				},
				rollback: () => {
					todos = prevTodos;
				},
				action: async () => {
					const res = await api.createTodo({
						email,
						content: data.content,
						note: data.note,
						category: data.category ?? undefined
					});
					tempTodo.id = res.todo.id;
					tempTodo.shortId = res.todo.shortId;
					if (res.author) {
						userStore.updateUserFromProfile(res.author);
					}
					myTodayWidgetRef?.refresh();
					trendingWidgetRef?.loadTrending();
				},
				onError: (err) => {
					toast.error(`发布失败: ${(err as Error).message}`);
				}
			});

			toast.success('已发布公开待办！');
		} catch {
			// handled
		}
	}

	// ---------------------------------------------------------------------------
	// 待办状态切换 (0ms 乐观更新与全屏纸屑)
	// ---------------------------------------------------------------------------
	async function handleToggleStatus(todo: Todo, event?: MouseEvent) {
		if (!userStore.email) return;

		const prevStatus = todo.status;
		const nextStatus: TodoStatus = prevStatus === 'done' ? 'pending' : 'done';

		if (nextStatus === 'done') {
			if (event) {
				confetti.burst(event.clientX, event.clientY, 300);
			} else {
				confetti.burst(undefined, undefined, 300);
			}
			myTodayWidgetRef?.triggerCheckAllDone(todo.id);
		}

		try {
			await optimisticAction({
				apply: () => {
					todo.status = nextStatus;
				},
				rollback: () => {
					todo.status = prevStatus;
				},
				action: async () => {
					await api.updateTodo(todo.id, {
						email: userStore.email!,
						status: nextStatus
					});
					myTodayWidgetRef?.refresh();
				},
				onError: (err) => {
					toast.error(`状态更新失败: ${(err as Error).message}`);
				}
			});
		} catch {
			// error handled
		}
	}

	// ---------------------------------------------------------------------------
	// 极简表态处理：点击主爱心(无emoji)一键全清/点赞，浮层内传emoji单项切换
	// ---------------------------------------------------------------------------
	async function handleReaction(todo: Todo, emoji?: ReactionEmoji) {
		if (!userStore.email) return toast.info('请先点击右上角头像绑定邮箱再表态');

		todo.reactions ??= { '❤️': 0, '👍': 0, '🔥': 0, '💪': 0, '👏': 0, '🚀': 0, '🎉': 0, '👀': 0 };
		todo.myReactions ??= [];

		const prevReactions = { ...todo.reactions };
		const prevMyReactions = [...todo.myReactions];
		const targetEmoji = emoji || (todo.myReactions.length > 0 ? undefined : '❤️');
		const isLiked = targetEmoji ? todo.myReactions.includes(targetEmoji) : true;

		try {
			await optimisticAction({
				apply: () => {
					if (isLiked) {
						if (!targetEmoji) {
							// 一键全清
							for (const e of prevMyReactions) {
								todo.reactions![e] = Math.max(0, (todo.reactions![e] || 1) - 1);
							}
							todo.myReactions = [];
						} else {
							// 单个取消
							todo.reactions![targetEmoji] = Math.max(0, (todo.reactions![targetEmoji] || 1) - 1);
							todo.myReactions = todo.myReactions!.filter((e) => e !== targetEmoji);
						}
					} else {
						// 单个新增
						todo.reactions![targetEmoji!] = (todo.reactions![targetEmoji!] || 0) + 1;
						todo.myReactions = [...todo.myReactions!, targetEmoji!];
					}
				},
				rollback: () => {
					todo.reactions = prevReactions;
					todo.myReactions = prevMyReactions;
				},
				action: async () => {
					if (isLiked) {
						await api.removeReaction(todo.id, targetEmoji, userStore.email!);
					} else {
						await api.addReaction(todo.id, targetEmoji!, userStore.email!);
					}
				},
				onError: (err) => {
					toast.error(`表态操作失败: ${(err as Error).message}`);
				}
			});
		} catch {
			// handled
		}
	}

	// ---------------------------------------------------------------------------
	// 热门目标一键跟练
	// ---------------------------------------------------------------------------
	async function handleJoinTopic(content: string, category?: string | null) {
		if (!userStore.email) {
			toast.info('请先点击右上角头像设置邮箱');
			return;
		}

		await handleCreateTodo({
			content,
			note: null,
			category: (category as CategoryId) || null
		});
	}

	function isMyTodo(todo: Todo): boolean {
		if (!userStore.current && !userStore.id) return false;
		if (userStore.id && todo.authorId === userStore.id) return true;
		if (userStore.handle && todo.author?.handle === userStore.handle) return true;
		return false;
	}

	function handleWidgetTodoToggled(todoId: string, nextStatus: TodoStatus) {
		const target = todos.find((t) => t.id === todoId);
		if (target) {
			target.status = nextStatus;
		}
	}
</script>

<div class="w-full space-y-6 sm:space-y-8">
	<!-- 顶部 Twitter / X 风格极简快速发布框 (独立领域组件) -->
	<TodoComposer onsubmit={handleCreateTodo} />

	<!-- 下方主体：左侧最新待办 Feed + 右侧辅助 Widgets 左右双栏布局 -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
		<!-- 左侧主流：最新公开待办动态流 (占 7~8 栏) -->
		<div class="lg:col-span-7 xl:col-span-8 space-y-4">
			<div class="flex items-center justify-between px-1">
				<h2 class="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
					最新动态流 (Latest Stream)
				</h2>
			</div>

			<!-- Feed 内容区 -->
			{#if loading}
				<div class="flex justify-center py-20 text-zinc-400">
					<Spinner size="md" />
				</div>
			{:else if todos.length === 0}
				<div
					class="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800/80 py-20 text-center text-xs text-zinc-400"
				>
					暂无公开待办，在上方发布第一条吧 ✨
				</div>
			{:else}
				<div class="space-y-1 sm:space-y-1.5">
					{#each todos as todo (todo.id)}
						<TodoItem
							{todo}
							isMine={isMyTodo(todo)}
							ontoggle={handleToggleStatus}
							onreaction={handleReaction}
						/>
					{/each}
				</div>

				<!-- 分页加载更多 -->
				{#if nextCursor}
					<div class="pt-4 flex justify-center">
						<button
							type="button"
							onclick={() => loadLatestTodos(false)}
							disabled={loadingMore}
							class="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer disabled:opacity-50"
						>
							{#if loadingMore}
								<Spinner size="xs" />
								<span>加载中...</span>
							{:else}
								<span>加载更多待办</span>
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							{/if}
						</button>
					</div>
				{/if}
			{/if}
		</div>

		<!-- 右侧副栏：辅助与概览组件库 (占 4~5 栏) -->
		<aside class="lg:col-span-5 xl:col-span-4 space-y-6">
			<!-- 1. 我的今日待办 (未绑定邮箱时组件内部完全隐藏) -->
			<MyTodayWidget bind:this={myTodayWidgetRef} onTodoToggled={handleWidgetTodoToggled} />

			<!-- 2. 今日热闹多人待办榜 (基于 topicHash 聚合) -->
			<TrendingTopicsWidget bind:this={trendingWidgetRef} onJoinTopic={handleJoinTopic} />
		</aside>
	</div>
</div>
