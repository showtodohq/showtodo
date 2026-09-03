<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { api } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import { todoStore } from '$lib/stores/todo.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { confetti } from '$lib/utils/confetti';
	import { getStatusConfig } from '$lib/constants/status';
	import type { Todo, TodoStatus, ReactionEmoji } from '$lib/types/todo';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TodoDetailCard from '$lib/components/todo/TodoDetailCard.svelte';
	import TodoCheckInForm from '$lib/components/todo/TodoCheckInForm.svelte';
	import TodoActivityTimeline from '$lib/components/todo/TodoActivityTimeline.svelte';

	let loading = $state(true);
	let error = $state<string | null>(null);
	let todo = $state<Todo | null>(null);
	let topicParticipantCount = $state<number>(0);
	let isSubmittingCheckIn = $state(false);

	const isMine = $derived(
		Boolean(
			todo &&
				((userStore.id && todo.authorId === userStore.id) ||
					(userStore.handle && todo.author?.handle === userStore.handle) ||
					(userStore.email && todo.author?.email === userStore.email))
		)
	);

	async function loadTodo(identifier: string) {
		error = null;

		// 1. 0ms 瞬时预渲染：优先尝试从本地 Store 命中已有数据秒开展示
		const cachedTodo = todoStore.getTodo(identifier);
		if (cachedTodo) {
			todo = { ...cachedTodo };
			loading = false;
		} else {
			loading = true;
		}

		try {
			// 2. 后台静默拉取最新全量数据（补全 activities 时间线、最新点赞状态等）
			const res = await api.getTodoById(identifier);
			todo = res.todo;
			todoStore.cacheTodo(res.todo);

			if (todo.topicHash) {
				try {
					const info = await api.getTopicInfo(todo.id);
					topicParticipantCount = info.participantCount || 0;
				} catch {
					// ignore topic info failure
				}
			}
		} catch (err) {
			console.error('Failed to load todo:', err);
			if (!todo) {
				error = (err as Error).message || '待办不存在或已被删除';
			}
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const paramId = page.params.id;
		if (paramId) {
			loadTodo(paramId);
		}
	});

	// 确保当前用户的今日待办数据已预加载，以便准确判定“今日已全部完成”
	$effect(() => {
		if (userStore.id && todoStore.todayTodos.length === 0 && !todoStore.todayLoading) {
			todoStore.loadTodayTodos();
		}
	});

	async function handleStatusChange(nextStatus: TodoStatus, e?: MouseEvent) {
		if (!todo || !userStore.email) {
			toast.info('请先绑定邮箱');
			return;
		}

		await todoStore.toggleStatus(todo.id, nextStatus, e, todo);

		// 异步拉取更新后的动态时间线
		try {
			const updated = await api.getTodoById(todo.id);
			todo.activities = updated.todo.activities;
		} catch {
			// ignore activity sync error
		}
	}

	async function handleCheckIn({ status, note }: { status: TodoStatus; note: string }) {
		if (!todo || !userStore.email) return;

		isSubmittingCheckIn = true;
		try {
			const statusChanged = status !== todo.status;
			if (statusChanged) {
				await todoStore.toggleStatus(todo.id, status, undefined, todo, {
					activityNote: note
				});
			} else {
				await api.updateTodo(todo.id, {
					email: userStore.email,
					activityNote: note
				});
				toast.success('已记下进展');
			}

			const updated = await api.getTodoById(todo.id);
			todo.activities = updated.todo.activities;
		} catch (err) {
			toast.error(`提交失败: ${(err as Error).message}`);
		} finally {
			isSubmittingCheckIn = false;
		}
	}

	async function handleSaveEdit(content: string, note?: string | null) {
		if (!todo || !userStore.email) return;

		await api.updateTodo(todo.id, {
			email: userStore.email,
			content,
			note
		});

		const updated = await api.getTodoById(todo.id);
		todo = updated.todo;
		toast.success('待办已更新');
	}

	function handleReaction(emoji?: ReactionEmoji) {
		if (!todo) return;
		todoStore.toggleReaction(todo.id, emoji, todo);
	}
</script>

<svelte:head>
	<title>{todo ? `${todo.content} - Todo 详情` : '待办详情 - Public Todo'}</title>
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
			<span class="text-xs">加载待办详情...</span>
		</div>
	{:else if error || !todo}
		<div
			class="p-8 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3"
		>
			<div class="text-2xl">🔍</div>
			<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
				{error || '待办不存在'}
			</div>
			<p class="text-xs text-zinc-500 max-w-sm mx-auto">
				该待办可能已被删除或链接无效，请返回公共广场查看其他公开待办。
			</p>
			<Button variant="outline" size="sm" onclick={() => goto('/')}>
				返回公共待办广场
			</Button>
		</div>
	{:else}
		<!-- 待办核心详情卡片 -->
		<TodoDetailCard
			{todo}
			{isMine}
			{topicParticipantCount}
			onstatuschange={handleStatusChange}
			onreaction={handleReaction}
			onsaveedit={handleSaveEdit}
		/>

		<!-- 若是作者本人，显示进展打卡模块 -->
		{#if isMine}
			<TodoCheckInForm
				currentStatus={todo.status}
				isSubmitting={isSubmittingCheckIn}
				onsubmit={handleCheckIn}
			/>
		{/if}

		<!-- 生命周期动态时间线 -->
		<TodoActivityTimeline activities={todo.activities} />
	{/if}
</div>
