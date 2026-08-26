<script lang="ts">
	import { page } from '$app/state';
	import { ALLOWED_STATUS_TRANSITIONS, getStatusConfig } from '$lib/constants/status';
	import { api } from '$lib/services/api';
	import { toast } from '$lib/stores/toast.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import type { ReactionDetail, Todo, TodoStatus } from '$lib/types/todo';
	import Avatar from '$lib/components/common/Avatar.svelte';
	import CategoryBadge from '$lib/components/common/CategoryBadge.svelte';
	import StatusBadge from '$lib/components/common/StatusBadge.svelte';
	import EditTodoModal from '$lib/components/todo/EditTodoModal.svelte';
	import ReactionBar from '$lib/components/todo/ReactionBar.svelte';
	import Icon from '@iconify/svelte';

	let userId = $derived(page.params.userId);
	let todoId = $derived(page.params.todoId);

	let todo = $state<Todo | null>(null);
	let reactionDetails = $state<ReactionDetail[]>([]);
	let isLoading = $state(true);
	let isEditModalOpen = $state(false);
	let isChangingStatus = $state(false);

	let isAuthor = $derived(
		todo ? userStore.isAuthor(todo.authorId, todo.author?.email) : false
	);

	$effect(() => {
		if (todoId) {
			loadTodoDetail();
		}
	});

	async function loadTodoDetail() {
		if (!todoId) return;
		isLoading = true;
		try {
			const [todoRes, reactionsRes] = await Promise.all([
				api.getTodoById(todoId),
				api.getReactions(todoId).catch(() => ({ reactions: [] }))
			]);
			todo = todoRes.todo;
			reactionDetails = reactionsRes.reactions;
		} catch (error: any) {
			toast.error('未找到该 Todo 或加载失败');
		} finally {
			isLoading = false;
		}
	}

	async function quickChangeStatus(newStatus: TodoStatus) {
		if (!todo) return;
		const email = userStore.email;
		if (!email) {
			toast.error('请先设置邮箱');
			return;
		}

		isChangingStatus = true;
		try {
			const res = await api.updateTodo(todo.id, {
				email,
				status: newStatus
			});
			todo = {
				...todo,
				status: res.todo.status,
				updatedAt: res.todo.updatedAt
			};
			toast.success(`状态已更新为「${getStatusConfig(newStatus).label}」`);
		} catch (error: any) {
			toast.error(error.message || '切换状态失败');
		} finally {
			isChangingStatus = false;
		}
	}

	async function copyShareLink() {
		try {
			await navigator.clipboard.writeText(window.location.href);
			toast.success('已复制围观链接！');
		} catch {
			toast.error('复制失败，请手动复制');
		}
	}
</script>

<svelte:head>
	<title>{todo ? `${todo.content} — 公开 Todo 围观` : 'Todo 详情'} — Public Todo</title>
</svelte:head>

<div class="space-y-6">
	<!-- Navigation back -->
	<div class="flex items-center justify-between">
		<a
			href="/{userId}"
			class="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
		>
			<Icon icon="lucide:arrow-left" class="w-3.5 h-3.5" />
			<span>查看作者所有目标</span>
		</a>

		<button
			type="button"
			onclick={copyShareLink}
			class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
		>
			<Icon icon="lucide:share-2" class="w-3.5 h-3.5" />
			<span>分享给好友围观</span>
		</button>
	</div>

	{#if isLoading}
		<div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 space-y-4 animate-pulse">
			<div class="flex gap-2">
				<div class="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
				<div class="h-6 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
			</div>
			<div class="h-8 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
			<div class="h-16 w-full bg-zinc-100 dark:bg-zinc-800/60 rounded-xl"></div>
		</div>
	{:else if todo}
		<article
			class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6"
		>
			<!-- Status & Category & Action Toolbar -->
			<div class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
				<div class="flex items-center gap-2">
					<StatusBadge status={todo.status} size="md" />
					{#if todo.category}
						<CategoryBadge category={todo.category} size="md" />
					{/if}
				</div>

				{#if isAuthor}
					<div class="flex items-center gap-2">
						{#if todo.status === 'pending'}
							<button
								type="button"
								disabled={isChangingStatus}
								onclick={() => quickChangeStatus('in_progress')}
								class="px-3 py-1 text-xs rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 font-medium transition-colors"
							>
								开始推进
							</button>
							<button
								type="button"
								disabled={isChangingStatus}
								onclick={() => quickChangeStatus('done')}
								class="px-3 py-1 text-xs rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 font-medium transition-colors"
							>
								标记完成
							</button>
						{:else if todo.status === 'in_progress'}
							<button
								type="button"
								disabled={isChangingStatus}
								onclick={() => quickChangeStatus('done')}
								class="px-3 py-1 text-xs rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 font-medium transition-colors"
							>
								标记完成
							</button>
						{/if}

						<button
							type="button"
							onclick={() => (isEditModalOpen = true)}
							class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
						>
							<Icon icon="lucide:edit-3" class="w-3.5 h-3.5" />
							<span>编辑</span>
						</button>
					</div>
				{/if}
			</div>

			<!-- Main Todo Content -->
			<div>
				<h1
					class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 leading-relaxed {todo.status ===
					'done'
						? 'line-through text-zinc-400 dark:text-zinc-500'
						: ''}"
				>
					{todo.content}
				</h1>
			</div>

			<!-- Full Note Content -->
			{#if todo.note}
				<div class="rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 p-4 border border-zinc-100 dark:border-zinc-800 space-y-2">
					<div class="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
						<Icon icon="lucide:file-text" class="w-4 h-4 text-zinc-400" />
						<span>详细规划与说明</span>
					</div>
					<p class="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
						{todo.note}
					</p>
				</div>
			{:else if !todo.isNotePublic && !isAuthor}
				<div class="p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-800/30 text-xs text-zinc-400 italic flex items-center gap-2">
					<Icon icon="lucide:lock" class="w-3.5 h-3.5" />
					<span>作者已将该 Todo 的详细备注设置为私密保护</span>
				</div>
			{/if}

			<!-- Dates & Timeline -->
			<div class="flex flex-wrap items-center gap-4 text-xs text-zinc-500 font-mono pt-2">
				{#if todo.startDate}
					<div class="inline-flex items-center gap-1.5">
						<Icon icon="lucide:calendar" class="w-3.5 h-3.5 text-zinc-400" />
						<span>计划开始: {todo.startDate}</span>
					</div>
				{/if}
				{#if todo.dueDate}
					<div class="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
						<Icon icon="lucide:calendar-clock" class="w-3.5 h-3.5" />
						<span>计划截止: {todo.dueDate}</span>
					</div>
				{/if}
				<div class="inline-flex items-center gap-1.5 text-zinc-400">
					<Icon icon="lucide:clock" class="w-3.5 h-3.5" />
					<span>立项于: {new Date(todo.createdAt).toLocaleString()}</span>
				</div>
			</div>

			<!-- Author Card -->
			<div class="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
				<a
					href="/{todo.authorId}"
					class="flex items-center gap-3 group hover:opacity-80 transition-opacity"
				>
					<Avatar avatar={todo.author?.avatar} seed={todo.author?.nickname} size="md" />
					<div>
						<p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">
							{todo.author?.nickname || '匿名创作者'}
						</p>
						<p class="text-xs text-zinc-400">点击进入作者主页 ➔</p>
					</div>
				</a>

				<!-- Reaction Bar -->
				<ReactionBar
					todoId={todo.id}
					initialReactions={todo.reactions}
				/>
			</div>

			<!-- Reactions Supporters List Section -->
			{#if reactionDetails.length > 0}
				<div class="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
					<h3 class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
						围观见证人 ({reactionDetails.reduce((s, r) => s + r.count, 0)} 次互动)
					</h3>
					<div class="space-y-3">
						{#each reactionDetails as r}
							<div class="flex items-center gap-2.5">
								<span class="text-lg">{r.emoji}</span>
								<div class="flex flex-wrap gap-1.5">
									{#each r.users as u}
										<span
											class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300"
										>
											<Avatar avatar={u.avatar} seed={u.nickname} size="xs" />
											<span>{u.nickname}</span>
										</span>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</article>
	{:else}
		<div class="rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center space-y-3">
			<Icon icon="lucide:alert-circle" class="w-8 h-8 text-zinc-400 mx-auto" />
			<h3 class="text-sm font-medium text-zinc-800 dark:text-zinc-200">目标未找到</h3>
			<p class="text-xs text-zinc-500">该 Todo 可能已被删除或不存在</p>
			<a
				href="/"
				class="inline-block px-4 py-1.5 text-xs font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg"
			>
				返回广场
			</a>
		</div>
	{/if}
</div>

{#if todo}
	<EditTodoModal
		isOpen={isEditModalOpen}
		{todo}
		onClose={() => (isEditModalOpen = false)}
		onUpdated={(newTodo) => {
			todo = newTodo;
		}}
	/>
{/if}
