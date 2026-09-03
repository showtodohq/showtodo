<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { api } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import { todoStore } from '$lib/stores/todo.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatRelativeTime } from '$lib/utils/format';
	import { getStatusConfig } from '$lib/constants/status';
	import type { TopicDetail, TodoStatus, ReactionEmoji } from '$lib/types/todo';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import CategoryBadge from '$lib/components/todo/CategoryBadge.svelte';
	import TodoCheckbox from '$lib/components/todo/TodoCheckbox.svelte';
	import ReactionButton from '$lib/components/todo/ReactionButton.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

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

	const completionRate = $derived(
		topic && topic.totalParticipants > 0
			? Math.round((topic.doneCount / topic.totalParticipants) * 100)
			: 0
	);

	async function loadTopic(hash: string) {
		loading = true;
		error = null;
		try {
			const res = await api.getTopicByHash(hash, userStore.id);
			topic = res.topic;
		} catch (err) {
			console.error('Failed to load topic:', err);
			error = (err as Error).message || '未找到该多人协同目标';
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
			toast.info('请先点击右上角头像绑定邮箱后再加入');
			return;
		}
		if (!topic) return;

		isJoining = true;
		try {
			await todoStore.createTodo({
				content: topic.content,
				category: topic.category
			});
			// 刷新该 topic 详情
			await loadTopic(topic.topicHash);
			toast.success('已成功加入该目标！');
		} catch (err) {
			toast.error(`加入失败: ${(err as Error).message}`);
		} finally {
			isJoining = false;
		}
	}

	function handleToggleMyStatus(nextStatus: TodoStatus, e?: MouseEvent) {
		if (!myParticipant) return;
		todoStore.toggleStatus(myParticipant.todoId, nextStatus, e);

		// 本地乐观更新
		const prev = myParticipant.status;
		myParticipant.status = nextStatus;
		if (topic) {
			if (prev !== 'done' && nextStatus === 'done') {
				topic.doneCount += 1;
			} else if (prev === 'done' && nextStatus !== 'done') {
				topic.doneCount = Math.max(0, topic.doneCount - 1);
			}
			topic.isAllDone = topic.totalParticipants > 0 && topic.doneCount >= topic.totalParticipants;
		}
	}
</script>

<svelte:head>
	<title>{topic ? `${topic.content} · 多人同行` : '多人 Todo'} · ptdl-alpha</title>
</svelte:head>

<div class="w-full space-y-6 max-w-3xl mx-auto">
	<!-- 顶部返回导航 -->
	<div class="flex items-center justify-between">
		<a
			href="/"
			class="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
			</svg>
			<span>返回待办广场</span>
		</a>

		{#if topic}
			<span class="text-xs font-mono text-zinc-400">
				Topic: #{topic.topicHash.slice(0, 8)}
			</span>
		{/if}
	</div>

	{#if loading}
		<div class="flex justify-center py-24 text-zinc-400">
			<Spinner size="lg" />
		</div>
	{:else if error || !topic}
		<div class="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center space-y-3">
			<div class="text-2xl">👥</div>
			<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
				{error || '未找到该多人协同目标'}
			</div>
			<p class="text-xs text-zinc-400 max-w-sm mx-auto">
				该目标可能尚未有参与者或链接已失效。
			</p>
			<div class="pt-2">
				<Button variant="outline" size="sm" onclick={() => goto('/')}>
					返回广场首页
				</Button>
			</div>
		</div>
	{:else}
		<!-- 多人协同目标总览头部卡片 -->
		<div
			class="rounded-3xl border {topic.isAllDone
				? 'border-amber-300 dark:border-amber-600/80 bg-gradient-to-br from-amber-50/90 via-yellow-50/50 to-amber-50/90 dark:from-amber-950/40 dark:via-yellow-950/20 dark:to-amber-950/40 shadow-[0_0_24px_rgba(245,158,11,0.12)]'
				: 'border-zinc-200/80 dark:border-zinc-800/90 bg-white/90 dark:bg-zinc-900/90 shadow-xs'} p-6 sm:p-8 backdrop-blur-sm space-y-6"
		>
			<!-- 目标名称与分类 -->
			<div class="space-y-3">
				<div class="flex items-center gap-2 flex-wrap">
					{#if topic.category}
						<CategoryBadge
							category={topic.category}
							mode="pill"
							onclick={(cat) => goto(`/?category=${cat}`)}
						/>
					{/if}

					{#if topic.isAllDone}
						<span
							class="inline-flex items-center gap-1 text-xs font-bold text-amber-900 dark:text-amber-100 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 dark:from-amber-600 dark:via-yellow-600 dark:to-amber-500 px-2.5 py-0.5 rounded-full shadow-xs select-none animate-in zoom-in-95 duration-150"
						>
							<span>🏆</span>
							<span>全员达成勋章</span>
						</span>
					{/if}

					<span class="text-xs text-zinc-400 font-mono">
						立项于 {topic.firstCreatedAt?.slice(0, 10) || '今日'}
					</span>
				</div>

				<h1
					class="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-snug {topic.isAllDone ? 'text-amber-950 dark:text-amber-100' : ''}"
				>
					{topic.content}
				</h1>
			</div>

			<!-- 数据进度条与同行统计 -->
			<div class="space-y-2">
				<div class="flex items-center justify-between text-xs">
					<div class="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
						<span class="text-amber-500">🔥</span>
						<span><strong>{topic.totalParticipants}</strong> 位伙伴正在同行</span>
						<span>·</span>
						<span><strong>{topic.doneCount}</strong> 位{getStatusConfig('done').label}</span>
					</div>
					<div class="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
						{completionRate}% 完成率
					</div>
				</div>

				<!-- 进度条 -->
				<div class="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
					<div
						class="h-full transition-all duration-300 rounded-full {topic.isAllDone
							? 'bg-gradient-to-r from-amber-400 to-yellow-400'
							: 'bg-emerald-500'}"
						style="width: {completionRate}%;"
					></div>
				</div>
			</div>

			<!-- 行动栏：加入一起做 or 我的同行状态 -->
			<div class="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between flex-wrap gap-4">
				{#if hasJoined && myParticipant}
					<div class="flex items-center gap-3">
						<span
							class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 rounded-full"
						>
							<span>✓</span>
							<span>你正在同行该目标</span>
						</span>
						<span class="text-xs text-zinc-400">
							当前状态：<strong class="text-zinc-700 dark:text-zinc-200">{getStatusConfig(myParticipant.status).label}</strong>
						</span>
					</div>

					<div class="flex items-center gap-2">
						<span class="text-xs text-zinc-500">快速打卡：</span>
						<TodoCheckbox
							status={myParticipant.status}
							isMine={true}
							size="md"
							ontoggle={handleToggleMyStatus}
						/>
					</div>
				{:else}
					<div class="text-xs text-zinc-500 dark:text-zinc-400">
						想和大家一起坚持这个目标吗？无需复杂的群组，点击即可同行打卡！
					</div>

					<Button
						variant="primary"
						size="sm"
						loading={isJoining}
						onclick={handleJoin}
						class="font-medium"
					>
						+ 加入一起做
					</Button>
				{/if}
			</div>
		</div>

		<!-- 同行伙伴名单列表 -->
		<div class="space-y-4">
			<div class="flex items-center justify-between px-1">
				<h2 class="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
					👥 同行伙伴名单 ({topic.participants.length})
				</h2>
			</div>

			<div class="space-y-2">
				{#each topic.participants as p (p.todoId)}
					{@const isSelf = Boolean(userStore.id && p.user.id === userStore.id)}
					<div
						class="flex items-start justify-between gap-4 p-4 rounded-2xl border transition-all {isSelf
							? 'border-emerald-300/80 dark:border-emerald-700/60 bg-emerald-50/40 dark:bg-emerald-950/20'
							: 'border-zinc-200/60 dark:border-zinc-800/70 bg-white/70 dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'}"
					>
						<!-- 左侧：用户头像、昵称、打卡状态与公开笔记 -->
						<div class="flex items-start gap-3 min-w-0 flex-1">
							<a
								href="/users/{p.user.handle || p.user.id}"
								class="shrink-0 hover:opacity-85 transition-opacity pt-0.5"
								title="查看个人主页"
							>
								<Avatar
									src={p.user.avatar}
									name={p.user.nickname}
									size="md"
									class="ring-1 ring-zinc-200 dark:ring-zinc-700"
								/>
							</a>

							<div class="min-w-0 flex-1 space-y-1">
								<div class="flex items-center gap-2 flex-wrap">
									<a
										href="/users/{p.user.handle || p.user.id}"
										class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
									>
										{p.user.nickname}
									</a>
									{#if isSelf}
										<span class="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
											我
										</span>
									{/if}
									<span class="text-[11px] text-zinc-400 font-mono">
										@{p.user.handle} · {formatRelativeTime(p.createdAt)}
									</span>
								</div>

								<!-- 个人公开备注 -->
								{#if p.note}
									<p class="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-100/70 dark:bg-zinc-800/50 rounded-lg p-2 leading-relaxed break-words">
										{p.note}
									</p>
								{/if}

								<!-- 查看此条待办详情直达链接 -->
								<div class="pt-1">
									<a
										href="/todos/{p.shortId || p.todoId}"
										class="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:underline"
									>
										查看打卡动态时间线 →
									</a>
								</div>
							</div>
						</div>

						<!-- 右侧：状态指示与复选打卡 -->
						<div class="flex flex-col items-end gap-2 shrink-0">
							<span
								class="px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusConfig(p.status).bgClass} {getStatusConfig(p.status).textClass} border {getStatusConfig(p.status).borderClass}"
							>
								{getStatusConfig(p.status).label}
							</span>

							{#if isSelf}
								<TodoCheckbox
									status={p.status}
									isMine={true}
									size="md"
									ontoggle={handleToggleMyStatus}
								/>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
