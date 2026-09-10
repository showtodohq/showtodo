<script lang="ts">
	import type { TopicItem } from '$lib/types/todo';
	import UserAvatarTooltip from '$lib/components/user/UserAvatarTooltip.svelte';
	import { userStore } from '$lib/stores/user.svelte';

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
	<!-- 顶部元信息：全员达成勋章、立项时间、行动按钮 -->
	<div class="flex items-center justify-between gap-3">
		<div class="flex items-center gap-2 flex-wrap min-w-0">

			{#if isAllDone}
				<span
					class="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 dark:text-amber-100 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 dark:from-amber-600 dark:via-yellow-600 dark:to-amber-500 px-2 py-0.5 rounded-md shadow-xs animate-in zoom-in-95 duration-150 select-none"
					title="所有同行伙伴已全部完成"
				>
					<span>🏆</span>
					<span>全员达成</span>
				</span>
			{/if}

			<span class="text-[11px] text-zinc-400 font-mono">
				立项于 {topic.firstCreatedAt?.slice(0, 10) || '近期'}
			</span>
		</div>

		<!-- 协同加入状态按钮 -->
		<div class="shrink-0">
			{#if hasJoined}
				<span
					class="inline-flex items-center gap-1 text-xs font-medium {isAllDone
						? 'text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/40 border border-amber-300/60 dark:border-amber-700/50'
						: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40'} px-2.5 py-1 rounded-lg select-none"
				>
					<span>✓</span>
					<span>已同行</span>
				</span>
			{:else}
				<button
					type="button"
					onclick={() => onjoin?.(topic)}
					class="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
				>
					<span>+</span>
					<span>一起做</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- 待办正文标题 (点击直达 Topic 详情页) -->
	<div>
		<a
			href="/topics/{topic.topicHash}"
			class="group/title block focus:outline-hidden"
			title="点击查看同行详情与历史打卡"
		>
			<h3
				class="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover/title:text-zinc-600 dark:group-hover/title:text-zinc-300 transition-colors leading-snug {isAllDone ? 'text-amber-950 dark:text-amber-100' : ''}"
			>
				{topic.content}
			</h3>
		</a>
	</div>

	<!-- 进度条 -->
	<div class="space-y-1.5">
		<div class="flex items-center justify-between text-xs font-mono">
			<div class="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
				{#if isAllDone}
					<span class="text-amber-500">✨</span>
					<span class="font-medium text-amber-600 dark:text-amber-400">全员 {topic.totalParticipants} 人共同冲线</span>
				{:else if topic.totalParticipants > 1}
					<span class="text-amber-500 font-semibold">{topic.totalParticipants}</span>
					<span>人同行</span>
					<span>·</span>
					<span>{topic.doneCount} 达成</span>
				{:else}
					<span class="text-zinc-600 dark:text-zinc-300 font-medium">1 人发起</span>
					<span>·</span>
					<span>等待伙伴同行</span>
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

	<!-- 底部：参与者头像堆叠与详情入口链接 -->
	<div class="flex items-center justify-between pt-1 text-xs">
		<div class="flex items-center gap-2">
			<!-- 头像堆叠 -->
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
			href="/topics/{topic.topicHash}"
			class="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors group/more"
		>
			<span>查看详情</span>
			<span class="transition-transform group-hover/more:translate-x-0.5">→</span>
		</a>
	</div>
</div>
