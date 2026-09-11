<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { createTopicDetailResource } from '$lib/stores/resources/use-topic-detail.svelte';
	import DataView from '$lib/components/ui/DataView.svelte';
	import BreadcrumbNav from '$lib/components/ui/BreadcrumbNav.svelte';
	import TopicDetailSkeleton from '$lib/components/skeleton/TopicDetailSkeleton.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TopicHeaderCard from '$lib/components/topic/TopicHeaderCard.svelte';
	import TopicParticipantList from '$lib/components/topic/TopicParticipantList.svelte';

	import { getTodayString } from '$lib/utils/format';

	const topicRes = createTopicDetailResource(page.params.hash);
	let currentLoadedKey = $state<string | null>(null);

	$effect(() => {
		const hash = page.params.hash;
		const targetDate = page.url.searchParams.get('date') || getTodayString();
		const key = `${hash}:${targetDate}`;
		if (hash && key !== currentLoadedKey) {
			currentLoadedKey = key;
			topicRes.load(hash, targetDate);
		}
	});
</script>

<svelte:head>
	<title>{topicRes.topic ? `#${topicRes.topic.content} · 同行目标 · ptdl-alpha` : '同行目标 · ptdl-alpha'}</title>
</svelte:head>

<div class="w-full space-y-6 sm:space-y-8">
	<DataView
		loading={topicRes.loading}
		empty={!topicRes.topic}
		error={topicRes.error}
	>
		{#snippet skeleton()}
			<TopicDetailSkeleton />
		{/snippet}

		{#snippet emptyView()}
			<div class="space-y-6 sm:space-y-8">
				<BreadcrumbNav backHref="/topics" backLabel="返回同行广场" />
				<div
					class="p-8 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3"
				>
					<div class="text-2xl">🔥</div>
					<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
						未找到该同行目标
					</div>
					<p class="text-xs text-zinc-500 max-w-sm mx-auto">
						该目标可能尚未有成员参与，请返回广场探索最新热门目标。
					</p>
					<Button variant="outline" size="sm" onclick={() => goto('/topics')}>
						返回同行广场
					</Button>
				</div>
			</div>
		{/snippet}

		{#snippet errorView(msg)}
			<div class="space-y-6 sm:space-y-8">
				<BreadcrumbNav backHref="/topics" backLabel="返回同行广场" />
				<div
					class="p-8 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3"
				>
					<div class="text-2xl">🔥</div>
					<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
						{msg}
					</div>
					<p class="text-xs text-zinc-500 max-w-sm mx-auto">
						该目标可能尚未有成员参与，请返回广场探索最新热门目标。
					</p>
					<Button variant="outline" size="sm" onclick={() => goto('/topics')}>
						返回同行广场
					</Button>
				</div>
			</div>
		{/snippet}

		{#if topicRes.topic}
			<div class="space-y-5 sm:space-y-6">
				<!-- 极简面包屑与溯源导航 -->
				<BreadcrumbNav
					backHref="/topics"
					backLabel="返回同行广场"
					crumbs={[
						{ label: '同行广场', href: '/topics' },
						{ label: `#${topicRes.topic.content}` }
					]}
				/>

				<!-- 同行目标头部看板与加入行动栏 -->
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
					allParticipants={topicRes.topic.allParticipants}
					todayParticipantsCount={topicRes.topic.todayParticipants}
					totalParticipantsCount={topicRes.topic.totalParticipants}
					currentUserId={userStore.id}
					onstatuschange={topicRes.handleToggleMyStatus}
				/>
			</div>
		{/if}
	</DataView>
</div>
