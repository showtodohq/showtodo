<script lang="ts">
	import type { UserProfile } from '$lib/types/user';
	import type { Todo } from '$lib/types/todo';
	import CalendarUserRow from './CalendarUserRow.svelte';
	import { formatDayHeader, formatDateISO } from '$lib/utils/calendar';
	import Icon from '@iconify/svelte';

	interface Props {
		weekDates: Date[];
		users: UserProfile[];
		todos: Todo[];
		currentUserId?: string | null;
		isLoading?: boolean;
		isLoadingMoreUsers?: boolean;
		hasMoreUsers?: boolean;
		onLoadMoreUsers?: () => void;
		onSelectTodo?: (todo: Todo) => void;
		onOpenDayTodos?: (user: UserProfile, dateStr: string, todos: Todo[]) => void;
		onQuickCreate?: (user: UserProfile, dateStr: string) => void;
	}

	let {
		weekDates,
		users = [],
		todos = [],
		currentUserId,
		isLoading = false,
		isLoadingMoreUsers = false,
		hasMoreUsers = false,
		onLoadMoreUsers,
		onSelectTodo,
		onOpenDayTodos,
		onQuickCreate
	}: Props = $props();

	// 按 authorId 归类 todos
	const todosByAuthor = $derived(() => {
		const map = new Map<string, Todo[]>();
		for (const t of todos) {
			const authorId = t.author?.id || t.authorId;
			if (!authorId) continue;
			const list = map.get(authorId) || [];
			list.push(t);
			map.set(authorId, list);
		}
		return map;
	});
</script>

<div class="relative w-full rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs overflow-hidden">
	<!-- 矩阵主横向滚动容器 -->
	<div class="w-full overflow-x-auto">
		<div class="min-w-[820px] sm:min-w-[980px]">
			<!-- 表头 (Sticky Header Row) -->
			<div
				class="grid grid-cols-[56px_repeat(7,minmax(110px,1fr))] sm:grid-cols-[180px_repeat(7,minmax(130px,1fr))] border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60"
			>
				<!-- 左上角用户列表头 (Sticky Left) -->
				<div
					class="sticky left-0 z-20 bg-zinc-50/95 dark:bg-zinc-900/95 p-2 sm:p-4 border-r border-zinc-200/90 dark:border-zinc-800 flex items-center justify-center sm:justify-between"
				>
					<span class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hidden sm:inline">创作者</span>
					<Icon icon="lucide:users" class="w-4 h-4 text-zinc-400 sm:hidden" />
					<span class="text-[10px] text-zinc-400 hidden sm:inline">周待办</span>
				</div>

				<!-- 7 天日期列头 -->
				{#each weekDates as d (formatDateISO(d))}
					{@const header = formatDayHeader(d)}
					<div
						class="p-2 sm:p-3 text-center border-r border-zinc-100 dark:border-zinc-800/60 last:border-r-0 {header.isToday
							? 'bg-blue-50/60 dark:bg-blue-950/30'
							: ''}"
					>
						<div
							class="text-xs font-semibold {header.isToday
								? 'text-blue-600 dark:text-blue-400 font-bold'
								: 'text-zinc-700 dark:text-zinc-300'}"
						>
							{header.dayName}
						</div>
						<div
							class="text-[11px] {header.isToday
								? 'text-blue-600/80 dark:text-blue-400/80 font-medium'
								: 'text-zinc-400'}"
						>
							{header.dateLabel}
						</div>
					</div>
				{/each}
			</div>

			<!-- 用户泳道列表 -->
			{#if isLoading}
				<div class="py-20 text-center flex flex-col items-center justify-center gap-3">
					<Icon icon="lucide:loader-2" class="w-7 h-7 text-blue-500 animate-spin" />
					<p class="text-xs text-zinc-400">正在同步日历看板...</p>
				</div>
			{:else if users.length === 0}
				<div class="py-20 text-center flex flex-col items-center justify-center gap-2">
					<Icon icon="lucide:calendar-x-2" class="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
					<p class="text-sm font-medium text-zinc-500">本周暂无待办记录</p>
					<p class="text-xs text-zinc-400">点击右下角按钮发布您的公开待办吧</p>
				</div>
			{:else}
				<div class="divide-y divide-zinc-100 dark:divide-zinc-800/60">
					{#each users as user (user.id)}
						{@const userTodos = todosByAuthor().get(user.id) || []}
						<CalendarUserRow
							{user}
							{weekDates}
							todos={userTodos}
							isCurrentUser={currentUserId === user.id}
							{onSelectTodo}
							onOpenDayTodos={(dateStr, dayTodos) => onOpenDayTodos?.(user, dateStr, dayTodos)}
							onQuickCreate={(dateStr) => onQuickCreate?.(user, dateStr)}
						/>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- 底部用户展开/分页控制器 -->
	{#if users.length > 0}
		<div class="border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 px-4 py-2.5 flex items-center justify-center">
			{#if hasMoreUsers}
				<button
					type="button"
					disabled={isLoadingMoreUsers}
					onclick={onLoadMoreUsers}
					class="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors py-1 px-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-50"
				>
					{#if isLoadingMoreUsers}
						<Icon icon="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
						<span>加载更多创作者...</span>
					{:else}
						<span>已展示前 {users.length} 位创作者</span>
						<Icon icon="lucide:chevron-down" class="w-3.5 h-3.5" />
					{/if}
				</button>
			{:else}
				<span class="text-[11px] text-zinc-400">已显示全部 {users.length} 位活跃创作者</span>
			{/if}
		</div>
	{/if}
</div>
