<script lang="ts">
	import { api } from '$lib/services/api';
	import { toast } from '$lib/stores/toast.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import Avatar from '$lib/components/common/Avatar.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import UserProfileModal from '$lib/components/user/UserProfileModal.svelte';
	import Icon from '@iconify/svelte';

	let isEmailModalOpen = $state(false);
	let isProfileModalOpen = $state(false);
	let isDropdownOpen = $state(false);
	let emailInput = $state('');

	let isSavingEmail = $state(false);

	export function openEmailModal() {
		emailInput = userStore.email || '';
		isEmailModalOpen = true;
	}

	async function handleSaveEmail(e: SubmitEvent) {
		e.preventDefault();
		const email = emailInput.trim().toLowerCase();
		if (!email || !email.includes('@')) {
			toast.error('请输入有效的邮箱地址');
			return;
		}

		isSavingEmail = true;
		try {
			const res = await api.syncUser(email);
			userStore.updateUserFromProfile(res.user);
			toast.success(`欢迎回来，@${res.user.handle}！`);
			isEmailModalOpen = false;
		} catch (error: any) {
			toast.error(error.message || '设置失败');
		} finally {
			isSavingEmail = false;
		}
	}

	function handleLogout() {
		userStore.clearSession();
		toast.info('已退出登录');
		isDropdownOpen = false;
	}
</script>

<div class="relative">
	{#if userStore.email}
		<!-- Logged In / Has Identity Pill -->
		<div class="flex items-center gap-1.5">
			<button
				type="button"
				onclick={() => (isDropdownOpen = !isDropdownOpen)}
				class="inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 transition-all cursor-pointer shadow-xs"
			>
				<Avatar
					avatar={userStore.avatar}
					seed={userStore.nickname}
					size="xs"
				/>
				<span class="text-xs font-medium text-zinc-800 dark:text-zinc-200 max-w-[120px] truncate">
					{userStore.nickname}
				</span>
				<Icon icon="lucide:chevron-down" class="w-3 h-3 text-zinc-400" />
			</button>
		</div>

		<!-- Dropdown Menu -->
		{#if isDropdownOpen}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="fixed inset-0 z-30"
				onclick={() => (isDropdownOpen = false)}
			></div>

			<div
				class="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1 z-40 text-xs text-zinc-700 dark:text-zinc-300 animate-in fade-in zoom-in-95 duration-150"
			>
				<div class="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
					<p class="font-medium truncate text-zinc-900 dark:text-zinc-100">{userStore.nickname}</p>
					<p class="text-[11px] text-zinc-400 font-mono truncate">@{userStore.handle}</p>
				</div>

				<button
					type="button"
					onclick={() => {
						isDropdownOpen = false;
						isProfileModalOpen = true;
					}}
					class="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
				>
					<Icon icon="lucide:settings" class="w-3.5 h-3.5 text-zinc-400" />
					<span>编辑资料</span>
				</button>

				<button
					type="button"
					onclick={() => {
						isDropdownOpen = false;
						openEmailModal();
					}}
					class="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
				>
					<Icon icon="lucide:refresh-cw" class="w-3.5 h-3.5 text-zinc-400" />
					<span>切换邮箱</span>
				</button>

				<div class="border-t border-zinc-100 dark:border-zinc-800 my-1"></div>

				<button
					type="button"
					onclick={handleLogout}
					class="w-full text-left flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
				>
					<Icon icon="lucide:log-out" class="w-3.5 h-3.5" />
					<span>退出登录</span>
				</button>
			</div>
		{/if}
	{:else}
		<!-- Guest Button -->
		<button
			type="button"
			onclick={openEmailModal}
			class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
		>
			<Icon icon="lucide:user" class="w-3.5 h-3.5 text-zinc-400" />
			<span>游客</span>
		</button>
	{/if}
</div>

<!-- Email Modal -->
<Modal
	isOpen={isEmailModalOpen}
	title="设置邮箱"
	maxWidth="sm"
	onClose={() => (isEmailModalOpen = false)}
>
	<form onsubmit={handleSaveEmail} class="space-y-4">
		<p class="text-xs text-zinc-500 leading-relaxed">
			请确保输入的邮箱是你的常用邮箱
		</p>
		<div>
			<label for="identity-email" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
				你的邮箱
			</label>
			<input
				id="identity-email"
				type="email"
				bind:value={emailInput}
				placeholder="name@example.com"
				required
				class="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
			/>
		</div>
		<div class="flex justify-end gap-2 pt-2">
			<button
				type="button"
				onclick={() => (isEmailModalOpen = false)}
				class="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
			>
				取消
			</button>
			<button
				type="submit"
				disabled={isSavingEmail}
				class="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg shadow-xs hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 cursor-pointer"
			>
				{#if isSavingEmail}
					<Icon icon="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
					<span>保存中...</span>
				{:else}
					<span>确定</span>
				{/if}
			</button>
		</div>
	</form>
</Modal>

<!-- User Profile Modal -->
<UserProfileModal
	isOpen={isProfileModalOpen}
	onClose={() => (isProfileModalOpen = false)}
/>
