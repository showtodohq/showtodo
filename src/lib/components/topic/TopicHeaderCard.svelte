<script lang="ts">
	import type { TopicDetail, TodoStatus } from '$lib/types/todo';
	import { getStatusConfig } from '$lib/constants/status';
	import CategoryBadge from '$lib/components/todo/CategoryBadge.svelte';
	import TodoCheckbox from '$lib/components/todo/TodoCheckbox.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		topic: TopicDetail;
		hasJoined: boolean;
		myStatus?: TodoStatus;
		isJoining?: boolean;
		onjoin?: () => Promise<void> | void;
		onstatuschange?: (nextStatus: TodoStatus, e?: MouseEvent) => void;
	}

	let {
		topic,
		hasJoined,
		myStatus,
		isJoining = false,
		onjoin,
		onstatuschange
	}: Props = $props();

	const completionRate = $derived(
		topic.totalParticipants > 0
			? Math.round((topic.doneCount / topic.totalParticipants) * 100)
			: 0
	);
</script>

<div
	class="p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-xs space-y-6"
>
	<!-- 顶部标题与分类标签 -->
	<div class="space-y-3">
		<div class="flex items-center gap-2.5 flex-wrap">
			{#if topic.category}
				<CategoryBadge category={topic.category} />
			{/if}

			{#if topic.isAllDone}
				<span
					class="inline-flex items-center gap-1 text-xs font-bold text-amber-900 dark:text-amber-100 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 dark:from-amber-600 dark:via-yellow-600 dark:to-amber-500 px-2.5 py-0.5 rounded-full shadow-xs select-none animate-in zoom-in-95 duration-150"
				>
					<span>🏆</span>
					<span>全员达成勋章</span>
				</span>
			{/if}

			<span class="text-xs text-zinc-400 font-mono">
				立项于 {topic.firstCreatedAt?.slice(0, 10) || '今日'}
			</span>
		</div>

		<h1
			class="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-snug {topic.isAllDone
				? 'text-amber-950 dark:text-amber-100'
				: ''}"
		>
			{topic.content}
		</h1>
	</div>

	<!-- 数据进度条与同行统计 -->
	<div class="space-y-2">
		<div class="flex items-center justify-between text-xs">
			<div
				class="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300"
			>
				<span class="text-amber-500">🔥</span>
				<span><strong>{topic.totalParticipants}</strong> 位伙伴正在同行</span>
				<span>·</span>
				<span><strong>{topic.doneCount}</strong> 位{getStatusConfig('done').label}</span>
			</div>
			<div class="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
				{completionRate}% 完成率
			</div>
		</div>

		<!-- 进度条 -->
		<div
			class="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden"
		>
			<div
				class="h-full transition-all duration-300 rounded-full {topic.isAllDone
					? 'bg-gradient-to-r from-amber-400 to-yellow-400'
					: 'bg-emerald-500'}"
				style="width: {completionRate}%;"
			></div>
		</div>
	</div>

	<!-- 行动栏：加入一起做 or 我的同行状态 -->
	<div
		class="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between flex-wrap gap-4"
	>
		{#if hasJoined && myStatus}
			<div class="flex items-center gap-3">
				<span
					class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 rounded-full"
				>
					<span>✓</span>
					<span>你正在同行该目标</span>
				</span>
				<span class="text-xs text-zinc-400">
					当前状态：<strong class="text-zinc-700 dark:text-zinc-200"
						>{getStatusConfig(myStatus).label}</strong
					>
				</span>
			</div>

			<div class="flex items-center gap-2">
				<span class="text-xs text-zinc-500">快速打卡：</span>
				<TodoCheckbox
					status={myStatus}
					isMine={true}
					size="md"
					ontoggle={onstatuschange}
				/>
			</div>
		{:else}
			<div class="text-xs text-zinc-500 dark:text-zinc-400">
				想和大家一起坚持这个目标吗？无需复杂的群组，点击即可同行打卡！
			</div>

			<Button
				variant="primary"
				size="sm"
				loading={isJoining}
				onclick={onjoin}
				class="font-medium"
			>
				+ 加入一起做
			</Button>
		{/if}
	</div>
</div>
