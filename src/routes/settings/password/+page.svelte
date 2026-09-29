<script lang="ts">
	import type { PageData } from './$types';
	import { untrack } from 'svelte';
	import { api } from '$lib/services/api';
	import { authClient } from '$lib/auth-client';
	import { toast } from '$lib/stores/toast.svelte';
	import { getSettingsPasswordSeo } from '$lib/constants/seo';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Icon from '@iconify/svelte';

	let { data }: { data: PageData } = $props();

	let hasPassword = $state(untrack(() => data.hasPassword));
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let isSavingPassword = $state(false);

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
</script>

<SeoHead seo={getSettingsPasswordSeo()} />

<div class="space-y-6">
	<!-- 头部标题说明 (无边框无背景) -->
	<div class="space-y-1 pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
		<div class="flex items-center gap-2.5">
			<div class="p-2 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300">
				<Icon icon="lucide:key-round" class="h-4 w-4" />
			</div>
			<h2 class="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
				{hasPassword ? 'Change Password' : 'Create Password'}
			</h2>
		</div>
		<p class="text-xs text-zinc-500 dark:text-zinc-400 pt-1 leading-relaxed">
			{hasPassword
				? 'Update your password to keep your account secure. Other active sessions will be revoked.'
				: 'Create a password to enable email & password sign-in alongside third-party login providers.'}
		</p>
	</div>

	<!-- 密码表单 (无边框无背景) -->
	<form onsubmit={handlePasswordSubmit} class="space-y-4 max-w-lg">
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
				loading={isSavingPassword}
				disabled={isSavingPassword || !newPassword || !confirmPassword || (hasPassword && !currentPassword)}
				class="border-0 bg-zinc-900/90 text-white hover:bg-zinc-900 active:bg-zinc-950 dark:bg-zinc-100/90 dark:text-zinc-900 dark:hover:bg-zinc-100 shadow-none transition-all duration-200 ease-out active:scale-[0.98]"
			>
				{hasPassword ? 'Update Password' : 'Set Password'}
			</Button>
		</div>
	</form>
</div>
