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
	import Icon from '@iconify/svelte';

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
	<title>{topicRes.topic ? `#${topicRes.topic.content} · Trending · ShowTodo` : 'Trending · ShowTodo'}</title>
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
				<BreadcrumbNav backHref="/trending" backLabel="Back to Trending" />
				<div
					class="p-8 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3"
				>
					<div class="inline-flex p-3 rounded-2xl bg-red-100/80 dark:bg-red-950/60 text-red-500">
						<Icon icon="lucide:search-x" class="h-6 w-6" />
					</div>
					<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
						Trending todo not found
					</div>
					<p class="text-xs text-zinc-500 max-w-sm mx-auto">
						This todo does not exist or has no records.
					</p>
					<Button variant="outline" size="sm" onclick={() => goto('/trending')}>
						Back to Trending
					</Button>
				</div>
			</div>
		{/snippet}

		{#snippet errorView(msg)}
			<div class="space-y-6 sm:space-y-8">
				<BreadcrumbNav backHref="/trending" backLabel="Back to Trending" />
				<div
					class="p-8 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3"
				>
					<div class="inline-flex p-3 rounded-2xl bg-red-100/80 dark:bg-red-950/60 text-red-500">
						<Icon icon="lucide:alert-triangle" class="h-6 w-6" />
					</div>
					<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
						{msg}
					</div>
					<p class="text-xs text-zinc-500 max-w-sm mx-auto">
						This todo does not exist or has no records.
					</p>
					<Button variant="outline" size="sm" onclick={() => goto('/trending')}>
						Back to Trending
					</Button>
				</div>
			</div>
		{/snippet}

		{#if topicRes.topic}
			<div class="space-y-5 sm:space-y-6">
				<!-- Breadcrumb navigation -->
				<BreadcrumbNav
					backHref="/trending"
					backLabel="Back to Trending"
					crumbs={[
						{ label: 'Trending', href: '/trending' },
						{ label: `#${topicRes.topic.content}` }
					]}
				/>

				<!-- 看板与加入行动栏 -->
				<TopicHeaderCard
					topic={topicRes.topic}
					hasJoined={topicRes.hasJoined}
					myStatus={topicRes.myParticipant?.status}
					isJoining={topicRes.isJoining}
					onjoin={topicRes.handleJoin}
					onstatuschange={topicRes.handleToggleMyStatus}
				/>

				<!-- 打卡人员列表 -->
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
