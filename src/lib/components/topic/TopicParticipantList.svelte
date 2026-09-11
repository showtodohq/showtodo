<script lang="ts">
	import type { TopicParticipant, TodoStatus } from '$lib/types/todo';
	import { getStatusConfig } from '$lib/constants/status';
	import { formatRelativeTime } from '$lib/utils/format';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import TodoCheckbox from '$lib/components/todo/TodoCheckbox.svelte';

	interface Props {
		participants?: TopicParticipant[];
		allParticipants?: TopicParticipant[];
		todayParticipantsCount?: number;
		totalParticipantsCount?: number;
		currentUserId?: string;
		onstatuschange?: (nextStatus: TodoStatus, e?: MouseEvent) => void;
	}

	let {
		participants = [],
		allParticipants = [],
		todayParticipantsCount,
		totalParticipantsCount,
		currentUserId,
		onstatuschange
	}: Props = $props();

	let activeTab = $state<'today' | 'all'>('today');

	const todayCount = $derived(
		todayParticipantsCount !== undefined ? todayParticipantsCount : participants.length
	);
	const totalCount = $derived(
		totalParticipantsCount !== undefined
			? totalParticipantsCount
			: allParticipants.length > 0
				? allParticipants.length
				: participants.length
	);

	$effect(() => {
		if (todayCount === 0 && totalCount > 0) {
			activeTab = 'all';
		}
	});

	const hasHistoryDiff = $derived(
		totalCount > todayCount ||
		(allParticipants.length > 0 && allParticipants.length !== participants.length)
	);

	const activeList = $derived(
		activeTab === 'today'
			? participants
			: allParticipants.length > 0
				? allParticipants
				: participants
	);

	// 统一展示排序：若当前登录用户已在列表中，置顶保证首位；其余伙伴按时间顺序排列
	const displayParticipants = $derived.by(() => {
		const list = activeList;
		if (!currentUserId || list.length <= 1) return list;
		const myIndex = list.findIndex(
			(p) => p.isMe || (currentUserId && p.user?.id === currentUserId)
		);
		if (myIndex <= 0) return list;
		return [
			list[myIndex],
			...list.slice(0, myIndex),
			...list.slice(myIndex + 1)
		];
	});
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between px-1">
		<div class="flex items-center gap-2">
			<h2
				class="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
			>
				同行伙伴
			</h2>

			{#if hasHistoryDiff}
				<div class="inline-flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
					<button
						type="button"
						class="px-2 py-0.5 rounded-md transition-colors cursor-pointer {activeTab === 'today' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold' : 'hover:text-zinc-700 dark:hover:text-zinc-200'}"
						onclick={() => (activeTab = 'today')}
					>
						今日同行 ({todayCount})
					</button>
					<button
						type="button"
						class="px-2 py-0.5 rounded-md transition-colors cursor-pointer {activeTab === 'all' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold' : 'hover:text-zinc-700 dark:hover:text-zinc-200'}"
						onclick={() => (activeTab = 'all')}
					>
						全部同行 ({totalCount})
					</button>
				</div>
			{:else}
				<span class="text-xs text-zinc-400 font-mono">({todayCount})</span>
			{/if}
		</div>
	</div>

	{#if displayParticipants.length === 0}
		<div class="py-8 px-4 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-2">
			<div class="text-2xl">🌱</div>
			<div class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
				{activeTab === 'today' ? '今日暂无伙伴同行打卡' : '暂无伙伴同行'}
			</div>
			<p class="text-[11px] text-zinc-400 max-w-xs mx-auto">
				{activeTab === 'today' && totalCount > 0
					? `累计已有 ${totalCount} 位伙伴曾加入，点击上方【+ 一起做】成为今日首位同行者！`
					: '点击上方【+ 一起做】成为第一位同行伙伴！'}
			</p>
		</div>
	{:else}
		<div class="space-y-1 sm:space-y-1.5">
		{#each displayParticipants as p, index (p.todoId || `${p.user?.id || 'p'}-${index}`)}
			{@const isSelf = Boolean(p.isMe || (currentUserId && p.user?.id === currentUserId))}
			<div
				class="group/item relative py-3 px-3 sm:px-3.5 rounded-2xl transition-all duration-150 flex items-start justify-between gap-3.5 sm:gap-4 {isSelf
					? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/60 dark:hover:bg-blue-950/30'
					: 'hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60'}"
			>
				<div class="flex items-start gap-3.5 min-w-0 flex-1">
					<a
						href="/users/{p.user?.handle || p.user?.id || ''}"
						class="shrink-0 group/avatar"
					>
						<Avatar
							src={p.user?.avatar}
							name={p.user?.nickname}
							alt={p.user?.nickname}
							size="md"
						/>
					</a>

					<div class="space-y-1.5 min-w-0 flex-1">
						<div class="flex items-center gap-2 flex-wrap">
							<a
								href="/users/{p.user?.handle || p.user?.id || ''}"
								class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 transition-colors"
							>
								{p.user?.nickname || '用户'}
							</a>

							{#if p.user?.handle}
								<span class="text-xs text-zinc-400 font-mono">
									@{p.user.handle}
								</span>
							{/if}

							{#if isSelf}
								<span
									class="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium"
								>
									我
								</span>
							{/if}

							{#if p.createdAt}
								<span class="text-[11px] text-zinc-400">
									· 加入于 {formatRelativeTime(p.createdAt)}
								</span>
							{/if}
						</div>

						<!-- 个人公开备注 -->
						{#if p.note}
							<p
								class="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-100/70 dark:bg-zinc-800/50 rounded-lg p-2 leading-relaxed break-words"
							>
								{p.note}
							</p>
						{/if}

						<!-- 查看此条待办详情直达链接 -->
						<div class="pt-1">
							<a
								href="/todos/{p.shortId || p.todoId}"
								class="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:underline"
							>
								查看打卡动态时间线 →
							</a>
						</div>
					</div>
				</div>

				<!-- 右侧：状态指示与复选打卡 -->
				<div class="flex flex-col items-end gap-2 shrink-0">
					<span
						class="px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusConfig(
							p.status || 'pending'
						).bgClass} {getStatusConfig(p.status || 'pending').textClass} border {getStatusConfig(
							p.status || 'pending'
						).borderClass}"
					>
						{getStatusConfig(p.status || 'pending').label}
					</span>

					{#if isSelf}
						<TodoCheckbox
							status={p.status}
							isMine={true}
							size="md"
							ontoggle={onstatuschange}
						/>
					{/if}
				</div>
			</div>
		{/each}
		</div>
	{/if}
</div>
