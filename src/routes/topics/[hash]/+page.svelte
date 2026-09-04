<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { createTopicDetailResource } from '$lib/stores/resources/use-topic-detail.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TopicHeaderCard from '$lib/components/topic/TopicHeaderCard.svelte';
	import TopicParticipantList from '$lib/components/topic/TopicParticipantList.svelte';

	const topicRes = createTopicDetailResource(page.params.hash);
	let currentLoadedHash = $state<string | null>(null);

	$effect(() => {
		const hash = page.params.hash;
		if (hash && hash !== currentLoadedHash) {
			currentLoadedHash = hash;
			topicRes.load(hash);
		}
	});
</script>

<svelte:head>
	<title>{topicRes.topic ? `${topicRes.topic.content} - 多人同行目标` : '多人同行 - Public Todo'}</title>
</svelte:head>

<div class="w-full space-y-6 sm:space-y-8">
	<!-- 顶部返回导航 -->
	<div class="flex items-center justify-between">
		<button
			type="button"
			onclick={() => (history.length > 1 ? history.back() : goto('/'))}
			class="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
		>
			<span>←</span>
			<span>返回广场</span>
		</button>
	</div>

	{#if topicRes.loading}
		<div class="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
			<Spinner size="md" />
			<span class="text-xs">加载同行详情...</span>
		</div>
	{:else if topicRes.error || !topicRes.topic}
		<div
			class="p-8 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3"
		>
			<div class="text-2xl">🔥</div>
			<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
				{topicRes.error || '未找到该同行目标'}
			</div>
			<p class="text-xs text-zinc-500 max-w-sm mx-auto">
				该目标可能尚未有成员参与，请返回广场探索最新热门目标。
			</p>
			<Button variant="outline" size="sm" onclick={() => goto('/')}>
				返回公共待办广场
			</Button>
		</div>
	{:else}
		<!-- 多人目标头部看板与加入行动栏 -->
		<TopicHeaderCard
			topic={topicRes.topic}
			hasJoined={topicRes.hasJoined}
			myStatus={topicRes.myParticipant?.status}
			isJoining={topicRes.isJoining}
			onjoin={topicRes.handleJoin}
			onstatuschange={topicRes.handleToggleMyStatus}
		/>

		<!-- 同行伙伴列表 -->
		<TopicParticipantList
			participants={topicRes.topic.participants}
			currentUserId={userStore.id}
			onstatuschange={topicRes.handleToggleMyStatus}
		/>
	{/if}
</div>
