<script lang="ts">
	import type { TopicDetail, TodoStatus } from '$lib/types/todo';
	import { TODO_STATUS, getStatusConfig } from '$lib/constants/status';
	import TodoCheckbox from '$lib/components/todo/TodoCheckbox.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '@iconify/svelte';

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
		topic.todayParticipants > 0
			? Math.round((topic.todayDoneCount / topic.todayParticipants) * 100)
			: topic.totalParticipants > 0
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
			{#if topic.isTodayAllDone || topic.isAllDone}
				<span
					class="inline-flex items-center gap-1 text-xs font-bold text-amber-900 dark:text-amber-100 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 dark:from-amber-600 dark:via-yellow-600 dark:to-amber-500 px-2.5 py-0.5 rounded-full shadow-xs select-none animate-in zoom-in-95 duration-150"
				>
					<Icon icon="lucide:trophy" class="h-3.5 w-3.5 shrink-0" />
					<span>All Completed Today</span>
				</span>
			{/if}

			<span class="text-xs text-zinc-400 font-mono">
				Started {topic.firstCreatedAt?.slice(0, 10) || 'Today'}
			</span>
		</div>

		<h1
			class="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-snug {topic.isTodayAllDone || topic.isAllDone
				? 'text-amber-950 dark:text-amber-100'
				: ''}"
		>
			{topic.content}
		</h1>
	</div>

	<!-- Stats & progress -->
	<div class="space-y-2">
		<div class="flex items-center justify-between text-xs">
			<div
				class="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300 flex-wrap"
			>
				<Icon icon="lucide:flame" class="h-4 w-4 text-orange-500 shrink-0" />
				{#if topic.todayParticipants > 0}
					<span><strong>{topic.todayParticipants}</strong> today</span>
					<span>·</span>
					<span><strong>{topic.todayDoneCount}</strong> {getStatusConfig(TODO_STATUS.DONE).label.toLowerCase()}</span>
					{#if topic.totalParticipants > topic.todayParticipants}
						<span class="text-zinc-400 dark:text-zinc-500 font-normal">
							({topic.totalParticipants} total all-time)
						</span>
					{/if}
				{:else}
					<span><strong>{topic.totalParticipants}</strong> total all-time</span>
					<span>·</span>
					<span><strong>{topic.doneCount}</strong> {getStatusConfig(TODO_STATUS.DONE).label.toLowerCase()}</span>
				{/if}
			</div>
			<div class="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
				{completionRate}% {topic.todayParticipants > 0 ? 'Today' : 'Total'}
			</div>
		</div>

		<!-- Progress bar -->
		<div
			class="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden"
		>
			<div
				class="h-full transition-all duration-300 rounded-full {topic.isTodayAllDone || topic.isAllDone
					? 'bg-gradient-to-r from-amber-400 to-yellow-400'
					: 'bg-emerald-500'}"
				style="width: {completionRate}%;"
			></div>
		</div>
	</div>

	<!-- Action bar -->
	<div
		class="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between flex-wrap gap-4"
	>
		{#if hasJoined && myStatus}
			<div class="flex items-center gap-3">
				<span
					class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 rounded-full"
				>
					<Icon icon="lucide:check" class="h-3.5 w-3.5 shrink-0" />
					<span>In my list</span>
				</span>
				<span class="text-xs text-zinc-400">
					Current status: <strong class="text-zinc-700 dark:text-zinc-200"
						>{getStatusConfig(myStatus).label}</strong
					>
				</span>
			</div>

			<div class="flex items-center gap-2">
				<span class="text-xs text-zinc-500">Quick check-in:</span>
				<TodoCheckbox
					status={myStatus}
					isMine={true}
					size="md"
					ontoggle={onstatuschange}
				/>
			</div>
		{:else}
			<div class="text-xs text-zinc-500 dark:text-zinc-400">
				Not in your list yet.
			</div>

			<Button
				variant="primary"
				size="xs"
				loading={isJoining}
				onclick={onjoin}
				class="font-medium px-3 py-1.5 shadow-xs"
			>
				Add to my list
			</Button>
		{/if}
	</div>
</div>
