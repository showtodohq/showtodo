<script lang="ts">
	import type { PageData } from './$types';
	import { untrack } from 'svelte';
	import { api } from '$lib/services/api';
	import { authClient } from '$lib/auth-client';
	import { toast } from '$lib/stores/toast.svelte';
	import { getSettingsSeo } from '$lib/constants/seo';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import BreadcrumbNav from '$lib/components/ui/BreadcrumbNav.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Icon from '@iconify/svelte';

	let { data }: { data: PageData } = $props();

	let hasPassword = $state(untrack(() => data.hasPassword));
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let isSaving = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (newPassword.length < 8) {
			toast.error('New password must be at least 8 characters');
			return;
		}
		if (newPassword !== confirmPassword) {
			toast.error('Passwords do not match');
			return;
		}

		isSaving = true;
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
			isSaving = false;
		}
	}
</script>

<SeoHead seo={getSettingsSeo()} />

<div class="w-full max-w-lg mx-auto space-y-6">
	<BreadcrumbNav
		backHref="/"
		backLabel="Back to Feed"
		crumbs={[
			{ label: 'Feed', href: '/' },
			{ label: 'Password & Security' }
		]}
	/>

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

		<form onsubmit={handleSubmit} class="space-y-4">
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
					loading={isSaving}
					disabled={isSaving || !newPassword || !confirmPassword || (hasPassword && !currentPassword)}
				>
					{hasPassword ? 'Update Password' : 'Set Password'}
				</Button>
			</div>
		</form>
	</div>
</div>
