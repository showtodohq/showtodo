<script lang="ts">
	import type { UserProfile } from '$lib/types/user';
	import type { Todo } from '$lib/types/todo';
	import Avatar from '$lib/components/common/Avatar.svelte';
	import CalendarCell from './CalendarCell.svelte';
	import { formatDateISO, isSameDay } from '$lib/utils/calendar';

	interface Props {
		user: UserProfile;
		weekDates: Date[];
		todos: Todo[]; // 属于该用户的 todos
		isCurrentUser?: boolean;
		onSelectTodo?: (todo: Todo) => void;
		onOpenDayTodos?: (dateStr: string, todos: Todo[]) => void;
		onQuickCreate?: (dateStr: string) => void;
	}

	let {
		user,
		weekDates,
		todos,
		isCurrentUser = false,
		onSelectTodo,
		onOpenDayTodos,
		onQuickCreate
	}: Props = $props();

	// 将当前用户的 todos 按 YYYY-MM-DD 归类
	const todosByDate = $derived(() => {
		const map = new Map<string, Todo[]>();
		for (const t of todos) {
			const dateKey = t.startDate ? t.startDate.slice(0, 10) : t.createdAt.slice(0, 10);
			const list = map.get(dateKey) || [];
			list.push(t);
			map.set(dateKey, list);
		}
		return map;
	});
</script>

<div
	class="grid grid-cols-[56px_repeat(7,minmax(110px,1fr))] sm:grid-cols-[180px_repeat(7,minmax(130px,1fr))] border-b border-zinc-100 dark:border-zinc-800/80 transition-colors"
>
	<!-- 左侧用户固定列 (Sticky Left Column: 移动端 56px 仅头像，桌面端 180px 完整信息) -->
	<div
		class="sticky left-0 z-10 bg-white dark:bg-zinc-950 p-2 sm:p-4 flex flex-col items-center sm:items-start justify-center border-r border-zinc-200/90 dark:border-zinc-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]"
	>
		<div
			class="flex flex-col sm:flex-row items-center sm:items-center gap-2.5 group w-full justify-center sm:justify-start"
		>
			<div class="relative shrink-0">
				<Avatar
					avatar={user.avatar}
					seed={user.nickname}
					size="md"
					alt={user.nickname}
					class="ring-2 ring-zinc-100 dark:ring-zinc-800 group-hover:ring-blue-400 transition-all"
				/>
				<!-- 移动端当前登录用户小标记 -->
				{#if isCurrentUser}
					<span
						class="sm:hidden absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white dark:ring-zinc-950"
						title="我"
					></span>
				{/if}
			</div>

			<!-- 桌面端才显示昵称与 handle (移动端隐藏以节省空间) -->
			<div class="min-w-0 flex-1 hidden sm:block">
				<div class="flex items-center justify-start gap-1.5">
					<span
						class="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate"
					>
						{user.nickname}
					</span>
					{#if isCurrentUser}
						<span
							class="text-[10px] px-1 py-0.2 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-medium"
						>
							我
						</span>
					{/if}
				</div>
				<p class="text-[11px] text-zinc-400 truncate">
					@{user.handle}
				</p>
			</div>
		</div>
	</div>

	<!-- 右侧 7 天单元格 -->
	{#each weekDates as d (formatDateISO(d))}
		{@const dateStr = formatDateISO(d)}
		{@const dayTodos = todosByDate().get(dateStr) || []}
		<CalendarCell
			todos={dayTodos}
			{dateStr}
			isToday={isSameDay(d, new Date())}
			{isCurrentUser}
			{onSelectTodo}
			{onOpenDayTodos}
			{onQuickCreate}
		/>
	{/each}
</div>
