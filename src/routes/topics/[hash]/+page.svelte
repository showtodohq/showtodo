<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { api } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import { todoStore } from '$lib/stores/todo.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import type { TopicDetail, TodoStatus } from '$lib/types/todo';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TopicHeaderCard from '$lib/components/topic/TopicHeaderCard.svelte';
	import TopicParticipantList from '$lib/components/topic/TopicParticipantList.svelte';

	let loading = $state(true);
	let error = $state<string | null>(null);
	let topic = $state<TopicDetail | null>(null);
	let isJoining = $state(false);

	const hasJoined = $derived(
		Boolean(
			topic &&
				userStore.id &&
				topic.participants.some((p) => p.user.id === userStore.id)
		)
	);

	const myParticipant = $derived(
		topic && userStore.id
			? topic.participants.find((p) => p.user.id === userStore.id)
			: null
	);

	async function loadTopic(hash: string) {
		error = null;

		// 1. 0ms 瞬时预渲染：从热门卡片中命中已有数据秒开直出
		const cachedCard = todoStore.trendingCards.find((c) => c.topicHash === hash);
		if (cachedCard) {
			topic = {
				topicHash: cachedCard.topicHash,
				content: cachedCard.content,
				category: cachedCard.category,
				firstCreatedAt: new Date().toISOString(),
				totalParticipants: cachedCard.totalParticipants,
				doneCount: cachedCard.doneCount,
				inProgressCount: 0,
				isAllDone:
					cachedCard.totalParticipants > 0 &&
					cachedCard.doneCount >= cachedCard.totalParticipants,
				participants: cachedCard.participants.map((p) => ({
					todoId: p.todoId,
					shortId: p.shortId,
					status: p.status,
					note: p.note,
					createdAt: p.createdAt,
					user: {
						id: p.user.id,
						nickname: p.user.nickname,
						handle: p.user.handle,
						avatar: p.user.avatar,
						email: '',
						createdAt: '',
						updatedAt: ''
					}
				}))
			};
			loading = false;
		} else {
			loading = true;
		}

		try {
			// 2. 后台拉取全量同行伙伴清单数据注水
			const res = await api.getTopicByHash(hash, userStore.id);
			topic = res.topic;
		} catch (err) {
			console.error('Failed to load topic:', err);
			if (!topic) {
				error = (err as Error).message || '该多人同行目标不存在或已解散';
			}
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const hash = page.params.hash;
		if (hash) {
			loadTopic(hash);
		}
	});

	async function handleJoin() {
		if (!userStore.email) {
			toast.info('请先点击右上角头像设置邮箱再加入');
			return;
		}
		if (!topic) return;

		isJoining = true;
		try {
			const res = await api.createTodo({
				email: userStore.email,
				content: topic.content,
				category: topic.category
			});

			if (res.todo) {
				await api.updateTodo(res.todo.id, {
					email: userStore.email,
					status: 'in_progress'
				});
			}

			toast.success('🎉 成功加入该目标！');
			if (page.params.hash) {
				await loadTopic(page.params.hash);
			}
		} catch (err) {
			toast.error(`加入失败: ${(err as Error).message}`);
		} finally {
			isJoining = false;
		}
	}

	async function handleToggleMyStatus(nextStatus: TodoStatus, e?: MouseEvent) {
		if (!myParticipant || !userStore.email) return;

		await todoStore.toggleStatus(myParticipant.todoId, nextStatus, e);
		if (page.params.hash) {
			await loadTopic(page.params.hash);
		}
	}
</script>

<svelte:head>
	<title>{topic ? `${topic.content} - 多人同行目标` : '多人同行 - Public Todo'}</title>
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

	{#if loading}
		<div class="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
			<Spinner size="md" />
			<span class="text-xs">加载同行详情...</span>
		</div>
	{:else if error || !topic}
		<div
			class="p-8 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3"
		>
			<div class="text-2xl">🔥</div>
			<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
				{error || '未找到该同行目标'}
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
			{topic}
			{hasJoined}
			myStatus={myParticipant?.status}
			{isJoining}
			onjoin={handleJoin}
			onstatuschange={handleToggleMyStatus}
		/>

		<!-- 同行伙伴列表 -->
		<TopicParticipantList
			participants={topic.participants}
			currentUserId={userStore.id}
			onstatuschange={handleToggleMyStatus}
		/>
	{/if}
</div>
