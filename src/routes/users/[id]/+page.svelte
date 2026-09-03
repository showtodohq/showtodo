<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { api } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import { todoStore } from '$lib/stores/todo.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { TODO_STATUSES, getStatusConfig } from '$lib/constants/status';
	import type { Todo, TodoStatus, ReactionEmoji } from '$lib/types/todo';
	import type { UserProfile } from '$lib/types/user';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import TodoItem from '$lib/components/todo/TodoItem.svelte';

	let loading = $state(true);
	let error = $state<string | null>(null);
	let user = $state<UserProfile | null>(null);
	let userTodos = $state<Todo[]>([]);
	let activeTab = $state<TodoStatus | 'all'>('all');

	// 编辑个人资料状态
	let isEditing = $state(false);
	let editNickname = $state('');
	let editHandle = $state('');
	let editAvatar = $state('');
	let isSavingProfile = $state(false);

	const isMe = $derived(
		Boolean(
			user &&
				((userStore.id && user.id === userStore.id) ||
					(userStore.handle && user.handle === userStore.handle) ||
					(userStore.email && user.email === userStore.email))
		)
	);

	// 统计指标
	const statusCounts = $derived.by(() => {
		const counts: Record<TodoStatus, number> = {
			pending: 0,
			in_progress: 0,
			done: 0,
			abandoned: 0
		};
		for (const t of userTodos) {
			if (t.status in counts) counts[t.status]++;
		}
		return counts;
	});
	const totalTodos = $derived(userTodos.length);
	const completionRate = $derived(
		totalTodos > 0 ? Math.round(((statusCounts.done || 0) / totalTodos) * 100) : 0
	);

	const filteredTodos = $derived(
		activeTab === 'all'
			? userTodos
			: userTodos.filter((t) => t.status === activeTab)
	);

	async function loadUserData(identifier: string) {
		loading = true;
		error = null;
		try {
			const res = await api.getUserById(identifier);
			user = res.user;
			editNickname = user.nickname;
			editHandle = user.handle;
			editAvatar = user.avatar || '';

			// 加载该用户的全部待办
			const todosRes = await api.getTodos({
				authorId: user.id,
				currentUserId: userStore.id,
				limit: 100
			});
			userTodos = todosRes.todos || [];
		} catch (err) {
			console.error('Failed to load user:', err);
			error = (err as Error).message || '用户不存在或加载失败';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const paramId = page.params.id;
		if (paramId) {
			loadUserData(paramId);
		}
	});

	async function handleSaveProfile(e: SubmitEvent) {
		e.preventDefault();
		if (!user || !userStore.email) return;

		isSavingProfile = true;
		try {
			const res = await api.updateUser(user.id, {
				email: userStore.email,
				nickname: editNickname.trim(),
				handle: editHandle.trim(),
				avatar: editAvatar.trim() || null
			});

			if (res.user) {
				user = res.user;
				userStore.updateUserFromProfile(res.user);
				toast.success('资料已更新');
				isEditing = false;
			}
		} catch (err) {
			toast.error(`更新失败: ${(err as Error).message}`);
		} finally {
			isSavingProfile = false;
		}
	}

	function handleToggle(todo: Todo, nextStatus: TodoStatus, e?: MouseEvent) {
		todoStore.toggleStatus(todo.id, nextStatus, e, todo);
	}

	function handleReaction(todo: Todo, emoji?: ReactionEmoji) {
		todoStore.toggleReaction(todo.id, emoji, todo);
	}

	async function copyHandle() {
		if (!user?.handle) return;
		try {
			await navigator.clipboard.writeText(`@${user.handle}`);
			toast.success(`已复制用户名 @${user.handle}`);
		} catch {
			toast.info(`用户名: @${user.handle}`);
		}
	}
</script>

<svelte:head>
	<title>{user ? `${user.nickname} (@${user.handle}) 的个人主页` : '用户个人页'} · ptdl-alpha</title>
</svelte:head>

<div class="w-full space-y-6">
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
	</div>

	{#if loading}
		<div class="flex justify-center py-24 text-zinc-400">
			<Spinner size="lg" />
		</div>
	{:else if error || !user}
		<div class="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center space-y-3">
			<div class="text-2xl">👤</div>
			<div class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
				{error || '未找到该用户'}
			</div>
			<p class="text-xs text-zinc-400 max-w-sm mx-auto">
				可能该用户尚未发布过待办，或者用户名输入有误。
			</p>
			<div class="pt-2">
				<Button variant="outline" size="sm" onclick={() => goto('/')}>
					返回广场首页
				</Button>
			</div>
		</div>
	{:else}
		<!-- 用户名片头部卡片 -->
		<div
			class="relative rounded-3xl border border-zinc-200/80 dark:border-zinc-800/90 bg-gradient-to-b from-white via-zinc-50/40 to-white dark:from-zinc-900/90 dark:via-zinc-950/60 dark:to-zinc-900/90 p-6 sm:p-8 backdrop-blur-sm shadow-xs"
		>
			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
				<!-- 左侧头像与用户身份 -->
				<div class="flex items-center gap-4 sm:gap-5">
					<Avatar
						src={user.avatar}
						name={user.nickname}
						size="xl"
						class="ring-2 ring-white dark:ring-zinc-800 shadow-md shrink-0"
					/>

					<div class="space-y-1 min-w-0">
						<div class="flex items-center gap-2 flex-wrap">
							<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
								{user.nickname}
							</h1>
							{#if isMe}
								<span
									class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
								>
									本人
								</span>
							{/if}
						</div>

						<div class="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
							<button
								type="button"
								onclick={copyHandle}
								class="hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline cursor-pointer"
								title="点击复制 @"
							>
								@{user.handle}
							</button>
							<span>·</span>
							<span>加入于 {user.createdAt?.slice(0, 10) || '近期'}</span>
						</div>
					</div>
				</div>

				<!-- 右侧操作栏 (若是本人显示编辑按钮) -->
				{#if isMe}
					<div class="shrink-0 w-full sm:w-auto">
						<Button
							variant="outline"
							size="sm"
							onclick={() => (isEditing = !isEditing)}
							class="w-full sm:w-auto text-xs"
						>
							<svg class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
							</svg>
							{isEditing ? '收起编辑' : '编辑个人资料'}
						</Button>
					</div>
				{/if}
			</div>

			<!-- 本人内联资料编辑抽屉表单 -->
			{#if isEditing}
				<form
					onsubmit={handleSaveProfile}
					class="mt-6 pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-4 animate-in fade-in duration-150"
				>
					<h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
						修改个人名片
					</h3>
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<Input
							label="展示昵称"
							placeholder="输入昵称"
							size="sm"
							bind:value={editNickname}
							required
						/>
						<Input
							label="用户名 (@handle)"
							placeholder="仅支持字母/数字/下划线"
							size="sm"
							bind:value={editHandle}
							required
						/>
						<Input
							label="自定义头像 URL (选填)"
							placeholder="https://..."
							size="sm"
							bind:value={editAvatar}
						/>
					</div>
					<div class="flex justify-end gap-2 pt-1">
						<Button
							type="button"
							variant="ghost"
							size="xs"
							onclick={() => (isEditing = false)}
						>
							取消
						</Button>
						<Button
							type="submit"
							variant="primary"
							size="xs"
							loading={isSavingProfile}
						>
							保存修改
						</Button>
					</div>
				</form>
			{/if}

			<!-- 数据指标概览 -->
			<div class="mt-6 pt-6 border-t border-zinc-200/60 dark:border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
				<div class="space-y-0.5">
					<div class="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
						{totalTodos}
					</div>
					<div class="text-xs text-zinc-400 font-medium">累计待办</div>
				</div>
				<div class="space-y-0.5">
					<div class="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
						{statusCounts.done || 0}
					</div>
					<div class="text-xs text-zinc-400 font-medium">{getStatusConfig('done').label}</div>
				</div>
				<div class="space-y-0.5">
					<div class="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
						{statusCounts.in_progress || 0}
					</div>
					<div class="text-xs text-zinc-400 font-medium">{getStatusConfig('in_progress').label}</div>
				</div>
				<div class="space-y-0.5">
					<div class="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
						{completionRate}%
					</div>
					<div class="text-xs text-zinc-400 font-medium">完成率</div>
				</div>
			</div>
		</div>

		<!-- 下方：该用户的待办清单与分类筛选 -->
		<div class="space-y-4">
			<!-- 状态筛选 Tab -->
			<div class="flex items-center justify-between gap-2 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3 flex-wrap">
				<div class="flex items-center gap-1.5 text-xs font-medium">
					<button
						type="button"
						onclick={() => (activeTab = 'all')}
						class="px-3 py-1.5 rounded-lg transition-colors cursor-pointer {activeTab === 'all'
							? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
							: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'}"
					>
						全部 ({totalTodos})
					</button>

					{#each TODO_STATUSES as st}
						<button
							type="button"
							onclick={() => (activeTab = st.id)}
							class="px-3 py-1.5 rounded-lg transition-colors cursor-pointer {activeTab === st.id
								? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
								: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'}"
						>
							{st.label} ({statusCounts[st.id] || 0})
						</button>
					{/each}
				</div>
			</div>

			<!-- 待办列表 -->
			{#if filteredTodos.length === 0}
				<div class="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800/80 py-16 text-center text-xs text-zinc-400">
					当前筛选下暂无待办事项 ✨
				</div>
			{:else}
				<div class="space-y-1 sm:space-y-1.5">
					{#each filteredTodos as todo (todo.id)}
						<TodoItem
							{todo}
							isMine={isMe}
							ontoggle={handleToggle}
							onreaction={handleReaction}
							oncategoryclick={(cat) => goto(`/?category=${cat}`)}
						/>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
