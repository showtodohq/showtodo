<script lang="ts">
	import type { TopicItem } from '$lib/types/todo';
	import UserAvatarTooltip from '$lib/components/user/UserAvatarTooltip.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		topic: TopicItem;
		onjoin?: (topic: TopicItem) => void;
	}

	let { topic, onjoin }: Props = $props();

	const hasJoined = $derived(
		topic.participants.some(
			(p) => p.isMe || Boolean(userStore.id && p.user.id === userStore.id)
		)
	);

	const isAllDone = $derived(topic.isAllDone || (topic.totalParticipants > 0 && topic.doneCount >= topic.totalParticipants));
	const progressPercent = $derived(topic.completionRate);
</script>

<div
	class="group rounded-2xl transition-all duration-150 p-4 sm:p-5 space-y-3 {isAllDone
		? 'border border-amber-300/80 dark:border-amber-500/60 bg-gradient-to-br from-amber-50/70 via-yellow-50/30 to-amber-50/70 dark:from-amber-950/25 dark:via-yellow-950/10 dark:to-amber-950/25 shadow-xs shadow-amber-500/5'
		: 'bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70'}"
>
	<!-- 顶部元信息：全员完成勋章、立项时间、行动按钮 -->
	<div class="flex items-center justify-between gap-3">
		<div class="flex items-center gap-2 flex-wrap min-w-0">

			{#if isAllDone}
				<span
					class="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 dark:text-amber-100 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 dark:from-amber-600 dark:via-yellow-600 dark:to-amber-500 px-2 py-0.5 rounded-md shadow-xs animate-in zoom-in-95 duration-150 select-none"
					title="Everyone has completed this todo"
				>
					<Icon icon="lucide:trophy" class="h-3 w-3 shrink-0" />
					<span>All Completed</span>
				</span>
			{/if}

			<span class="text-[11px] text-zinc-400 font-mono">
				Started {topic.firstCreatedAt?.slice(0, 10) || 'Recently'}
			</span>
		</div>

		<!-- Join status button -->
		<div class="shrink-0">
			{#if hasJoined}
				<span
					class="inline-flex items-center gap-1 text-xs font-medium {isAllDone
						? 'text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/40 border border-amber-300/60 dark:border-amber-700/50'
						: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40'} px-2.5 py-1 rounded-lg select-none"
				>
					<Icon icon="lucide:check" class="h-3 w-3 shrink-0" />
					<span>In my list</span>
				</span>
			{:else}
				<Button
					variant="primary"
					size="xs"
					onclick={() => onjoin?.(topic)}
					class="font-medium px-3 py-1.5 shadow-xs"
				>
					Add to my list
				</Button>
			{/if}
		</div>
	</div>

	<!-- Topic title link -->
	<div>
		<a
			href="/trending/{topic.topicHash}"
			class="group/title block focus:outline-hidden"
			title="View trending details"
		>
			<h3
				class="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover/title:text-zinc-600 dark:group-hover/title:text-zinc-300 transition-colors leading-snug {isAllDone ? 'text-amber-950 dark:text-amber-100' : ''}"
			>
				{topic.content}
			</h3>
		</a>
	</div>

	<!-- Progress bar -->
	<div class="space-y-1.5">
		<div class="flex items-center justify-between text-xs font-mono">
			<div class="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
				{#if isAllDone}
					<Icon icon="lucide:sparkles" class="h-3.5 w-3.5 text-amber-500 shrink-0" />
					<span class="font-medium text-amber-600 dark:text-amber-400">All {topic.totalParticipants} people completed!</span>
				{:else if topic.totalParticipants > 1}
					<span class="text-amber-500 font-semibold">{topic.totalParticipants}</span>
					<span>people</span>
					<span>·</span>
					<span>{topic.doneCount} completed</span>
				{:else}
					<span class="text-zinc-600 dark:text-zinc-300 font-medium">1 person</span>
				{/if}
			</div>

			<span class="font-medium {isAllDone ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-600 dark:text-zinc-300'}">
				{progressPercent}%
			</span>
		</div>

		<div class="h-1.5 w-full bg-zinc-200/70 dark:bg-zinc-800 rounded-full overflow-hidden">
			<div
				class="h-full rounded-full transition-all duration-300 {isAllDone
					? 'bg-gradient-to-r from-amber-400 to-amber-500'
					: 'bg-zinc-900 dark:bg-zinc-100'}"
				style="width: {progressPercent}%"
			></div>
		</div>
	</div>

	<!-- Footer: participants & link -->
	<div class="flex items-center justify-between pt-1 text-xs">
		<div class="flex items-center gap-2">
			<div class="flex -space-x-1 hover:space-x-0.5 transition-all duration-200 items-center">
				{#each topic.participants.slice(0, 5) as p (p.todoId)}
					<UserAvatarTooltip
						user={p.user}
						size="xs"
						isStack={true}
						align="left"
						isMe={p.isMe}
						goldBadge={isAllDone}
					/>
				{/each}
			</div>

			{#if topic.totalParticipants > 5}
				<span class="text-[11px] text-zinc-400 font-mono">
					+{topic.totalParticipants - 5}
				</span>
			{/if}
		</div>

		<a
			href="/trending/{topic.topicHash}"
			class="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors group/more"
		>
			<span>Who's doing this</span>
			<span class="transition-transform group-hover/more:translate-x-0.5">→</span>
		</a>
	</div>
</div>
