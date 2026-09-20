<script lang="ts">
	import type { PageData } from './$types';
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { TODO_STATUS } from '$lib/constants/status';
	import { todoMutations } from '$lib/stores/todo.svelte';
	import { createTodoDetailResource } from '$lib/stores/resources/use-todo-detail.svelte';
	import type { ReactionEmoji } from '$lib/types/todo';
	import DataView from '$lib/components/ui/DataView.svelte';
	import BreadcrumbNav from '$lib/components/ui/BreadcrumbNav.svelte';
	import TodoDetailSkeleton from '$lib/components/skeleton/TodoDetailSkeleton.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TodoDetailCard from '$lib/components/todo/TodoDetailCard.svelte';
	import TodoActivityTimeline from '$lib/components/todo/TodoActivityTimeline.svelte';
	import { getTodoDetailSeo } from '$lib/constants/seo';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import Icon from '@iconify/svelte';

	let { data }: { data: PageData } = $props();

	const detailRes = createTodoDetailResource(page.params.id, untrack(() => data.todo));

	$effect(() => {
		if (data.todo && data.todo.id !== detailRes.todo?.id) {
			detailRes.hydrate(data.todo);
		}
	});

	function handleReaction(emoji?: ReactionEmoji) {
		if (!detailRes.todo) return;
		todoMutations.toggleReaction(detailRes.todo.id, emoji, detailRes.todo);
	}

	async function handleDelete() {
		const authorHandle = detailRes.todo?.author?.handle || userStore.handle;
		const ok = await detailRes.handleDeleteTodo();
		if (ok) {
			if (authorHandle) {
				goto(`/@${authorHandle}/todolist`);
			} else {
				goto('/');
			}
		}
	}

	async function handleAbandon() {
		await detailRes.handleStatusChange(TODO_STATUS.ABANDONED);
		toast.success('Todo marked as abandoned');
	}

	const todoSeo = $derived(getTodoDetailSeo(detailRes.todo));
</script>

<SeoHead seo={todoSeo} />

<div class="w-full space-y-6 sm:space-y-8">
	<DataView
		loading={detailRes.loading}
		empty={!detailRes.todo}
		error={detailRes.error}
	>
		{#snippet skeleton()}
			<TodoDetailSkeleton />
		{/snippet}

		{#snippet emptyView()}
			<div class="space-y-6 sm:space-y-8">
				<BreadcrumbNav backHref="/" backLabel="Back to Feed" />
				<div
					class="p-8 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3"
				>
					<div class="inline-flex p-3 rounded-2xl bg-red-100/80 dark:bg-red-950/60 text-red-500">
						<Icon icon="lucide:file-question" class="h-6 w-6" />
					</div>
					<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
						Todo not found
					</div>
					<p class="text-xs text-zinc-500 max-w-sm mx-auto">
						This todo may have been removed or the link is invalid. Return to the feed to view more public todos.
					</p>
					<Button variant="outline" size="sm" onclick={() => goto('/')}>
						Back to Feed
					</Button>
				</div>
			</div>
		{/snippet}

		{#snippet errorView(msg)}
			<div class="space-y-6 sm:space-y-8">
				<BreadcrumbNav backHref="/" backLabel="Back to Feed" />
				<div
					class="p-8 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3"
				>
					<div class="inline-flex p-3 rounded-2xl bg-red-100/80 dark:bg-red-950/60 text-red-500">
						<Icon icon="lucide:file-question" class="h-6 w-6" />
					</div>
					<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
						{msg}
					</div>
					<p class="text-xs text-zinc-500 max-w-sm mx-auto">
						This todo may have been removed or the link is invalid. Return to the feed to view more public todos.
					</p>
					<Button variant="outline" size="sm" onclick={() => goto('/')}>
						Back to Feed
					</Button>
				</div>
			</div>
		{/snippet}

		{#if detailRes.todo}
			<div class="space-y-5 sm:space-y-6">
				<!-- Breadcrumbs -->
				<BreadcrumbNav
					backHref="/"
					backLabel="Back to Feed"
					crumbs={[
						{ label: 'Feed', href: '/' },
						...(detailRes.todo.topicHash
							? [{ label: `#${detailRes.todo.content.slice(0, 16)}`, href: `/trending/${detailRes.todo.topicHash}` }]
							: []),
						{ label: 'Todo Details' }
					]}
				/>

				<!-- 待办核心详情卡片 -->
				<TodoDetailCard
					todo={detailRes.todo}
					isMine={detailRes.isMine}
					topicParticipantCount={detailRes.topicParticipantCount}
					hasJoined={detailRes.hasJoined}
					myJoinedTodo={detailRes.myJoinedTodo}
					myJoinedStatus={detailRes.myJoinedTodo?.status}
					isJoining={detailRes.isJoining}
					onstatuschange={detailRes.handleStatusChange}
					onreaction={handleReaction}
					onsaveedit={detailRes.handleSaveEdit}
					ondelete={handleDelete}
					onabandon={handleAbandon}
					onjoin={detailRes.handleJoinTopic}
					onmystatuschange={detailRes.handleToggleMyStatus}
					onlogprogress={detailRes.handleCheckIn}
				/>

				<!-- 生命周期动态时间线 -->
				<TodoActivityTimeline
					activities={detailRes.todo.activities}
					isLoading={detailRes.isRevalidating || detailRes.loading}
				/>
			</div>
		{/if}
	</DataView>
</div>
