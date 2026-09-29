<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { api } from '$lib/services/api';
	import { authClient } from '$lib/auth-client';
	import { toast } from '$lib/stores/toast.svelte';
	import { getSettingsSeo } from '$lib/constants/seo';
	import { formatRelativeTime } from '$lib/utils/format';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import BreadcrumbNav from '$lib/components/ui/BreadcrumbNav.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Icon from '@iconify/svelte';

	let { data, form = null }: { data: PageData; form?: ActionData } = $props();

	// 密码管理状态
	let hasPassword = $state(untrack(() => data.hasPassword));
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let isSavingPassword = $state(false);

	// API Key 状态
	let isCreatingKey = $state(false);
	let newKeyName = $state('');
	let showCreateModal = $state(false);
	let newlyCreatedToken = $state<string | null>(null);
	let copiedToken = $state(false);
	let copiedConfig = $state(false);
	let showGuide = $state(false);

	// 监听 action 返回
	$effect(() => {
		if (form?.action === 'created' && form?.rawToken) {
			newlyCreatedToken = form.rawToken;
			showCreateModal = false;
			newKeyName = '';
			toast.success('API Key created successfully!');
		}
		if (form?.action === 'revoked') {
			toast.success('API Key revoked.');
		}
		if (form?.createError) {
			toast.error(form.createError);
		}
		if (form?.revokeError) {
			toast.error(form.revokeError);
		}
	});

	async function handlePasswordSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (newPassword.length < 8) {
			toast.error('New password must be at least 8 characters');
			return;
		}
		if (newPassword !== confirmPassword) {
			toast.error('Passwords do not match');
			return;
		}

		isSavingPassword = true;
		try {
			if (hasPassword) {
				const { error } = await authClient.changePassword({
					currentPassword,
					newPassword,
					revokeOtherSessions: true
				});

				if (error) {
					toast.error(error.message || 'Failed to update password');
				} else {
					toast.success('Password updated successfully!');
					currentPassword = '';
					newPassword = '';
					confirmPassword = '';
				}
			} else {
				const res = await api.setPassword(newPassword);
				if (res.success) {
					toast.success('Password set successfully! You can now sign in with email and password.');
					hasPassword = true;
					newPassword = '';
					confirmPassword = '';
				}
			}
		} catch (err) {
			console.error('Password operation failed:', err);
			toast.error(`Operation failed: ${(err as Error).message}`);
		} finally {
			isSavingPassword = false;
		}
	}

	async function copyToClipboard(text: string, type: 'token' | 'config') {
		try {
			await navigator.clipboard.writeText(text);
			if (type === 'token') {
				copiedToken = true;
				setTimeout(() => (copiedToken = false), 2000);
			} else {
				copiedConfig = true;
				setTimeout(() => (copiedConfig = false), 2000);
			}
			toast.success('Copied to clipboard!');
		} catch {
			toast.error('Failed to copy to clipboard');
		}
	}

	const sampleConfig = `{
  "mcpServers": {
    "showtodo": {
      "url": "https://showtodo.com/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY_HERE"
      }
    }
  }
}`;
</script>

<SeoHead seo={getSettingsSeo()} />

<div class="w-full max-w-2xl mx-auto space-y-8 pb-12">
	<BreadcrumbNav
		backHref="/"
		backLabel="Back to Feed"
		crumbs={[
			{ label: 'Feed', href: '/' },
			{ label: 'Settings' }
		]}
	/>

	<!-- 模块 1: AI & MCP 开放接口 -->
	<div class="p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-xs space-y-6">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
			<div class="space-y-1">
				<div class="flex items-center gap-2">
					<div class="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
						<Icon icon="lucide:sparkles" class="h-4 w-4" />
					</div>
					<h2 class="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
						AI & Model Context Protocol (MCP)
					</h2>
				</div>
				<p class="text-xs text-zinc-500 dark:text-zinc-400">
					Connect Claude, Cursor, or AI agents to manage your todos via standard HTTP/SSE endpoint.
				</p>
			</div>

			<Button
				variant="secondary"
				size="sm"
				class="shrink-0"
				onclick={() => (showCreateModal = true)}
			>
				<Icon icon="lucide:plus" class="h-4 w-4 mr-1.5" />
				New API Key
			</Button>
		</div>

		<!-- 刚刚生成的新 Token 高亮单次提示卡片 -->
		{#if newlyCreatedToken}
			<div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-1.5 font-semibold text-xs text-amber-700 dark:text-amber-300">
						<Icon icon="lucide:alert-triangle" class="h-4 w-4" />
						<span>Save your API Key now</span>
					</div>
					<button
						type="button"
						onclick={() => (newlyCreatedToken = null)}
						class="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
					>
						Dismiss
					</button>
				</div>
				<p class="text-xs text-zinc-600 dark:text-zinc-400">
					For security, this token is only shown once. Copy and store it in your AI client configuration.
				</p>
				<div class="flex items-center gap-2 pt-1">
					<code class="flex-1 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs text-zinc-800 dark:text-zinc-200 select-all truncate">
						{newlyCreatedToken}
					</code>
					<Button
						variant="primary"
						size="sm"
						onclick={() => copyToClipboard(newlyCreatedToken!, 'token')}
					>
						{#if copiedToken}
							<Icon icon="lucide:check" class="h-3.5 w-3.5 mr-1" />
							Copied
						{:else}
							<Icon icon="lucide:copy" class="h-3.5 w-3.5 mr-1" />
							Copy
						{/if}
					</Button>
				</div>
			</div>
		{/if}

		<!-- 创建 API Key 对话框 -->
		{#if showCreateModal}
			<form
				method="POST"
				action="?/createApiKey"
				use:enhance={() => {
					isCreatingKey = true;
					return async ({ update }) => {
						isCreatingKey = false;
						await update();
					};
				}}
				class="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 space-y-4"
			>
				<div class="space-y-1">
					<h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Create new API Key</h3>
					<p class="text-xs text-zinc-500 dark:text-zinc-400">
						Assign a label for the client or device using this token (e.g. "Cursor - MacBook").
					</p>
				</div>

				<Input
					size="sm"
					label="Key Label / Device Name"
					placeholder="e.g. Cursor Pro, Claude Desktop"
					name="name"
					bind:value={newKeyName}
					required
				/>

				<div class="flex items-center justify-end gap-2 pt-2">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onclick={() => (showCreateModal = false)}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="primary"
						size="sm"
						loading={isCreatingKey}
						disabled={isCreatingKey || !newKeyName.trim()}
					>
						Generate Key
					</Button>
				</div>
			</form>
		{/if}

		<!-- 1:N API Key 列表 -->
		<div class="space-y-3">
			<h3 class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
				Active API Keys ({data.apiKeys?.length ?? 0})
			</h3>

			{#if !data.apiKeys || data.apiKeys.length === 0}
				<div class="p-6 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-2">
					<Icon icon="lucide:key" class="h-6 w-6 mx-auto text-zinc-400" />
					<p class="text-xs text-zinc-500 dark:text-zinc-400">
						No active API keys yet. Create one above to connect your AI assistant.
					</p>
				</div>
			{:else}
				<div class="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 overflow-hidden">
					{#each data.apiKeys as key (key.id)}
						<div class="p-4 flex items-center justify-between gap-4">
							<div class="space-y-1 min-w-0">
								<div class="flex items-center gap-2">
									<span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
										{key.name}
									</span>
									<span class="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
										{key.prefix}
									</span>
								</div>
								<div class="flex items-center gap-3 text-[11px] text-zinc-400 dark:text-zinc-500">
									<span>Created {formatRelativeTime(key.createdAt)}</span>
									<span>•</span>
									<span>
										Last active: {key.lastUsedAt ? formatRelativeTime(key.lastUsedAt) : 'Never used'}
									</span>
								</div>
							</div>

							<form
								method="POST"
								action="?/revokeApiKey"
								use:enhance={({ cancel }) => {
									if (!confirm(`Are you sure you want to revoke key "${key.name}"?`)) {
										cancel();
									}
								}}
							>
								<input type="hidden" name="id" value={key.id} />
								<Button
									type="submit"
									variant="ghost"
									size="sm"
									class="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs"
								>
									Revoke
								</Button>
							</form>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- 渐进式呈现：展开接入指引 -->
		<div class="pt-2 border-t border-zinc-100 dark:border-zinc-800">
			<button
				type="button"
				onclick={() => (showGuide = !showGuide)}
				class="flex items-center justify-between w-full text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 py-1"
			>
				<span class="flex items-center gap-1.5">
					<Icon icon="lucide:book-open" class="h-3.5 w-3.5" />
					<span>How to configure in Cursor / Claude Desktop</span>
				</span>
				<Icon
					icon="lucide:chevron-down"
					class="h-4 w-4 transition-transform duration-200 {showGuide ? 'rotate-180' : ''}"
				/>
			</button>

			{#if showGuide}
				<div class="mt-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/50 space-y-3">
					<p class="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
						Add ShowTodo as a remote MCP server in your client settings (e.g. Cursor <code class="px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-700 text-[11px]">Settings &gt; Features &gt; MCP</code>):
					</p>

					<div class="relative">
						<pre class="p-3 rounded-xl bg-zinc-900 text-zinc-100 font-mono text-[11px] overflow-x-auto leading-relaxed">{sampleConfig}</pre>
						<button
							type="button"
							onclick={() => copyToClipboard(sampleConfig, 'config')}
							class="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-medium transition-colors flex items-center gap-1"
						>
							{#if copiedConfig}
								<Icon icon="lucide:check" class="h-3 w-3" />
								<span>Copied</span>
							{:else}
								<Icon icon="lucide:copy" class="h-3 w-3" />
								<span>Copy JSON</span>
							{/if}
						</button>
					</div>

					<p class="text-[11px] text-zinc-500 dark:text-zinc-400">
						Available capabilities include creating todos, listing personal tasks, logging progress milestones, discovering public peer topics, and cheering companions.
					</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- 模块 2: 密码与安全性 -->
	<div class="p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-xs space-y-6">
		<div class="space-y-1 pb-4 border-b border-zinc-100 dark:border-zinc-800">
			<div class="flex items-center gap-2">
				<div class="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
					<Icon icon="lucide:key-round" class="h-4 w-4" />
				</div>
				<h1 class="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
					{hasPassword ? 'Change Password' : 'Create Password'}
				</h1>
			</div>
			<p class="text-xs text-zinc-500 dark:text-zinc-400 pt-1">
				{hasPassword
					? 'Update your password to keep your account secure.'
					: 'Create a password to enable email & password sign-in for your account.'}
			</p>
		</div>

		<form onsubmit={handlePasswordSubmit} class="space-y-4">
			{#if hasPassword}
				<Input
					size="md"
					type="password"
					label="Current Password"
					placeholder="Enter current password"
					bind:value={currentPassword}
					required
				/>
			{/if}

			<Input
				size="md"
				type="password"
				label={hasPassword ? 'New Password' : 'Password'}
				placeholder="At least 8 characters"
				bind:value={newPassword}
				required
				helperText="Minimum 8 characters"
			/>

			<Input
				size="md"
				type="password"
				label="Confirm New Password"
				placeholder="Re-enter new password"
				bind:value={confirmPassword}
				required
			/>

			<div class="pt-2">
				<Button
					type="submit"
					variant="primary"
					size="sm"
					class="w-full"
					loading={isSavingPassword}
					disabled={isSavingPassword || !newPassword || !confirmPassword || (hasPassword && !currentPassword)}
				>
					{hasPassword ? 'Update Password' : 'Set Password'}
				</Button>
			</div>
		</form>
	</div>
</div>
