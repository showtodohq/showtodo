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
	<!-- 顶部高质感加载微进度条 (当加载时流动展示) -->
	{#if isLoading}
		<div class="absolute top-0 left-0 right-0 h-0.5 z-30 bg-blue-50 dark:bg-blue-950/60 overflow-hidden">
			<div class="h-full bg-blue-600 dark:bg-blue-400 w-full animate-indeterminate"></div>
		</div>
	{/if}

	<!-- 矩阵主横向滚动容器 -->
	<div class="w-full overflow-x-auto">
		<div class="min-w-[760px] sm:min-w-[920px]">
			<!-- 表头 (Sticky Header Row) -->
			<div
				class="grid grid-cols-[64px_repeat(7,minmax(105px,1fr))] sm:grid-cols-[110px_repeat(7,minmax(120px,1fr))] border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60"
			>
				<!-- 左上角用户列表头 (Sticky Left) -->
				<div
					class="sticky left-0 z-20 bg-zinc-50/95 dark:bg-zinc-900/95 px-1 py-2 sm:py-3 border-r border-zinc-200/90 dark:border-zinc-800 flex flex-col items-center justify-center text-center"
				>
					<span class="text-xs font-semibold text-zinc-600 dark:text-zinc-300">行动者</span>
					<span class="text-[10px] text-zinc-400">周待办</span>
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

			<!-- 用户泳道列表 / 骨架屏 -->
			{#if isLoading && users.length === 0}
				<!-- 初次加载拟真骨架屏 (5 行标准泳道) -->
				<div class="divide-y divide-zinc-100 dark:divide-zinc-800/60">
					{#each [1, 2, 3, 4, 5] as seed}
						{@render skeletonRow(seed)}
					{/each}
				</div>
			{:else if users.length === 0}
				<!-- 空状态 -->
				<div class="py-20 text-center flex flex-col items-center justify-center gap-2">
					<Icon icon="lucide:calendar-x-2" class="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
					<p class="text-sm font-medium text-zinc-500">本周暂无待办记录</p>
					<p class="text-xs text-zinc-400">点击右下角按钮发布您的公开待办吧</p>
				</div>
			{:else}
				<!-- 真实数据泳道 (切换加载时平滑微透明过渡) -->
				<div
					class="divide-y divide-zinc-100 dark:divide-zinc-800/60 {isLoading
						? 'opacity-60 pointer-events-none transition-opacity duration-200'
						: 'transition-opacity duration-200'}"
				>
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

					<!-- 加载更多创作者时的追加骨架行 -->
					{#if isLoadingMoreUsers}
						{@render skeletonRow(4)}
						{@render skeletonRow(5)}
					{/if}
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
						<span>加载更多行动者...</span>
					{:else}
						<span>已展示前 {users.length} 位行动者</span>
						<Icon icon="lucide:chevron-down" class="w-3.5 h-3.5" />
					{/if}
				</button>
			{:else}
				<span class="text-[11px] text-zinc-400">已显示全部 {users.length} 位活跃行动者</span>
			{/if}
		</div>
	{/if}
</div>

<!-- 骨架屏泳道片段定义 -->
{#snippet skeletonRow(seed: number)}
	<div
		class="grid grid-cols-[64px_repeat(7,minmax(105px,1fr))] sm:grid-cols-[110px_repeat(7,minmax(120px,1fr))] border-b border-zinc-100 dark:border-zinc-800/80 animate-pulse"
	>
		<!-- 左侧行动者信息骨架 (垂直居中) -->
		<div
			class="sticky left-0 z-10 bg-white dark:bg-zinc-950 px-1.5 py-3 flex flex-col items-center justify-center border-r border-zinc-200/90 dark:border-zinc-800"
		>
			<div class="flex flex-col items-center gap-1.5 w-full">
				<div class="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0"></div>
				<div class="space-y-1 w-full flex flex-col items-center">
					<div class="h-3 rounded bg-zinc-200 dark:bg-zinc-800 {seed % 2 === 0 ? 'w-12' : 'w-10'}"></div>
					<div class="h-2 rounded bg-zinc-100 dark:bg-zinc-800/60 w-8"></div>
				</div>
			</div>
		</div>

		<!-- 7 天单元格骨架 -->
		{#each Array(7) as _, colIdx}
			<div
				class="min-h-[96px] sm:min-h-[110px] p-2 flex flex-col justify-start gap-1.5 border-r border-zinc-100 dark:border-zinc-800/60 last:border-r-0"
			>
				{#if (colIdx + seed) % 3 === 0}
					<div class="h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800/70 w-5/6"></div>
					<div class="h-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 w-3/5"></div>
				{:else if (colIdx + seed) % 2 === 0}
					<div class="h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800/70 w-4/5"></div>
				{:else if colIdx === 2}
					<div class="h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 w-2/3"></div>
				{/if}
			</div>
		{/each}
	</div>
{/snippet}
