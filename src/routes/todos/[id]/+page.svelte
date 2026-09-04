<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { todayStore, todoMutations } from '$lib/stores/todo.svelte';
	import { createTodoDetailResource } from '$lib/stores/resources/use-todo-detail.svelte';
	import type { ReactionEmoji } from '$lib/types/todo';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TodoDetailCard from '$lib/components/todo/TodoDetailCard.svelte';
	import TodoCheckInForm from '$lib/components/todo/TodoCheckInForm.svelte';
	import TodoActivityTimeline from '$lib/components/todo/TodoActivityTimeline.svelte';

	const detailRes = createTodoDetailResource();

	$effect(() => {
		const paramId = page.params.id;
		if (paramId) {
			detailRes.load(paramId);
		}
	});

	// 确保当前用户的今日待办数据已预加载，以便准确判定“今日已全部完成”
	$effect(() => {
		if (userStore.id && todayStore.todos.length === 0 && !todayStore.loading) {
			todayStore.load();
		}
	});

	function handleReaction(emoji?: ReactionEmoji) {
		if (!detailRes.todo) return;
		todoMutations.toggleReaction(detailRes.todo.id, emoji, detailRes.todo);
	}
</script>

<svelte:head>
	<title>{detailRes.todo ? `${detailRes.todo.content} - Todo 详情` : '待办详情 - Public Todo'}</title>
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

	{#if detailRes.loading}
		<div class="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
			<Spinner size="md" />
			<span class="text-xs">加载待办详情...</span>
		</div>
	{:else if detailRes.error || !detailRes.todo}
		<div
			class="p-8 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3"
		>
			<div class="text-2xl">🔍</div>
			<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
				{detailRes.error || '待办不存在'}
			</div>
			<p class="text-xs text-zinc-500 max-w-sm mx-auto">
				该待办可能已被删除或链接无效，请返回公共广场查看其他公开待办。
			</p>
			<Button variant="outline" size="sm" onclick={() => goto('/')}>
				返回公共待办广场
			</Button>
		</div>
	{:else}
		<!-- 待办核心详情卡片 -->
		<TodoDetailCard
			todo={detailRes.todo}
			isMine={detailRes.isMine}
			topicParticipantCount={detailRes.topicParticipantCount}
			onstatuschange={detailRes.handleStatusChange}
			onreaction={handleReaction}
			onsaveedit={detailRes.handleSaveEdit}
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
		<TodoActivityTimeline activities={detailRes.todo.activities} />
	{/if}
</div>
