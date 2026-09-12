<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { todoMutations } from '$lib/stores/todo.svelte';
	import { createTodoDetailResource } from '$lib/stores/resources/use-todo-detail.svelte';
	import type { ReactionEmoji } from '$lib/types/todo';
	import DataView from '$lib/components/ui/DataView.svelte';
	import BreadcrumbNav from '$lib/components/ui/BreadcrumbNav.svelte';
	import TodoDetailSkeleton from '$lib/components/skeleton/TodoDetailSkeleton.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TodoDetailCard from '$lib/components/todo/TodoDetailCard.svelte';
	import TodoCheckInForm from '$lib/components/todo/TodoCheckInForm.svelte';
	import TodoActivityTimeline from '$lib/components/todo/TodoActivityTimeline.svelte';
	import Icon from '@iconify/svelte';

	const detailRes = createTodoDetailResource(page.params.id);
	let currentLoadedId = $state<string | null>(null);

	$effect(() => {
		const paramId = page.params.id;
		if (paramId && paramId !== currentLoadedId) {
			currentLoadedId = paramId;
			detailRes.load(paramId);
		}
	});

	function handleReaction(emoji?: ReactionEmoji) {
		if (!detailRes.todo) return;
		todoMutations.toggleReaction(detailRes.todo.id, emoji, detailRes.todo);
	}
</script>

<svelte:head>
	<title>{detailRes.todo ? `${detailRes.todo.content.slice(0, 24)}${detailRes.todo.content.length > 24 ? '...' : ''} · 待办详情 · ptdl-alpha` : '待办详情 · ptdl-alpha'}</title>
</svelte:head>

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
				<BreadcrumbNav backHref="/" backLabel="返回动态流" />
				<div
					class="p-8 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3"
				>
					<div class="inline-flex p-3 rounded-2xl bg-red-100/80 dark:bg-red-950/60 text-red-500">
						<Icon icon="lucide:file-question" class="h-6 w-6" />
					</div>
					<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
						待办不存在
					</div>
					<p class="text-xs text-zinc-500 max-w-sm mx-auto">
						该待办可能已被删除或链接无效，请返回动态流查看其他公开待办。
					</p>
					<Button variant="outline" size="sm" onclick={() => goto('/')}>
						返回动态流
					</Button>
				</div>
			</div>
		{/snippet}

		{#snippet errorView(msg)}
			<div class="space-y-6 sm:space-y-8">
				<BreadcrumbNav backHref="/" backLabel="返回动态流" />
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
						该待办可能已被删除或链接无效，请返回动态流查看其他公开待办。
					</p>
					<Button variant="outline" size="sm" onclick={() => goto('/')}>
						返回动态流
					</Button>
				</div>
			</div>
		{/snippet}

		{#if detailRes.todo}
			<div class="space-y-5 sm:space-y-6">
				<!-- 极简面包屑与溯源导航 -->
				<BreadcrumbNav
					backHref="/"
					backLabel="返回动态流"
					crumbs={[
						{ label: '动态流', href: '/' },
						...(detailRes.todo.topicHash
							? [{ label: `#${detailRes.todo.content.slice(0, 16)}`, href: `/topics/${detailRes.todo.topicHash}` }]
							: []),
						{ label: '待办详情' }
					]}
				/>

				<!-- 待办核心详情卡片 -->
				<TodoDetailCard
					todo={detailRes.todo}
					isMine={detailRes.isMine}
					topicParticipantCount={detailRes.topicParticipantCount}
					hasJoined={detailRes.hasJoined}
					myJoinedStatus={detailRes.myJoinedTodo?.status}
					isJoining={detailRes.isJoining}
					onstatuschange={detailRes.handleStatusChange}
					onreaction={handleReaction}
					onsaveedit={detailRes.handleSaveEdit}
					onjoin={detailRes.handleJoinTopic}
					onmystatuschange={detailRes.handleToggleMyStatus}
				/>

				<!-- 若是作者本人，显示进展打卡模块 -->
				{#if detailRes.isMine}
					<TodoCheckInForm
						currentStatus={detailRes.todo.status}
						isSubmitting={detailRes.isSubmittingCheckIn}
						onsubmit={detailRes.handleCheckIn}
					/>
				{/if}

				<!-- 生命周期动态时间线 -->
				<TodoActivityTimeline
					activities={detailRes.todo.activities}
					isLoading={detailRes.isRevalidating || detailRes.loading}
				/>
			</div>
		{/if}
	</DataView>
</div>
