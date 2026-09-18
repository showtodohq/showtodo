<script lang="ts">
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { api } from '$lib/services/api';
	import Icon from '@iconify/svelte';

	let isOpen = $state(false);
	let emailInput = $state('');
	let saving = $state(false);
	let showShortcutsModal = $state(false);
	let popoverContainerRef = $state<HTMLDivElement | null>(null);

	function toggleOpen() {
		isOpen = !isOpen;
		if (!isOpen) {
			emailInput = '';
		}
	}

	function closePopover() {
		isOpen = false;
		emailInput = '';
	}

	function handleClickOutside(e: MouseEvent) {
		if (isOpen && popoverContainerRef && !popoverContainerRef.contains(e.target as Node)) {
			closePopover();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (isOpen && e.key === 'Escape') {
			closePopover();
		}
	}

	async function handleSaveUser(e: SubmitEvent) {
		e.preventDefault();
		const clean = emailInput.trim().toLowerCase();
		if (!clean) return;

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(clean)) {
			toast.error('Please enter a valid email address');
			return;
		}

		saving = true;
		try {
			const res = await api.syncUser(clean);
			if (res.user) {
				userStore.updateUserFromProfile(res.user);
				toast.success(`Welcome back, ${res.user.nickname}!`);
			}
			closePopover();
		} catch (err) {
			console.error('Failed to sync user with server:', err);
			toast.error(`Failed to sync user: ${(err as Error).message}`);
		} finally {
			saving = false;
		}
	}

	function handleLogout() {
		userStore.clearSession();
		toast.info('Signed out');
		closePopover();
	}

	async function copyHandle() {
		if (!userStore.handle) return;
		try {
			await navigator.clipboard.writeText(`@${userStore.handle}`);
			toast.success(`Copied handle @${userStore.handle}`);
		} catch {
			toast.info(`Handle: @${userStore.handle}`);
		}
	}
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleKeydown} />

<div class="relative" bind:this={popoverContainerRef}>
	<!-- 顶部 Header 头像触发器 -->
	<button
		type="button"
		onclick={toggleOpen}
		class="flex items-center rounded-full p-0.5 ring-2 transition-all duration-150 cursor-pointer {isOpen ? 'ring-zinc-900 dark:ring-zinc-100 scale-105' : 'ring-transparent hover:ring-zinc-300 dark:hover:ring-zinc-700'}"
		title={userStore.email ? `${userStore.nickname} (@${userStore.handle})` : 'Set identity and preferences'}
		aria-label="User settings"
		aria-expanded={isOpen}
	>
		<Avatar
			src={userStore.avatar}
			name={userStore.nickname}
			size="sm"
		/>
	</button>

	<!-- 悬浮毛玻璃气泡面板：Linear / Raycast 风格 4 段式模块化菜单架构 -->
	{#if isOpen}
		<div
			class="absolute right-0 top-full mt-2 w-72 sm:w-80 z-50 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-2 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-150 divide-y divide-zinc-100 dark:divide-zinc-800/70 select-none"
		>
			<!-- 【第 1 段：身份识别区 (Identity Header)】 -->
			<div class="p-3 bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-800">
				{#if userStore.current}
					{@const myProfileUrl = `/@${userStore.handle || userStore.id}`}
					<div class="flex items-center gap-3">
						<a href={myProfileUrl} onclick={closePopover} class="shrink-0 hover:opacity-85 transition-opacity" title="Go to profile">
							<Avatar src={userStore.avatar} name={userStore.nickname} size="md" class="ring-1 ring-zinc-200 dark:ring-zinc-700 cursor-pointer" />
						</a>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-1.5">
								<a
									href={myProfileUrl}
									onclick={closePopover}
									class="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate hover:underline"
									title="Go to profile"
								>
									{userStore.nickname}
								</a>
								<button
									type="button"
									onclick={copyHandle}
									class="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-mono transition-colors cursor-pointer"
									title="Copy handle"
								>
									@{userStore.handle}
								</button>
							</div>
							<div class="text-[11px] text-zinc-400 font-mono truncate mt-0.5">
								{userStore.email}
							</div>
						</div>
					</div>
				{:else}
					<div class="flex items-center gap-2.5">
						<div class="h-8 w-8 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400 shrink-0">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
						</div>
						<div>
							<div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
								Guest Mode
							</div>
							<div class="text-[11px] text-zinc-400">
								Link email to sync across devices & check in
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- 【第 2 段：业务与功能扩展槽位 (Feature Slots & Menu Items)】 -->
			<div class="py-1.5 space-y-0.5">
				{#if userStore.current}
					<!-- 扩展槽位 0：个人主页 -->
					<a
						href={`/@${userStore.handle || userStore.id}`}
						onclick={closePopover}
						class="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer group/link"
					>
						<span class="flex items-center gap-2 font-medium">
							<svg class="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
							Profile
						</span>
						<Icon icon="lucide:arrow-right" class="h-3 w-3 text-zinc-400 transition-transform group-hover/link:translate-x-0.5" />
					</a>

					<!-- 扩展槽位 0.5：我的待办清单工作台 -->
					<a
						href={`/@${userStore.handle || userStore.id}/todolist`}
						onclick={closePopover}
						class="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer group/link"
					>
						<span class="flex items-center gap-2 font-medium">
							<svg class="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
							</svg>
							Todo List
						</span>
						<Icon icon="lucide:arrow-right" class="h-3 w-3 text-zinc-400 transition-transform group-hover/link:translate-x-0.5" />
					</a>

					<!-- 扩展槽位 1：快捷键指南 -->
					<div
						class="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-default"
					>
						<span class="flex items-center gap-2">
							<svg class="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
							Quick Post
						</span>
						<kbd class="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">Enter</kbd>
					</div>

					<!-- 扩展槽位 2：收起输入框 -->
					<div
						class="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-default"
					>
						<span class="flex items-center gap-2">
							<svg class="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
							Cancel / Close
						</span>
						<kbd class="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">Esc</kbd>
					</div>
				{:else}
					<!-- 未登录状态：紧凑的邮箱绑定表单 -->
					<form onsubmit={handleSaveUser} class="p-2 space-y-2">
						<Input
							size="sm"
							type="email"
							placeholder="Enter email (e.g. alex@example.com)"
							bind:value={emailInput}
							required
						/>
						<Button
							type="submit"
							size="xs"
							variant="primary"
							class="w-full text-xs font-medium"
							loading={saving}
							disabled={saving || !emailInput.trim()}
						>
							Confirm & Sign In
						</Button>
					</form>
				{/if}
			</div>

			<!-- 【第 3 段：系统偏好设置区 (Preferences)】 -->
			<div class="p-2">
				<div class="flex items-center justify-between gap-2">
					<span class="text-xs font-medium text-zinc-600 dark:text-zinc-400 shrink-0">
						Appearance
					</span>
					<div class="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg text-[11px]">
						<button
							type="button"
							onclick={() => theme.setMode('light')}
							class="px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer {theme.mode === 'light' ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100 font-semibold' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
						>
							Light
						</button>
						<button
							type="button"
							onclick={() => theme.setMode('dark')}
							class="px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer {theme.mode === 'dark' ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100 font-semibold' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
						>
							Dark
						</button>
						<button
							type="button"
							onclick={() => theme.setMode('system')}
							class="px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer {theme.mode === 'system' ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100 font-semibold' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
						>
							System
						</button>
					</div>
				</div>
			</div>

			<!-- 【第 4 段：底部危险与退出区 (Actions & Logout)】 -->
			{#if userStore.current}
				<div class="p-1">
					<button
						type="button"
						onclick={handleLogout}
						class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
					>
						<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
						</svg>
						Sign Out
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
