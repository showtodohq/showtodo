<script lang="ts">
	import type { Todo, TodoStatus, ReactionEmoji } from '$lib/types/todo';
	import { getStatusConfig } from '$lib/constants/status';
	import { getCategoryConfig } from '$lib/constants/categories';
	import { formatRelativeTime, formatScheduleRange } from '$lib/utils/format';
	import { toast } from '$lib/stores/toast.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import CategoryBadge from '$lib/components/todo/CategoryBadge.svelte';
	import TodoCheckbox from '$lib/components/todo/TodoCheckbox.svelte';
	import ReactionButton from '$lib/components/todo/ReactionButton.svelte';

	interface Props {
		todo: Todo;
		isMine: boolean;
		topicParticipantCount?: number;
		onstatuschange?: (nextStatus: TodoStatus, e?: MouseEvent) => void;
		onreaction?: (emoji?: ReactionEmoji) => void;
		onsaveedit?: (content: string, note?: string | null) => Promise<void>;
	}

	let {
		todo,
		isMine,
		topicParticipantCount = 0,
		onstatuschange,
		onreaction,
		onsaveedit
	}: Props = $props();

	let isEditing = $state(false);
	let editContent = $state('');
	let editNote = $state('');
	let isSaving = $state(false);

	$effect(() => {
		editContent = todo.content;
		editNote = todo.note || '';
	});

	const currentStatusCfg = $derived(getStatusConfig(todo.status));
	const scheduleText = $derived(formatScheduleRange(todo.startDate, todo.dueDate));

	async function handleSave(e: SubmitEvent) {
		e.preventDefault();
		if (!editContent.trim()) return;

		isSaving = true;
		try {
			await onsaveedit?.(editContent.trim(), editNote.trim() || null);
			isEditing = false;
		} finally {
			isSaving = false;
		}
	}

	async function copyLink() {
		const url = window.location.href;
		try {
			await navigator.clipboard.writeText(url);
			toast.success('已复制待办链接');
		} catch {
			toast.info(`链接: ${url}`);
		}
	}
</script>

<div
	class="p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-xs space-y-6"
>
	<!-- 顶部：作者信息与状态机打勾 -->
	<div class="flex items-start justify-between gap-4">
		<a
			href="/users/{todo.author?.handle || todo.authorId}"
			class="flex items-center gap-3 group/author"
		>
			<Avatar
				src={todo.author?.avatar}
				alt={todo.author?.nickname || 'author'}
				size="md"
			/>
			<div>
				<div class="flex items-center gap-1.5">
					<span
						class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover/author:text-blue-600 transition-colors"
					>
						{todo.author?.nickname || '未知用户'}
					</span>
					{#if isMine}
						<span
							class="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium"
						>
							本人
						</span>
					{/if}
				</div>
				<div class="text-[11px] text-zinc-400 font-mono">
					@{todo.author?.handle || 'user'} · {formatRelativeTime(todo.createdAt)}
				</div>
			</div>
		</a>

		<!-- 右侧状态徽章与交互复选框 -->
		<div class="flex items-center gap-2">
			<span
				class="px-2.5 py-1 rounded-full text-xs font-medium {currentStatusCfg.bgClass} {currentStatusCfg.textClass} border {currentStatusCfg.borderClass}"
			>
				{currentStatusCfg.label}
			</span>

			<TodoCheckbox
				status={todo.status}
				{isMine}
				size="md"
				ontoggle={(next, e) => onstatuschange?.(next, e)}
			/>
		</div>
	</div>

	<!-- 待办正文与行内编辑 -->
	{#if isEditing}
		<form onsubmit={handleSave} class="space-y-3 pt-2">
			<div class="space-y-1">
				<label
					for="edit-content"
					class="text-xs font-medium text-zinc-600 dark:text-zinc-400"
				>
					待办内容
				</label>
				<textarea
					id="edit-content"
					bind:value={editContent}
					rows="2"
					required
					class="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
				></textarea>
			</div>

			<div class="space-y-1">
				<label
					for="edit-note"
					class="text-xs font-medium text-zinc-600 dark:text-zinc-400"
				>
					公开备注 (选填)
				</label>
				<textarea
					id="edit-note"
					bind:value={editNote}
					rows="2"
					placeholder="添加一些背景或补充说明..."
					class="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
				></textarea>
			</div>

			<div class="flex justify-end gap-2">
				<Button
					type="button"
					variant="ghost"
					size="xs"
					onclick={() => (isEditing = false)}
				>
					取消
				</Button>
				<Button type="submit" variant="primary" size="xs" loading={isSaving}>
					保存
				</Button>
			</div>
		</form>
	{:else}
		<div class="space-y-3">
			<h1
				class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-snug break-words {todo.status ===
				'done'
					? 'line-through text-zinc-400 dark:text-zinc-500'
					: ''}"
			>
				{todo.content}
			</h1>

			{#if todo.note}
				<div
					class="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed break-words"
				>
					{todo.note}
				</div>
			{/if}
		</div>
	{/if}

	<!-- 元数据栏：分类、时间范围、链接复制 -->
	<div
		class="flex items-center justify-between flex-wrap gap-3 pt-2 text-xs text-zinc-500 dark:text-zinc-400"
	>
		<div class="flex items-center gap-2.5 flex-wrap">
			{#if todo.category}
				<CategoryBadge category={todo.category} />
			{/if}

			{#if scheduleText}
				<span class="flex items-center gap-1 font-mono text-[11px]">
					<span>🗓️</span>
					<span>{scheduleText}</span>
				</span>
			{/if}
		</div>

		<button
			type="button"
			onclick={copyLink}
			class="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:underline cursor-pointer"
		>
			<span>🔗</span>
			<span>{todo.shortId || todo.id.slice(0, 8)}</span>
		</button>
	</div>

	<!-- 底部互动区：Reaction 与编辑入口 -->
	<div
		class="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between gap-3"
	>
		<ReactionButton
			reactions={todo.reactions}
			myReactions={todo.myReactions}
			onreact={onreaction}
		/>

		{#if isMine && !isEditing}
			<button
				type="button"
				onclick={() => (isEditing = true)}
				class="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
			>
				编辑正文
			</button>
		{/if}
	</div>

	<!-- 多人同行提示条 -->
	{#if todo.topicHash && topicParticipantCount > 1}
		<div
			class="flex items-center justify-between p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200"
		>
			<div class="flex items-center gap-2">
				<span class="text-base">🔥</span>
				<span>
					该待办属于多人同行目标，全网共 <strong>{topicParticipantCount}</strong> 人并肩挑战！
				</span>
			</div>
			<a
				href="/topics/{todo.topicHash}"
				class="font-semibold text-amber-700 dark:text-amber-300 hover:underline shrink-0 ml-2"
			>
				查看同行榜 →
			</a>
		</div>
	{/if}
</div>
