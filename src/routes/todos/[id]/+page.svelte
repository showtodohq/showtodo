<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { api } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import { todoStore } from '$lib/stores/todo.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { confetti } from '$lib/utils/confetti';
	import { formatRelativeTime, formatScheduleRange } from '$lib/utils/format';
	import { getCategoryConfig } from '$lib/constants/categories';
	import { TODO_STATUSES, getStatusConfig } from '$lib/constants/status';
	import type { Todo, TodoStatus, ReactionEmoji, TodoActivity } from '$lib/types/todo';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import CategoryBadge from '$lib/components/todo/CategoryBadge.svelte';
	import TodoCheckbox from '$lib/components/todo/TodoCheckbox.svelte';
	import ReactionButton from '$lib/components/todo/ReactionButton.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	let loading = $state(true);
	let error = $state<string | null>(null);
	let todo = $state<Todo | null>(null);

	// 多人同行信息
	let topicParticipantCount = $state<number>(0);

	// 打卡心得输入与状态联动
	let checkInNote = $state('');
	let checkInStatus = $state<TodoStatus>('in_progress');
	let isSubmittingCheckIn = $state(false);

	// 编辑待办正文/备注
	let isEditingTodo = $state(false);
	let editContent = $state('');
	let editNote = $state('');
	let isSavingTodo = $state(false);

	const isMine = $derived(
		Boolean(
			todo &&
				((userStore.id && todo.authorId === userStore.id) ||
					(userStore.handle && todo.author?.handle === userStore.handle) ||
					(userStore.email && todo.author?.email === userStore.email))
		)
	);

	const scheduleText = $derived(
		todo ? formatScheduleRange(todo.startDate, todo.dueDate) : ''
	);

	const currentStatusCfg = $derived(getStatusConfig(todo?.status || 'pending'));

	const checkInActionText = $derived(
		checkInStatus === 'done'
			? '完成待办 ✨'
			: checkInStatus === 'abandoned'
				? '放弃待办'
				: checkInStatus === 'pending'
					? '设为待办'
					: '记录进展'
	);

	const sortedActivities = $derived(
		todo?.activities
			? [...todo.activities].sort(
					(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				)
			: []
	);

	async function loadTodo(identifier: string) {
		loading = true;
		error = null;
		try {
			const res = await api.getTodoById(identifier);
			todo = res.todo;
			editContent = todo.content;
			editNote = todo.note || '';

			// 默认情况下编辑打卡日志时，一般状态都是进行中 (in_progress)
			checkInStatus = todo.status === 'pending' ? 'in_progress' : todo.status;

			if (todo.topicHash) {
				try {
					const info = await api.getTopicInfo(todo.id);
					topicParticipantCount = info.participantCount || 0;
				} catch {
					// ignore topic info failure
				}
			}
		} catch (err) {
			console.error('Failed to load todo:', err);
			error = (err as Error).message || '待办不存在或已被删除';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const paramId = page.params.id;
		if (paramId) {
			loadTodo(paramId);
		}
	});

	async function handleToggleStatus(nextStatus: TodoStatus, e?: MouseEvent) {
		if (!todo || !userStore.email) {
			toast.info('请先绑定邮箱');
			return;
		}

		const prevStatus = todo.status;
		todo.status = nextStatus;
		checkInStatus = nextStatus;

		if (nextStatus === 'done') {
			confetti.burst(e?.clientX, e?.clientY, 300);
			toast.success('🎉 达成目标！');
		}

		try {
			await api.updateTodo(todo.id, {
				email: userStore.email,
				status: nextStatus
			});

			// 重新加载以获取更新后的 activities
			const updated = await api.getTodoById(todo.id);
			todo = updated.todo;
		} catch (err) {
			todo.status = prevStatus;
			checkInStatus = prevStatus;
			toast.error(`状态更新失败: ${(err as Error).message}`);
		}
	}

	function handleCheckInKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			const form = (e.target as HTMLElement).closest('form');
			form?.requestSubmit();
		}
	}

	async function handleCheckIn(e: SubmitEvent) {
		e.preventDefault();
		const note = checkInNote.trim();
		if (!note || !todo || !userStore.email) return;

		isSubmittingCheckIn = true;
		try {
			const statusChanged = checkInStatus !== todo.status;
			await api.updateTodo(todo.id, {
				email: userStore.email,
				status: checkInStatus,
				activityNote: note
			});

			if (checkInStatus === 'done' && statusChanged) {
				confetti.burst(undefined, undefined, 300);
			}

			// 重新拉取以更新时间线与状态
			const updated = await api.getTodoById(todo.id);
			todo = updated.todo;
			checkInNote = '';
			toast.success(
				statusChanged
					? `状态已变更为「${getStatusConfig(checkInStatus).label}」`
					: '已记下进展'
			);
		} catch (err) {
			toast.error(`提交失败: ${(err as Error).message}`);
		} finally {
			isSubmittingCheckIn = false;
		}
	}

	async function handleSaveEdit(e: SubmitEvent) {
		e.preventDefault();
		if (!todo || !userStore.email) return;

		isSavingTodo = true;
		try {
			await api.updateTodo(todo.id, {
				email: userStore.email,
				content: editContent.trim(),
				note: editNote.trim() || null
			});

			const updated = await api.getTodoById(todo.id);
			todo = updated.todo;
			isEditingTodo = false;
			toast.success('待办已更新');
		} catch (err) {
			toast.error(`更新失败: ${(err as Error).message}`);
		} finally {
			isSavingTodo = false;
		}
	}

	function handleReaction(emoji?: ReactionEmoji) {
		if (!todo) return;
		todoStore.toggleReaction(todo.id, emoji);

		// 本地同步 reaction 计数与高亮
		if (!userStore.email) return;
		todo.reactions ??= {};
		todo.myReactions ??= [];
		const targetEmoji = emoji || '❤️';
		if (todo.myReactions.includes(targetEmoji)) {
			todo.reactions[targetEmoji] = Math.max(0, (todo.reactions[targetEmoji] || 1) - 1);
			todo.myReactions = todo.myReactions.filter((e) => e !== targetEmoji);
		} else {
			todo.reactions[targetEmoji] = (todo.reactions[targetEmoji] || 0) + 1;
			todo.myReactions.push(targetEmoji);
		}
	}

	async function copyShortLink() {
		if (!todo) return;
		const url = window.location.href;
		try {
			await navigator.clipboard.writeText(url);
			toast.success('已复制待办专属链接');
		} catch {
			toast.info(`链接: ${url}`);
		}
	}
</script>

<svelte:head>
	<title>{todo ? `${todo.content} · 待办详情` : '待办详情'} · ptdl-alpha</title>
</svelte:head>

<div class="w-full space-y-6 max-w-2xl mx-auto">
	<!-- 顶部返回导航与短链分享 -->
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

		{#if todo}
			<button
				type="button"
				onclick={copyShortLink}
				class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-100 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
				title="点击复制链接"
			>
				<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
				</svg>
				<span>#{todo.shortId || todo.id.slice(0, 8)}</span>
			</button>
		{/if}
	</div>

	{#if loading}
		<div class="flex justify-center py-24 text-zinc-400">
			<Spinner size="lg" />
		</div>
	{:else if error || !todo}
		<div class="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center space-y-3">
			<div class="text-2xl">🔍</div>
			<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
				{error || '未找到该待办'}
			</div>
			<p class="text-xs text-zinc-400 max-w-sm mx-auto">
				该待办可能已被作者删除或链接不完整。
			</p>
			<div class="pt-2">
				<Button variant="outline" size="sm" onclick={() => goto('/')}>
					返回广场首页
				</Button>
			</div>
		</div>
	{:else}
		<!-- 核心待办详情卡片 -->
		<div
			class="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white/90 dark:bg-zinc-900/90 p-6 sm:p-7 backdrop-blur-sm shadow-xs space-y-5"
		>
			<!-- 头部：作者资料与状态胶囊 -->
			<div class="flex items-center justify-between gap-3">
				<a
					href="/users/{todo.author?.handle || todo.author?.id}"
					class="flex items-center gap-3 group/author"
				>
					<Avatar
						src={todo.author?.avatar}
						name={todo.author?.nickname || '匿名'}
						size="md"
						class="ring-1 ring-zinc-200 dark:ring-zinc-700 group-hover/author:scale-105 transition-transform"
					/>
					<div>
						<div class="flex items-center gap-1.5">
							<span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover/author:underline">
								{todo.author?.nickname || '匿名待办者'}
							</span>
							{#if isMine}
								<span class="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-200/60 dark:border-amber-800/60">
									我
								</span>
							{/if}
						</div>
						<div class="text-[11px] text-zinc-400 font-mono">
							@{todo.author?.handle || 'user'} · {formatRelativeTime(todo.createdAt)}
						</div>
					</div>
				</a>

				<!-- 右侧状态标签与复选打勾器 -->
				<div class="flex items-center gap-2">
					<span
						class="px-2.5 py-1 rounded-full text-xs font-medium {currentStatusCfg.bgClass} {currentStatusCfg.textClass} border {currentStatusCfg.borderClass}"
					>
						{currentStatusCfg.label}
					</span>

					<TodoCheckbox
						status={todo.status}
						{isMine}
						size="md"
						ontoggle={(next, e) => handleToggleStatus(next, e)}
					/>
				</div>
			</div>

			<!-- 待办正文 -->
			{#if isEditingTodo}
				<form onsubmit={handleSaveEdit} class="space-y-3 pt-2">
					<div class="space-y-1">
						<label for="edit-content" class="text-xs font-medium text-zinc-600 dark:text-zinc-400">待办内容</label>
						<textarea
							id="edit-content"
							bind:value={editContent}
							rows="2"
							required
							class="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
						></textarea>
					</div>
					<div class="space-y-1">
						<label for="edit-note" class="text-xs font-medium text-zinc-600 dark:text-zinc-400">公开备注 (选填)</label>
						<textarea
							id="edit-note"
							bind:value={editNote}
							rows="2"
							class="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
						></textarea>
					</div>
					<div class="flex justify-end gap-2">
						<Button type="button" variant="ghost" size="xs" onclick={() => (isEditingTodo = false)}>
							取消
						</Button>
						<Button type="submit" variant="primary" size="xs" loading={isSavingTodo}>
							保存修改
						</Button>
					</div>
				</form>
			{:else}
				<div class="space-y-2">
					<h1
						class="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-snug break-words {todo.status === 'done' ? 'line-through decoration-zinc-400 text-zinc-400 dark:text-zinc-500' : ''}"
					>
						{todo.content}
					</h1>

					{#if todo.note}
						<div
							class="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed break-words"
						>
							<div class="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider mb-1">
								📝 备注与背景
							</div>
							{todo.note}
						</div>
					{/if}
				</div>
			{/if}

			<!-- 分类与时间元数据 -->
			<div class="flex items-center flex-wrap gap-2.5 pt-1 text-xs text-zinc-400 select-none border-t border-zinc-100 dark:border-zinc-800/60">
				{#if todo.category}
					<CategoryBadge
						category={todo.category}
						mode="pill"
						onclick={(cat) => goto(`/?category=${cat}`)}
					/>
					<span>·</span>
				{/if}

				{#if scheduleText}
					<div class="flex items-center gap-1 text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
						<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<span>{scheduleText}</span>
					</div>
					<span>·</span>
				{/if}

				<ReactionButton
					reactions={todo.reactions}
					myReactions={todo.myReactions}
					onreact={handleReaction}
				/>

				{#if isMine && !isEditingTodo}
					<div class="ml-auto">
						<button
							type="button"
							onclick={() => (isEditingTodo = true)}
							class="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
						>
							编辑正文
						</button>
					</div>
				{/if}
			</div>

			<!-- 多人同行提示条 -->
			{#if todo.topicHash && topicParticipantCount > 1}
				<div
					class="flex items-center justify-between p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200"
				>
					<div class="flex items-center gap-2">
						<span class="text-base">🔥</span>
						<span>该待办属于多人同行目标，全网共 <strong>{topicParticipantCount}</strong> 人并肩挑战！</span>
					</div>
					<a
						href="/topics/{todo.topicHash}"
						class="font-semibold text-amber-700 dark:text-amber-300 hover:underline shrink-0 ml-2"
					>
						查看同行榜 →
					</a>
				</div>
			{/if}
		</div>

		<!-- 生命周期动态时间线 (Activities Timeline) -->
		<div class="space-y-4">
			<div class="flex items-center justify-between px-1">
				<h2 class="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
					🌱 成长动态与打卡记录 ({todo.activities?.length || 0})
				</h2>
			</div>

			<!-- 若是作者本人，提供“追加进展打卡”模块 -->
			{#if isMine}
				<form
					onsubmit={handleCheckIn}
					class="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xs space-y-3"
				>
					<div class="flex items-center justify-between flex-wrap gap-2">
						<div class="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
							<span class="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
							<span>记录进展</span>
						</div>

						<!-- 状态选择分段胶囊按钮组 -->
						<div class="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl text-xs select-none">
							{#each TODO_STATUSES as st}
								<button
									type="button"
									onclick={() => (checkInStatus = st.id)}
									class="flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer {checkInStatus === st.id
										? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
										: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}"
									title="{st.label}: {st.description}"
								>
									{#if st.id === 'pending'}
										<span class="text-[10px]">○</span>
									{:else if st.id === 'in_progress'}
										<span class="text-[10px] text-blue-500">◔</span>
									{:else if st.id === 'done'}
										<span class="text-[10px] text-emerald-500">✓</span>
									{:else if st.id === 'abandoned'}
										<span class="text-[10px] text-zinc-400">✕</span>
									{/if}
									<span>{st.label}</span>
								</button>
							{/each}
						</div>
					</div>

					<textarea
						bind:value={checkInNote}
						onkeydown={handleCheckInKeydown}
						rows="2"
						placeholder="写点什么，记录此刻的进展与心得... (支持 ⌘ + Enter 快速提交)"
						required
						class="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
					></textarea>

					<div class="flex items-center justify-between text-xs text-zinc-400">
						<span class="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
							⌘ + Enter 提交
						</span>

						<Button
							type="submit"
							size="xs"
							variant="primary"
							loading={isSubmittingCheckIn}
							disabled={isSubmittingCheckIn || !checkInNote.trim()}
						>
							{checkInActionText}
						</Button>
					</div>
				</form>
			{/if}

			<!-- 时间线列表 -->
			{#if !todo.activities || todo.activities.length === 0}
				<div class="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800/80 py-10 text-center text-xs text-zinc-400">
					暂无动态记录
				</div>
			{:else}
				<div class="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
					{#each sortedActivities as act (act.id)}
						<div class="relative group/act">
							<!-- 轴点图标 -->
							<div
								class="absolute -left-6 top-0.5 h-5 w-5 rounded-full bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px]"
							>
								{#if act.type === 'created'}
									<span>🚀</span>
								{:else if act.type === 'status_change'}
									<span>🔄</span>
								{:else}
									<span>🌱</span>
								{/if}
							</div>

							<!-- 动态内容卡片 -->
							<div class="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/60 space-y-1">
								<div class="flex items-center justify-between text-[11px]">
									<span class="font-semibold text-zinc-800 dark:text-zinc-200">
										{#if act.type === 'created'}
											创建待办
										{:else if act.type === 'status_change'}
											状态变更为
											<span class="font-medium text-zinc-900 dark:text-zinc-100">
												「{getStatusConfig(act.toStatus || 'pending').label}」
											</span>
										{:else}
											记录进展
										{/if}
									</span>
									<span class="font-mono text-zinc-400">
										{formatRelativeTime(act.createdAt)}
									</span>
								</div>

								{#if act.content}
									<p class="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed break-words pt-0.5">
										{act.content}
									</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
