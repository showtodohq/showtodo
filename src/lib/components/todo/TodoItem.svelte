<script lang="ts">
	import type { Todo, ReactionEmoji } from '$lib/types/todo';
	import { formatRelativeTime, formatScheduleRange } from '$lib/utils/format';
	import UserAvatarTooltip from '$lib/components/user/UserAvatarTooltip.svelte';
	import ReactionButton from '$lib/components/todo/ReactionButton.svelte';
	import CategoryBadge from '$lib/components/todo/CategoryBadge.svelte';
	import TodoCheckbox from '$lib/components/todo/TodoCheckbox.svelte';

	interface Props {
		todo: Todo;
		isMine?: boolean;
		ontoggle?: (todo: Todo, e?: MouseEvent) => void;
		onreaction?: (todo: Todo, emoji?: ReactionEmoji) => void;
		class?: string;
	}

	let { todo, isMine = false, ontoggle, onreaction, class: className = '' }: Props = $props();

	const scheduleText = $derived(formatScheduleRange(todo.startDate, todo.dueDate));
	const relativeTime = $derived(formatRelativeTime(todo.createdAt));
	const isDone = $derived(todo.status === 'done');
</script>

<div
	class="group/item relative flex items-start gap-3 sm:gap-3.5 py-3 px-3 sm:px-3.5 rounded-2xl transition-all duration-150 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 {className}"
>
	<!-- 左侧：统一作者头像与悬停 Tooltip -->
	<div class="shrink-0 pt-0.5">
		<UserAvatarTooltip user={todo.author} size="sm" align="left" />
	</div>

	<!-- 中间主体：3~4 行层次流排版 -->
	<div class="flex-1 min-w-0 space-y-1">
		<!-- 第一行：作者昵称 (不带 handle) + 开始 - 截止时间 / 日期范围 -->
		<div class="flex items-center gap-1.5 min-w-0 text-xs">
			<span class="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px] sm:max-w-[200px]">
				{todo.author?.nickname || '匿名待办者'}
			</span>

			{#if scheduleText}
				<span class="text-zinc-300 dark:text-zinc-700 text-[10px]">·</span>
				<div class="flex items-center gap-1 text-[11px] font-mono text-zinc-400 dark:text-zinc-500 truncate">
					<svg class="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					<span>{scheduleText}</span>
				</div>
			{/if}
		</div>

		<!-- 第二行：正文标题 -->
		<p
			class="text-sm font-medium leading-snug break-words transition-colors duration-150 {isDone
				? 'line-through text-zinc-400 dark:text-zinc-500'
				: 'text-zinc-900 dark:text-zinc-100'}"
		>
			{todo.content}
		</p>

		<!-- 第三行：公开备注/执行细节 (如果有且公开) -->
		{#if todo.note && todo.isNotePublic}
			<div
				class="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100/70 dark:bg-zinc-800/50 rounded-xl px-2.5 py-1.5 leading-relaxed break-words mt-1 border border-zinc-200/50 dark:border-zinc-800/60"
			>
				{todo.note}
			</div>
		{/if}

		<!-- 第四行：分类徽标 · 发布相对时间 · 轻量表态互动 -->
		<div class="flex items-center flex-wrap gap-2 pt-1 text-xs text-zinc-400 select-none">
			<!-- 分类胶囊 (统一组件) -->
			{#if todo.category}
				<CategoryBadge category={todo.category} mode="pill" />
				<span>·</span>
			{/if}

			<!-- 发布相对时间 -->
			<span class="text-[11px] text-zinc-400 font-mono">{relativeTime}</span>

			<span>·</span>

			<!-- 独立的 ReactionButton 领域组件 -->
			<ReactionButton
				reactions={todo.reactions}
				myReactions={todo.myReactions}
				onreact={(emoji) => onreaction?.(todo, emoji)}
			/>
		</div>
	</div>

	<!-- 右侧：果冻打勾复选框 (统一 TodoCheckbox 领域组件) - 垂直居中对齐 -->
	<div class="shrink-0 self-center pl-1 sm:pl-2">
		<TodoCheckbox
			status={todo.status}
			{isMine}
			size="md"
			ontoggle={(e) => ontoggle?.(todo, e)}
		/>
	</div>
</div>
