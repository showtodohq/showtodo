<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { UserProfile } from '$lib/types/user';
	import { toast } from '$lib/stores/toast.svelte';
	import { getAvatarUrl } from '$lib/services/avatar';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		user: UserProfile;
		isMe: boolean;
		onsaveprofile?: (data: {
			nickname: string;
			handle: string;
			avatar: string | null;
		}) => Promise<void>;
		children?: Snippet;
	}

	let { user, isMe, onsaveprofile, children }: Props = $props();

	let isEditing = $state(false);
	let editNickname = $state('');
	let editHandle = $state('');
	let editAvatar = $state('');
	let showAvatarUrlInput = $state(false);
	let isSaving = $state(false);

	$effect(() => {
		editNickname = user.nickname;
		editHandle = user.handle;
		editAvatar = user.avatar || '';
	});

	// 实时计算预览头像 URL
	const previewAvatarUrl = $derived(
		editAvatar.trim() || getAvatarUrl(null, editNickname.trim() || user.handle, 80)
	);

	function generateRandomAvatar() {
		const seeds = [
			'Felix', 'Aneka', 'Milo', 'Bella', 'Jasper', 'Luna', 'Oliver', 'Cleo',
			'Leo', 'Maya', 'Finn', 'Nova', 'Kai', 'Aria', 'Eli', 'Zoe'
		];
		const randomSeed = `${seeds[Math.floor(Math.random() * seeds.length)]}-${Math.floor(Math.random() * 1000)}`;
		editAvatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${randomSeed}&backgroundColor=f4f4f5,e4e4e7,d4d4d8`;
		toast.info('✨ 已随机生成个性头像');
	}

	function resetAvatar() {
		editAvatar = '';
		showAvatarUrlInput = false;
		toast.info('已恢复默认头像');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isEditing) return;
		if (e.key === 'Escape') {
			isEditing = false;
		} else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			saveProfile();
		}
	}

	async function saveProfile() {
		const cleanNickname = editNickname.trim();
		let cleanHandle = editHandle.trim().toLowerCase().replace(/^@+/, '');

		if (!cleanNickname) {
			toast.error('昵称不能为空');
			return;
		}

		if (!cleanHandle) {
			toast.error('用户名不能为空');
			return;
		}

		// 项目权威规则 (docs/api.md & src/lib/server/validation.ts)
		const HANDLE_REGEX = /^[a-z0-9][a-z0-9_-]{0,48}[a-z0-9]$|^[a-z0-9]$/;
		if (cleanHandle.length < 1 || cleanHandle.length > 50 || !HANDLE_REGEX.test(cleanHandle)) {
			toast.error('用户名需为 1~50 位英文字母、数字、下划线或连字符');
			return;
		}

		isSaving = true;
		try {
			await onsaveprofile?.({
				nickname: cleanNickname,
				handle: cleanHandle,
				avatar: editAvatar.trim() || null
			});
			isEditing = false;
		} finally {
			isSaving = false;
		}
	}

	async function copyHandle() {
		const text = `@${user.handle}`;
		try {
			await navigator.clipboard.writeText(text);
			toast.success('已复制用户名');
		} catch {
			toast.info(`用户名: ${text}`);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-xs transition-all duration-200"
>
	{#if !isEditing}
		<!-- 正常浏览模式 -->
		<div class="flex items-start justify-between gap-4 flex-wrap">
			<div class="flex items-center gap-4.5">
				<Avatar
					src={user.avatar}
					name={user.nickname}
					alt={user.nickname}
					size="xl"
					class="ring-4 ring-zinc-100 dark:ring-zinc-800/80 shadow-xs"
				/>
				<div class="space-y-1">
					<div class="flex items-center gap-2 flex-wrap">
						<h1
							class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-none"
						>
							{user.nickname}
						</h1>
						{#if isMe}
							<span
								class="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium select-none"
							>
								本人主页
							</span>
						{/if}
					</div>

					<div
						class="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 pt-0.5"
					>
						<button
							type="button"
							onclick={copyHandle}
							class="font-mono font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline cursor-pointer"
							title="点击复制用户名"
						>
							@{user.handle}
						</button>
						<span>·</span>
						<span>加入于 {user.createdAt ? user.createdAt.slice(0, 10) : '近期'}</span>
					</div>
				</div>
			</div>

			{#if isMe}
				<Button
					variant="outline"
					size="xs"
					onclick={() => (isEditing = true)}
					class="font-medium"
				>
					编辑资料
				</Button>
			{/if}
		</div>
	{:else}
		<!-- 高质感沉浸式编辑模式 (In-place Studio) -->
		<form
			onsubmit={(e) => {
				e.preventDefault();
				saveProfile();
			}}
			class="space-y-6 animate-in fade-in zoom-in-95 duration-150"
		>
			<!-- 顶部状态栏：操作与标题 -->
			<div class="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
				<div class="flex items-center gap-2">
					<span class="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
					<span class="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
						编辑个人名片
					</span>
					<span class="text-[11px] text-zinc-400 font-mono hidden sm:inline">
						(⌘ + Enter 保存 / Esc 取消)
					</span>
				</div>

				<div class="flex items-center gap-2">
					<Button
						type="button"
						variant="ghost"
						size="xs"
						onclick={() => (isEditing = false)}
						disabled={isSaving}
					>
						取消
					</Button>
					<Button
						type="submit"
						variant="primary"
						size="xs"
						loading={isSaving}
						disabled={isSaving || !editNickname.trim() || !editHandle.trim()}
					>
						保存修改
					</Button>
				</div>
			</div>

			<!-- 主体双栏：左侧头像工坊 + 右侧精致字段输入 -->
			<div class="flex flex-col sm:flex-row items-start gap-6">
				<!-- 左侧：头像实时工坊 -->
				<div class="flex flex-col items-center gap-2.5 sm:w-32 shrink-0">
					<div class="relative group/avatar cursor-pointer" onclick={generateRandomAvatar} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && generateRandomAvatar()}>
						<Avatar
							src={previewAvatarUrl}
							name={editNickname}
							alt={editNickname}
							size="xl"
							class="ring-4 ring-blue-500/20 dark:ring-blue-400/20 shadow-md transition-transform group-hover/avatar:scale-105"
						/>
						<div
							class="absolute inset-0 rounded-full bg-black/40 text-white text-[10px] font-medium flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-xs select-none"
						>
							<span>🎲</span>
							<span>换一个</span>
						</div>
					</div>

					<div class="flex items-center gap-1.5 flex-wrap justify-center">
						<button
							type="button"
							onclick={generateRandomAvatar}
							class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
							title="随机生成 Notionist 风格头像"
						>
							<span>🎲</span>
							<span>随机</span>
						</button>

						<button
							type="button"
							onclick={() => (showAvatarUrlInput = !showAvatarUrlInput)}
							class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 transition-colors cursor-pointer"
							title="自定义图片外链"
						>
							<span>🔗</span>
							<span>URL</span>
						</button>

						{#if editAvatar}
							<button
								type="button"
								onclick={resetAvatar}
								class="px-1.5 py-0.5 rounded-md text-[11px] text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
								title="恢复为默认头像"
							>
								重置
							</button>
						{/if}
					</div>
				</div>

				<!-- 右侧：字段输入区 -->
				<div class="flex-1 w-full space-y-4">
					<!-- 昵称 -->
					<div class="space-y-1.5">
						<label
							for="profile-edit-nickname"
							class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between"
						>
							<span>展示昵称</span>
							<span class="text-[10px] font-mono text-zinc-400">公开展示在待办与动态流中</span>
						</label>
						<input
							id="profile-edit-nickname"
							type="text"
							bind:value={editNickname}
							placeholder="输入展示昵称"
							maxlength="30"
							required
							class="w-full text-base sm:text-lg font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/50 px-3.5 py-2 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-800 transition-all"
						/>
					</div>

					<!-- 用户名 (@handle) -->
					<div class="space-y-1.5">
						<label
							for="profile-edit-handle"
							class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between"
						>
							<span>用户名 (@handle)</span>
							<span class="text-[10px] font-mono text-zinc-400">唯一身份与主页网址</span>
						</label>
						<div
							class="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/50 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-800 transition-all overflow-hidden"
						>
							<span
								class="pl-3.5 pr-1 font-mono text-sm font-semibold text-zinc-400 select-none"
							>
								@
							</span>
							<input
								id="profile-edit-handle"
								type="text"
								bind:value={editHandle}
								placeholder="your_handle"
								maxlength="50"
								required
								class="flex-1 font-mono text-xs sm:text-sm py-2 pr-3 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden"
							/>
						</div>
					</div>

					<!-- 展开的头像 URL 自定义输入框 -->
					{#if showAvatarUrlInput}
						<div class="space-y-1.5 animate-in fade-in duration-150">
							<label
								for="profile-edit-avatar-url"
								class="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center justify-between"
							>
								<span>自定义头像图片 URL</span>
								<span class="text-[10px] text-zinc-400">支持 https 开头的任意图片链接</span>
							</label>
							<input
								id="profile-edit-avatar-url"
								type="url"
								bind:value={editAvatar}
								placeholder="https://images.unsplash.com/... 或任意图片"
								class="w-full text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/50 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:bg-white dark:focus:bg-zinc-800 transition-all"
							/>
						</div>
					{/if}
				</div>
			</div>
		</form>
	{/if}

	<!-- 统计指标网格插槽或展示 -->
	{@render children?.()}
</div>
