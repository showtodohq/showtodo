<script lang="ts">
	import type { Todo, TodoStatus, ReactionEmoji } from '$lib/types/todo';
	import { formatRelativeTime, formatScheduleRange } from '$lib/utils/format';
	import UserAvatarTooltip from '$lib/components/user/UserAvatarTooltip.svelte';
	import ReactionButton from '$lib/components/todo/ReactionButton.svelte';
	import CategoryBadge from '$lib/components/todo/CategoryBadge.svelte';
	import TodoCheckbox from '$lib/components/todo/TodoCheckbox.svelte';
	import TodoContent from '$lib/components/todo/TodoContent.svelte';
	import { userStore } from '$lib/stores/user.svelte';

	interface Props {
		todo: Todo;
		isMine?: boolean;
		ontoggle?: (todo: Todo, nextStatus: TodoStatus, e?: MouseEvent) => void;
		onreaction?: (todo: Todo, emoji?: ReactionEmoji) => void;
		oncategoryclick?: (categoryId: string) => void;
		class?: string;
	}

	let {
		todo,
		isMine = false,
		ontoggle,
		onreaction,
		oncategoryclick,
		class: className = ''
	}: Props = $props();

	const effectiveAuthor = $derived(
		todo.author || (isMine && userStore.email ? {
			id: userStore.id || todo.authorId,
			nickname: userStore.nickname,
			handle: userStore.handle,
			avatar: userStore.avatar
		} : undefined)
	);

	const scheduleText = $derived(formatScheduleRange(todo.startDate, todo.dueDate));
	const relativeTime = $derived(formatRelativeTime(todo.createdAt));
	const authorProfileUrl = $derived(
		effectiveAuthor?.handle
			? `/users/${effectiveAuthor.handle}`
			: effectiveAuthor?.id
				? `/users/${effectiveAuthor.id}`
				: null
	);
	const todoDetailUrl = $derived(`/todos/${todo.shortId || todo.id}`);
</script>

<div
	class="group/item relative flex items-start gap-3 sm:gap-3.5 py-3 px-3 sm:px-3.5 rounded-2xl transition-all duration-150 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 {className}"
>
	<!-- 左侧：统一作者头像与悬停 Tooltip -->
	<div class="shrink-0 pt-0.5">
		<UserAvatarTooltip user={effectiveAuthor} size="sm" align="left" isMe={isMine} />
	</div>

	<!-- 中间主体：3~4 行层次流排版 -->
	<div class="flex-1 min-w-0 space-y-1">
		<!-- 第一行：作者昵称 (不带 handle) + 开始 - 截止时间 / 日期范围 -->
		<div class="flex items-center gap-1.5 min-w-0 text-xs">
			{#if authorProfileUrl}
				<a
					href={authorProfileUrl}
					class="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-300 hover:underline truncate max-w-[140px] sm:max-w-[200px]"
					onclick={(e) => e.stopPropagation()}
				>
					{effectiveAuthor?.nickname || '匿名待办者'}
				</a>
			{:else}
				<span class="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px] sm:max-w-[200px]">
					{effectiveAuthor?.nickname || '匿名待办者'}
				</span>
			{/if}

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

		<!-- 第二行：正文标题 (统一 TodoContent 组件，15px 黄金字号，点击直达详情) -->
		<a href={todoDetailUrl} class="block group/title focus:outline-hidden">
			<TodoContent
				content={todo.content}
				status={todo.status}
				size="sm"
				class="group-hover/title:text-zinc-600 dark:group-hover/title:text-zinc-300 transition-colors cursor-pointer"
			/>
		</a>

		<!-- 第三行：公开备注/执行细节 (如果有且公开，点击直达详情) -->
		{#if todo.note && todo.isNotePublic}
			<a
				href={todoDetailUrl}
				class="block text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100/70 dark:bg-zinc-800/50 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80 rounded-xl px-2.5 py-1.5 leading-relaxed break-words mt-1 border border-zinc-200/50 dark:border-zinc-800/60 transition-colors cursor-pointer"
			>
				{todo.note}
			</a>
		{/if}

		<!-- 第四行：分类徽标 · 发布相对时间 · 轻量表态互动 -->
		<div class="flex items-center flex-wrap gap-2 pt-1 text-xs text-zinc-400 select-none">
			<!-- 分类胶囊 (统一组件，支持点击筛选) -->
			{#if todo.category}
				<CategoryBadge
					category={todo.category}
					mode="pill"
					onclick={(cat) => oncategoryclick?.(cat)}
				/>
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

	<!-- 右侧：4 态果冻复选控制器 (统一 TodoCheckbox 领域组件) - 垂直居中对齐 -->
	<div class="shrink-0 self-center pl-1 sm:pl-2">
		<TodoCheckbox
			status={todo.status}
			{isMine}
			size="md"
			ontoggle={(nextStatus, e) => ontoggle?.(todo, nextStatus, e)}
		/>
	</div>
</div>
