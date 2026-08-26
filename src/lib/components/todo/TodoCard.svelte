<script lang="ts">
	import { ALLOWED_STATUS_TRANSITIONS, getStatusConfig } from '$lib/constants/status';
	import { api } from '$lib/services/api';
	import { toast } from '$lib/stores/toast.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import type { Todo, TodoStatus } from '$lib/types/todo';
	import Avatar from '$lib/components/common/Avatar.svelte';
	import CategoryBadge from '$lib/components/common/CategoryBadge.svelte';
	import StatusBadge from '$lib/components/common/StatusBadge.svelte';
	import EditTodoModal from '$lib/components/todo/EditTodoModal.svelte';
	import ReactionBar from '$lib/components/todo/ReactionBar.svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		todo: Todo;
		onUpdated?: (todo: Todo) => void;
		onRequestEmail?: () => void;
		showAuthorLink?: boolean;
	}

	let { todo = $bindable(), onUpdated, onRequestEmail, showAuthorLink = true }: Props = $props();

	let isEditModalOpen = $state(false);
	let isChangingStatus = $state(false);
	let isNoteExpanded = $state(false);

	let isMyTodo = $derived(
		userStore.isAuthor(todo.authorId, todo.author?.email, todo.author?.handle)
	);

	let authorHandle = $derived(todo.author?.handle || 'user');
	let todoIdentifier = $derived(todo.shortId || todo.id);

	let allowedNextStatuses = $derived(
		ALLOWED_STATUS_TRANSITIONS[todo.status] || []
	);

	function formatDate(dateStr?: string | null): string {
		if (!dateStr) return '';
		return dateStr;
	}

	function formatTimeAgo(dateStr: string): string {
		const now = new Date();
		const date = new Date(dateStr);
		const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (diffSeconds < 60) return '刚刚';
		if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} 分钟前`;
		if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} 小时前`;
		if (diffSeconds < 86400 * 30) return `${Math.floor(diffSeconds / 86400)} 天前`;
		return date.toLocaleDateString();
	}

	async function quickChangeStatus(newStatus: TodoStatus) {
		const email = userStore.email;
		if (!email) {
			toast.error('未找到作者邮箱');
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
			if (onUpdated) onUpdated(todo);
		} catch (error: any) {
			toast.error(error.message || '状态切换失败');
		} finally {
			isChangingStatus = false;
		}
	}

	async function copyShareLink() {
		const url = `${window.location.origin}/@${authorHandle}/todo/${todoIdentifier}`;
		try {
			await navigator.clipboard.writeText(url);
			toast.success('已复制围观分享链接！');
		} catch {
			toast.error('复制失败，请手动复制浏览器地址');
		}
	}
</script>

<article
	class="group relative rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700"
>
	<!-- Top: Status, Category & Actions -->
	<div class="flex items-center justify-between gap-2 mb-3">
		<div class="flex flex-wrap items-center gap-1.5">
			<StatusBadge status={todo.status} size="sm" />
			{#if todo.category}
				<CategoryBadge category={todo.category} size="sm" />
			{/if}
		</div>

		<div class="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
			{#if isMyTodo}
				<!-- Quick transition buttons -->
				{#if todo.status === 'pending'}
					<button
						type="button"
						disabled={isChangingStatus}
						onclick={() => quickChangeStatus('in_progress')}
						class="px-2 py-0.5 text-xs rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 font-medium transition-colors"
						title="开始进行"
					>
						开始
					</button>
					<button
						type="button"
						disabled={isChangingStatus}
						onclick={() => quickChangeStatus('done')}
						class="px-2 py-0.5 text-xs rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 font-medium transition-colors"
						title="直接标记完成"
					>
						完成
					</button>
				{:else if todo.status === 'in_progress'}
					<button
						type="button"
						disabled={isChangingStatus}
						onclick={() => quickChangeStatus('done')}
						class="px-2 py-0.5 text-xs rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 font-medium transition-colors"
						title="标记完成"
					>
						完成
					</button>
				{/if}

				<!-- Edit button -->
				<button
					type="button"
					onclick={() => (isEditModalOpen = true)}
					class="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
					title="编辑 Todo"
				>
					<Icon icon="lucide:edit-3" class="w-3.5 h-3.5" />
				</button>
			{/if}

			<!-- Share Link Button -->
			<button
				type="button"
				onclick={copyShareLink}
				class="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
				title="复制分享链接"
			>
				<Icon icon="lucide:share-2" class="w-3.5 h-3.5" />
			</button>
		</div>
	</div>

	<!-- Main Content Link -->
	<div class="mb-3">
		<a
			href="/@{authorHandle}/todo/{todoIdentifier}"
			class="block group/title text-base font-semibold text-zinc-900 dark:text-zinc-50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-snug break-words"
		>
			<span class="{todo.status === 'done' ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}">
				{todo.content}
			</span>
		</a>
	</div>

	<!-- Note Section (If any) -->
	{#if todo.note}
		<div class="mb-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 p-3 border border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
			<div class="flex items-start gap-1.5">
				<Icon icon="lucide:file-text" class="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-400" />
				<div class="min-w-0 flex-1">
					<p class="{!isNoteExpanded && todo.note.length > 120 ? 'line-clamp-2' : ''} break-words whitespace-pre-wrap">
						{todo.note}
					</p>
					{#if todo.note.length > 120}
						<button
							type="button"
							class="text-blue-600 dark:text-blue-400 font-medium text-[11px] mt-1 hover:underline cursor-pointer"
							onclick={() => (isNoteExpanded = !isNoteExpanded)}
						>
							{isNoteExpanded ? '收起' : '展开全文'}
						</button>
					{/if}
				</div>
			</div>
		</div>
	{:else if !todo.isNotePublic && !isMyTodo}
		<!-- Note is private to author -->
		<div class="mb-3 flex items-center gap-1.5 text-[11px] text-zinc-400 italic">
			<Icon icon="lucide:lock" class="w-3 h-3" />
			<span>作者已将详细备注设为私密</span>
		</div>
	{/if}

	<!-- Metadata Info: Dates -->
	{#if todo.startDate || todo.dueDate}
		<div class="flex flex-wrap items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500 mb-3 font-mono">
			{#if todo.startDate}
				<div class="inline-flex items-center gap-1">
					<Icon icon="lucide:calendar" class="w-3 h-3" />
					<span>起: {formatDate(todo.startDate)}</span>
				</div>
			{/if}
			{#if todo.dueDate}
				<div class="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
					<Icon icon="lucide:calendar-clock" class="w-3 h-3" />
					<span>止: {formatDate(todo.dueDate)}</span>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Footer: Author & Reactions -->
	<div class="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
		<!-- Author -->
		<div class="flex items-center gap-2">
			{#if showAuthorLink}
				<a
					href="/@{authorHandle}"
					class="group/author inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
				>
					<Avatar
						avatar={todo.author?.avatar}
						seed={todo.author?.nickname || 'author'}
						size="sm"
					/>
					<div class="flex flex-col">
						<span class="text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover/author:text-blue-600 transition-colors">
							{todo.author?.nickname || '匿名创作者'}
						</span>
						<span class="text-[10px] text-zinc-400 font-mono">
							@{authorHandle} · {formatTimeAgo(todo.createdAt)}
						</span>
					</div>
				</a>
			{:else}
				<div class="inline-flex items-center gap-2">
					<Avatar
						avatar={todo.author?.avatar}
						seed={todo.author?.nickname || 'author'}
						size="sm"
					/>
					<div class="flex flex-col">
						<span class="text-xs font-medium text-zinc-800 dark:text-zinc-200">
							{todo.author?.nickname || '匿名创作者'}
						</span>
						<span class="text-[10px] text-zinc-400">
							{formatTimeAgo(todo.createdAt)}
						</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- Reaction Bar -->
		<ReactionBar
			todoId={todo.id}
			initialReactions={todo.reactions}
			{onRequestEmail}
		/>
	</div>
</article>

<!-- Edit Modal -->
<EditTodoModal
	isOpen={isEditModalOpen}
	{todo}
	onClose={() => (isEditModalOpen = false)}
	onUpdated={(newTodo) => {
		todo = newTodo;
		if (onUpdated) onUpdated(newTodo);
	}}
/>
