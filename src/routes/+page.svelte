<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/services/api';
	import type { Todo, ReactionEmoji, TodoStatus, CategoryId } from '$lib/types/todo';
	import { userStore } from '$lib/stores/user.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { optimisticAction } from '$lib/utils/mutation';
	import { confetti } from '$lib/utils/confetti';
	import { CATEGORIES } from '$lib/constants/categories';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import TodoItem from '$lib/components/feed/TodoItem.svelte';
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
	// 快速发布框状态与交互
	// ---------------------------------------------------------------------------
	let newTodoContent = $state('');
	let newTodoNote = $state('');
	let isNoteOpen = $state(false);
	let selectedCategory = $state<CategoryId | null>(null);
	let isComposerFocused = $state(false);
	let submitting = $state(false);
	let composerContainerRef = $state<HTMLDivElement | null>(null);

	const isComposerExpanded = $derived(
		isComposerFocused || newTodoContent.trim().length > 0 || newTodoNote.trim().length > 0 || isNoteOpen
	);

	function handleClickOutside(e: MouseEvent) {
		if (composerContainerRef && !composerContainerRef.contains(e.target as Node)) {
			if (!newTodoContent.trim() && !newTodoNote.trim()) {
				isComposerFocused = false;
				isNoteOpen = false;
			}
		}
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (isComposerFocused) {
				if (!newTodoContent.trim() && !newTodoNote.trim()) {
					isComposerFocused = false;
					isNoteOpen = false;
				} else {
					isComposerFocused = false;
				}
			}
		}
	}

	async function handleCreateTodo() {
		const clean = newTodoContent.trim();
		if (!clean || submitting) return;

		if (!userStore.email) {
			toast.info('请先点击右上角头像设置您的发布邮箱');
			return;
		}

		submitting = true;
		const email = userStore.email;
		const category = selectedCategory;
		const content = clean;
		const note = newTodoNote.trim() || null;
		const tempId = `temp-${Date.now()}`;

		const tempTodo: Todo = {
			id: tempId,
			shortId: tempId,
			topicHash: `topic-${Date.now()}`,
			content,
			note,
			isNotePublic: true,
			category,
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
			reactions: { '❤️': 0, '👍': 0, '🔥': 0, '💪': 0, '👏': 0, '🚀': 0, '🎉': 0, '👀': 0 }
		};

		const prevTodos = [...todos];

		try {
			await optimisticAction({
				apply: () => {
					todos.unshift(tempTodo);
					newTodoContent = '';
					newTodoNote = '';
					isNoteOpen = false;
					selectedCategory = null;
					isComposerFocused = false;
				},
				rollback: () => {
					todos = prevTodos;
				},
				action: async () => {
					const res = await api.createTodo({
						email,
						content,
						note,
						category: category ?? undefined
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
			// handled by onError
		} finally {
			submitting = false;
		}
	}

	function handleComposerKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleCreateTodo();
		} else if (e.key === 'Escape') {
			isComposerFocused = false;
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
	// 轻量表态 Reaction (支持 0ms 乐观 Toggle 切换与撤销)
	// ---------------------------------------------------------------------------
	async function handleReaction(todo: Todo, emoji: ReactionEmoji) {
		if (!userStore.email) {
			toast.info('请先点击右上角头像绑定邮箱再表态');
			return;
		}

		if (!todo.reactions) {
			todo.reactions = { '❤️': 0, '👍': 0, '🔥': 0, '💪': 0, '👏': 0, '🚀': 0, '🎉': 0, '👀': 0 };
		}
		if (!todo.myReactions) {
			todo.myReactions = [];
		}

		const isLiked = todo.myReactions.includes(emoji);
		const prevCount = todo.reactions[emoji] || 0;
		const prevMyReactions = [...todo.myReactions];

		try {
			await optimisticAction({
				apply: () => {
					if (isLiked) {
						// 取消点赞
						todo.reactions![emoji] = Math.max(0, prevCount - 1);
						todo.myReactions = todo.myReactions!.filter((e) => e !== emoji);
					} else {
						// 新增点赞
						todo.reactions![emoji] = prevCount + 1;
						todo.myReactions = [...todo.myReactions!, emoji];
					}
				},
				rollback: () => {
					todo.reactions![emoji] = prevCount;
					todo.myReactions = prevMyReactions;
				},
				action: async () => {
					if (isLiked) {
						await api.removeReaction(todo.id, emoji, userStore.email!);
					} else {
						await api.addReaction(todo.id, emoji, userStore.email!);
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

		try {
			const res = await api.createTodo({
				email: userStore.email,
				content,
				category: category ?? undefined
			});

			todos.unshift(res.todo);
			toast.success(`已加入「${content}」！`);
			myTodayWidgetRef?.refresh();
			trendingWidgetRef?.loadTrending();
		} catch (e) {
			toast.error(`加入失败: ${(e as Error).message}`);
		}
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

<svelte:window onclick={handleClickOutside} onkeydown={handleGlobalKeydown} />

<div class="w-full space-y-6 sm:space-y-8">
	<!-- 顶部 Twitter / X 风格极简快速发布框 -->
	<div
		bind:this={composerContainerRef}
		class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 sm:p-3.5 transition-all duration-200 shadow-2xs focus-within:border-zinc-300 dark:focus-within:border-zinc-700"
	>
		<div class="flex gap-3">
			<!-- 左侧用户头像 -->
			<div class="shrink-0 pt-0.5">
				<Avatar
					src={userStore.avatar}
					name={userStore.nickname}
					size="sm"
					class="h-8 w-8 ring-1 ring-zinc-200/80 dark:ring-zinc-800"
				/>
			</div>

			<!-- 右侧主输入与操作区 -->
			<div class="flex-1 min-w-0 space-y-2">
				<!-- 主待办正文输入区 -->
				<textarea
					bind:value={newTodoContent}
					onkeydown={handleComposerKeydown}
					onfocus={() => (isComposerFocused = true)}
					placeholder={userStore.email ? "写下今天的一个目标... (Enter 发送)" : "写下今天的一个目标... (需先设置邮箱)"}
					rows={isComposerExpanded ? 2 : 1}
					class="w-full resize-none bg-transparent text-sm font-semibold placeholder:font-normal placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100 focus:outline-hidden leading-relaxed transition-all duration-150 py-0.5"
				></textarea>

				<!-- 详细备注输入区 -->
				{#if isNoteOpen || newTodoNote.trim()}
					<div class="animate-in fade-in duration-150 pt-0.5">
						<textarea
							bind:value={newTodoNote}
							placeholder="添加备注、链接或执行细节..."
							rows="2"
							class="w-full resize-none bg-transparent text-xs text-zinc-600 dark:text-zinc-400 placeholder:text-zinc-400/80 dark:placeholder:text-zinc-600 focus:outline-hidden leading-relaxed transition-all"
						></textarea>
					</div>
				{/if}

				<!-- 工具栏与发布按钮 -->
				{#if isComposerExpanded}
					<div class="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-900/80 gap-2 animate-in fade-in duration-150">
						<!-- 分类快捷标签组 -->
						<div class="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
							{#each CATEGORIES as cat}
								{@const isSelected = selectedCategory === cat.id}
								<button
									type="button"
									onclick={() => (selectedCategory = isSelected ? null : cat.id)}
									class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all duration-150 cursor-pointer {isSelected ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'}"
									title="选择分类: {cat.name}"
								>
									<span class="h-1.5 w-1.5 rounded-full shrink-0" style="background-color: {cat.color};"></span>
									{cat.name}
								</button>
							{/each}
						</div>

						<!-- 右侧操作组 -->
						<div class="flex items-center gap-1.5 shrink-0">
							<button
								type="button"
								onclick={() => (isNoteOpen = !isNoteOpen)}
								class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer {isNoteOpen || newTodoNote.trim() ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-900'}"
								title={isNoteOpen ? '收起备注' : '添加备注'}
							>
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
								</svg>
								<span class="text-[11px]">备注</span>
							</button>

							<button
								type="button"
								onclick={handleCreateTodo}
								disabled={!newTodoContent.trim() || submitting}
								class="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
							>
								{submitting ? '发布中...' : '发布'}
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- 下方主体：左侧最新待办 Feed + 右侧辅助 Widgets 左右双栏布局 -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
		<!-- 左侧主流：最新公开待办动态流 (占 8 栏) -->
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
				<div class="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800/80 py-20 text-center text-xs text-zinc-400">
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
								<span>加载更多历史待办</span>
							{/if}
						</button>
					</div>
				{:else if todos.length > 0}
					<div class="py-6 text-center text-[11px] text-zinc-300 dark:text-zinc-700 select-none">
						· 已呈现全网最新动态 ·
					</div>
				{/if}
			{/if}
		</div>

		<!-- 右侧边栏：我的今日待办 (仅绑定邮箱显示) + 热门多人 Todo (占 4~5 栏) -->
		<div class="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-20">
			<!-- 模块 1：我的今日待办 (未绑定邮箱自动隐藏) -->
			<MyTodayWidget
				bind:this={myTodayWidgetRef}
				onTodoToggled={handleWidgetTodoToggled}
			/>

			<!-- 模块 2：热门多人 Todo (基于 topic_hash 聚合) -->
			<TrendingTopicsWidget
				bind:this={trendingWidgetRef}
				onJoinTopic={handleJoinTopic}
			/>
		</div>
	</div>
</div>
