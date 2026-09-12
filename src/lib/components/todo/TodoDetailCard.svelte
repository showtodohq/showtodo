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
	import TodoReactionsBar from '$lib/components/todo/TodoReactionsBar.svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		todo: Todo;
		isMine: boolean;
		topicParticipantCount?: number;
		hasJoined?: boolean;
		myJoinedStatus?: TodoStatus;
		isJoining?: boolean;
		onstatuschange?: (nextStatus: TodoStatus, e?: MouseEvent) => void;
		onreaction?: (emoji?: ReactionEmoji) => void;
		onsaveedit?: (content: string, note?: string | null) => Promise<void>;
		onjoin?: () => Promise<void> | void;
		onmystatuschange?: (nextStatus: TodoStatus, e?: MouseEvent) => void;
	}

	let {
		todo,
		isMine,
		topicParticipantCount = 0,
		hasJoined = false,
		myJoinedStatus,
		isJoining = false,
		onstatuschange,
		onreaction,
		onsaveedit,
		onjoin,
		onmystatuschange
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
				name={todo.author?.nickname}
				alt={todo.author?.nickname}
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
				<span class="flex items-center gap-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
					<Icon icon="lucide:calendar" class="h-3.5 w-3.5 text-zinc-400 shrink-0" />
					<span>{scheduleText}</span>
				</span>
			{/if}
		</div>

		<button
			type="button"
			onclick={copyLink}
			class="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:underline cursor-pointer"
		>
			<Icon icon="lucide:link-2" class="h-3.5 w-3.5 text-zinc-400 shrink-0" />
			<span>{todo.shortId || todo.id.slice(0, 8)}</span>
		</button>
	</div>

	<!-- 底部互动区：平铺表情胶囊与右侧操作栏（表态入口 + 图标化编辑） -->
	<div class="pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
		<TodoReactionsBar
			todoId={todo.id}
			reactions={todo.reactions}
			myReactions={todo.myReactions}
			{isMine}
			onreact={onreaction}
			onedit={isMine && !isEditing ? () => (isEditing = true) : undefined}
		/>
	</div>

	<!-- 多人同行互动区域 -->
	{#if todo.topicHash}
		<div
			class="p-4 rounded-2xl border transition-all space-y-3 {hasJoined
				? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/50'
				: topicParticipantCount > 1
					? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/50'
					: 'bg-zinc-50/80 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800'}"
		>
			<div class="flex items-center justify-between flex-wrap gap-3">
				<!-- 左侧：同行信息与榜单入口 -->
				<div class="flex items-center gap-2.5 text-xs flex-wrap">
					{#if hasJoined}
						<span class="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-200">
							<Icon icon="lucide:check" class="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
							<span>你正在并肩同行该目标</span>
						</span>
						{#if topicParticipantCount > 1}
							<span class="text-emerald-600/80 dark:text-emerald-400/80">
								(全网共 <strong>{topicParticipantCount}</strong> 人同行)
							</span>
						{/if}
					{:else if isMine}
						<div class="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
							{#if topicParticipantCount > 1}
								<Icon icon="lucide:flame" class="h-4 w-4 text-orange-500 shrink-0" />
							{:else}
								<Icon icon="lucide:sprout" class="h-4 w-4 text-emerald-500 shrink-0" />
							{/if}
							<span>
								{#if topicParticipantCount > 1}
									全网共 <strong>{topicParticipantCount}</strong> 人正在与你并肩同行该目标！
								{:else}
									尚未有其他伙伴同行该目标，期待有人与你并肩！
								{/if}
							</span>
						</div>
					{:else}
						<!-- 访客未加入 -->
						<div class="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
							{#if topicParticipantCount > 1}
								<Icon icon="lucide:flame" class="h-4 w-4 text-orange-500 shrink-0" />
							{:else}
								<Icon icon="lucide:sprout" class="h-4 w-4 text-emerald-500 shrink-0" />
							{/if}
							<span>
								{#if topicParticipantCount > 1}
									已有 <strong>{topicParticipantCount}</strong> 位伙伴正在并肩同行该目标！
								{:else}
									暂无其他同路人，想和 TA 一起坚持这个目标吗？
								{/if}
							</span>
						</div>
					{/if}

					<!-- 查看同行榜链接 (当有超过1人或已加入时显示) -->
					{#if topicParticipantCount > 1 || hasJoined}
						<a
							href="/topics/{todo.topicHash}"
							class="font-semibold text-xs transition-colors hover:underline shrink-0 {hasJoined
								? 'text-emerald-700 dark:text-emerald-300'
								: 'text-amber-700 dark:text-amber-300'}"
						>
							查看同行榜 →
						</a>
					{/if}
				</div>

				<!-- 右侧：行动按钮 / 打卡控制器 -->
				<div class="flex items-center gap-3">
					{#if hasJoined && myJoinedStatus}
						<div class="flex items-center gap-2 bg-white/80 dark:bg-zinc-900/80 py-1 px-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 shadow-2xs">
							<span class="text-xs text-zinc-500 dark:text-zinc-400">我的打卡：</span>
							<TodoCheckbox
								status={myJoinedStatus}
								isMine={true}
								size="sm"
								ontoggle={(next, e) => onmystatuschange?.(next, e)}
							/>
						</div>
					{:else if !isMine}
						<Button
							variant="primary"
							size="xs"
							loading={isJoining}
							onclick={onjoin}
							class="font-medium px-3 py-1.5 shadow-xs"
						>
							+ 一起做
						</Button>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
