<script lang="ts">
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Popover from '$lib/components/ui/Popover.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import { THEME_MODE_TABS } from '$lib/constants/tabs';
	import { POPOVER_PLACEMENT, POPOVER_TRIGGER, POPOVER_ROLE } from '$lib/constants/popover';
	import { userStore } from '$lib/stores/user.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { authClient } from '$lib/auth-client';
	import Icon from '@iconify/svelte';

	let isOpen = $state(false);

	// 未登录表单状态
	let loginMode = $state<'options' | 'password'>('options');
	let email = $state('');
	let password = $state('');
	let isSubmitting = $state(false);

	// 密码管理状态
	let showSecurity = $state(false);
	let checkingPassword = $state(false);
	let hasPassword = $state<boolean | null>(null);
	let currentPasswordInput = $state('');
	let newPasswordInput = $state('');
	let confirmPasswordInput = $state('');
	let isSavingPassword = $state(false);

	function closePopover() {
		isOpen = false;
		loginMode = 'options';
		email = '';
		password = '';
		showSecurity = false;
		currentPasswordInput = '';
		newPasswordInput = '';
		confirmPasswordInput = '';
	}

	async function handleGoogleLogin() {
		isSubmitting = true;
		try {
			await authClient.signIn.social({
				provider: 'google',
				callbackURL: window.location.href
			});
		} catch (err) {
			console.error('Failed to sign in with Google:', err);
			toast.error(`Google sign-in failed: ${(err as Error).message}`);
			isSubmitting = false;
		}
	}

	async function handlePasswordLogin(e: SubmitEvent) {
		e.preventDefault();
		const cleanEmail = email.trim().toLowerCase();
		if (!cleanEmail || !password) return;

		isSubmitting = true;
		try {
			const { error } = await authClient.signIn.email({
				email: cleanEmail,
				password: password
			});

			if (error) {
				toast.error(error.message || 'Invalid email or password');
			} else {
				toast.success('Signed in successfully!');
				closePopover();
			}
		} catch (err) {
			console.error('Login error:', err);
			toast.error(`Login failed: ${(err as Error).message}`);
		} finally {
			isSubmitting = false;
		}
	}

	async function fetchPasswordStatus() {
		checkingPassword = true;
		try {
			const res = await fetch('/api/user/password');
			if (res.ok) {
				const data = await res.json();
				hasPassword = Boolean(data.hasPassword);
			}
		} catch (err) {
			console.error('Failed to check password status:', err);
		} finally {
			checkingPassword = false;
		}
	}

	function toggleSecurity() {
		showSecurity = !showSecurity;
		if (showSecurity && hasPassword === null) {
			fetchPasswordStatus();
		}
	}

	async function handleSavePassword(e: SubmitEvent) {
		e.preventDefault();
		if (newPasswordInput.length < 8) {
			toast.error('New password must be at least 8 characters');
			return;
		}
		if (newPasswordInput !== confirmPasswordInput) {
			toast.error('Passwords do not match');
			return;
		}

		isSavingPassword = true;
		try {
			if (hasPassword) {
				// 修改密码
				const { error } = await authClient.changePassword({
					currentPassword: currentPasswordInput,
					newPassword: newPasswordInput,
					revokeOtherSessions: true
				});
				if (error) {
					toast.error(error.message || 'Failed to update password');
				} else {
					toast.success('Password updated successfully!');
					currentPasswordInput = '';
					newPasswordInput = '';
					confirmPasswordInput = '';
					showSecurity = false;
				}
			} else {
				// 初次设置密码
				const res = await fetch('/api/user/password', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ newPassword: newPasswordInput })
				});
				const data = await res.json();
				if (!res.ok || data.error) {
					toast.error(data.error?.message || 'Failed to set password');
				} else {
					toast.success('Password created successfully! You can now sign in with your email and password.');
					hasPassword = true;
					newPasswordInput = '';
					confirmPasswordInput = '';
					showSecurity = false;
				}
			}
		} catch (err) {
			console.error('Password operation failed:', err);
			toast.error(`Operation failed: ${(err as Error).message}`);
		} finally {
			isSavingPassword = false;
		}
	}

	async function handleLogout() {
		await userStore.signOut();
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

<Popover
	placement={POPOVER_PLACEMENT.BOTTOM_END}
	trigger={POPOVER_TRIGGER.CLICK}
	role={POPOVER_ROLE.DIALOG}
	offset={8}
	bind:open={isOpen}
>
	{#snippet triggerSnippet({ isOpen: popoverOpen, toggle, triggerProps })}
		<button
			type="button"
			{...triggerProps}
			onclick={toggle}
			class="flex items-center rounded-full p-0.5 ring-2 transition-all duration-150 cursor-pointer {popoverOpen
				? 'ring-zinc-900 dark:ring-zinc-100 scale-105'
				: 'ring-transparent hover:ring-zinc-300 dark:hover:ring-zinc-700'}"
			title={userStore.email
				? `${userStore.nickname} (@${userStore.handle})`
				: 'Sign in and preferences'}
			aria-label="User settings"
		>
			<Avatar src={userStore.avatar} name={userStore.nickname} size="sm" />
		</button>
	{/snippet}

	{#snippet children({ close })}
		<div
			class="w-72 sm:w-80 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-150 divide-y divide-zinc-100 dark:divide-zinc-800 select-none"
		>
			<!-- 【第 1 段：身份识别区】 -->
			<div class="p-3 bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-100 dark:border-zinc-800 rounded-t-xl">
				{#if userStore.current}
					{@const myProfileUrl = `/@${userStore.handle || userStore.id}`}
					<div class="flex items-center gap-3">
						<a
							href={myProfileUrl}
							onclick={close}
							class="shrink-0 hover:opacity-85 transition-opacity"
							title="Go to profile"
						>
							<Avatar
								src={userStore.avatar}
								name={userStore.nickname}
								size="md"
								class="ring-1 ring-zinc-200 dark:ring-zinc-700 cursor-pointer"
							/>
						</a>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-1.5">
								<a
									href={myProfileUrl}
									onclick={close}
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
						<div
							class="h-8 w-8 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400 shrink-0"
						>
							<Icon icon="lucide:user" class="h-4 w-4" />
						</div>
						<div>
							<div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
								Sign In to ShowTodo
							</div>
							<div class="text-[11px] text-zinc-400">
								Google or Email & Password
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- 【第 2 段：业务扩展或登录区】 -->
			<div class="py-1.5 space-y-0.5">
				{#if userStore.current}
					<!-- 个人主页 -->
					<a
						href={`/@${userStore.handle || userStore.id}`}
						onclick={close}
						class="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer group/link"
					>
						<span class="flex items-center gap-2 font-medium">
							<Icon icon="lucide:user" class="h-3.5 w-3.5 text-zinc-400" />
							Profile
						</span>
						<Icon
							icon="lucide:arrow-right"
							class="h-3 w-3 text-zinc-400 transition-transform group-hover/link:translate-x-0.5"
						/>
					</a>

					<!-- 我的待办清单 -->
					<a
						href={`/@${userStore.handle || userStore.id}/todolist`}
						onclick={close}
						class="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer group/link"
					>
						<span class="flex items-center gap-2 font-medium">
							<Icon icon="lucide:check-square" class="h-3.5 w-3.5 text-zinc-400" />
							Todo List
						</span>
						<Icon
							icon="lucide:arrow-right"
							class="h-3 w-3 text-zinc-400 transition-transform group-hover/link:translate-x-0.5"
						/>
					</a>

					<!-- 密码与安全管理 (渐进式折叠卡片) -->
					<div class="pt-0.5">
						<button
							type="button"
							onclick={toggleSecurity}
							class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
						>
							<span class="flex items-center gap-2 font-medium">
								<Icon icon="lucide:key-round" class="h-3.5 w-3.5 text-zinc-400" />
								Password & Security
							</span>
							<Icon
								icon={showSecurity ? 'lucide:chevron-up' : 'lucide:chevron-down'}
								class="h-3.5 w-3.5 text-zinc-400"
							/>
						</button>

						{#if showSecurity}
							<div class="mt-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 space-y-2.5">
								{#if checkingPassword}
									<div class="text-[11px] text-zinc-400 flex items-center justify-center py-2 gap-1.5">
										<Icon icon="lucide:loader-2" class="h-3.5 w-3.5 animate-spin" />
										Checking security settings...
									</div>
								{:else}
									<div class="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
										{hasPassword ? 'Change your password' : 'Create a password for this account'}
									</div>

									<form onsubmit={handleSavePassword} class="space-y-2">
										{#if hasPassword}
											<Input
												size="sm"
												type="password"
												placeholder="Current password"
												bind:value={currentPasswordInput}
												required
											/>
										{/if}
										<Input
											size="sm"
											type="password"
											placeholder="New password (min 8 chars)"
											bind:value={newPasswordInput}
											required
										/>
										<Input
											size="sm"
											type="password"
											placeholder="Confirm new password"
											bind:value={confirmPasswordInput}
											required
										/>
										<Button
											type="submit"
											size="xs"
											variant="primary"
											class="w-full text-xs"
											loading={isSavingPassword}
											disabled={isSavingPassword || !newPasswordInput || !confirmPasswordInput}
										>
											{hasPassword ? 'Update Password' : 'Set Password'}
										</Button>
									</form>
								{/if}
							</div>
						{/if}
					</div>
				{:else}
					<!-- 未登录状态：Google 与密码登录 -->
					<div class="p-2 space-y-2">
						<!-- Google 登录 -->
						<Button
							type="button"
							size="sm"
							variant="outline"
							class="w-full text-xs font-medium flex items-center justify-center gap-2 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
							onclick={handleGoogleLogin}
							loading={isSubmitting && loginMode === 'options'}
							disabled={isSubmitting}
						>
							<Icon icon="logos:google-icon" class="h-4 w-4" />
							Continue with Google
						</Button>

						<div class="relative flex py-1 items-center">
							<div class="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
							<span class="flex-shrink mx-2 text-[10px] text-zinc-400">OR</span>
							<div class="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
						</div>

						{#if loginMode === 'options'}
							<Button
								type="button"
								size="xs"
								variant="ghost"
								class="w-full text-xs text-zinc-600 dark:text-zinc-400"
								onclick={() => (loginMode = 'password')}
							>
								Sign in with Password
							</Button>
						{:else}
							<!-- 邮箱与密码表单 -->
							<form onsubmit={handlePasswordLogin} class="space-y-2">
								<Input
									size="sm"
									type="email"
									placeholder="Email"
									bind:value={email}
									required
								/>
								<Input
									size="sm"
									type="password"
									placeholder="Password"
									bind:value={password}
									required
								/>
								<Button
									type="submit"
									size="xs"
									variant="primary"
									class="w-full text-xs font-medium"
									loading={isSubmitting && loginMode === 'password'}
									disabled={isSubmitting || !email.trim() || !password}
								>
									Sign In
								</Button>
								<button
									type="button"
									onclick={() => (loginMode = 'options')}
									class="w-full text-center text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
								>
									Back to options
								</button>
							</form>
						{/if}
					</div>
				{/if}
			</div>

			<!-- 【第 3 段：系统偏好设置区】 -->
			<div class="p-2">
				<div class="flex items-center justify-between gap-2">
					<span class="text-xs font-medium text-zinc-600 dark:text-zinc-400 shrink-0">
						Appearance
					</span>
					<Tabs
						options={THEME_MODE_TABS}
						value={theme.mode}
						onchange={(val) => theme.setMode(val)}
						size="xs"
					/>
				</div>
			</div>

			<!-- 【第 4 段：退出区】 -->
			{#if userStore.current}
				<div class="p-1">
					<button
						type="button"
						onclick={handleLogout}
						class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
					>
						<Icon icon="lucide:log-out" class="h-3.5 w-3.5" />
						Sign Out
					</button>
				</div>
			{/if}
		</div>
	{/snippet}
</Popover>
