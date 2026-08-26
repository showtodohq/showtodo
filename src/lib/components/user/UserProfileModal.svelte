<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { api } from '$lib/services/api';
	import { toast } from '$lib/stores/toast.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import type { UserProfile } from '$lib/types/user';
	import Avatar from '$lib/components/common/Avatar.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		isOpen: boolean;
		currentUser?: UserProfile | null;
		onClose: () => void;
	}

	let { isOpen, currentUser, onClose }: Props = $props();

	let nickname = $state('');
	let handle = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (isOpen) {
			const source = currentUser || userStore.current;
			nickname = source?.nickname || userStore.nickname || '';
			handle = source?.handle || userStore.handle || '';
		}
	});

	async function handleSave(e: SubmitEvent) {
		e.preventDefault();
		const email = userStore.email;
		if (!email) {
			toast.error('未找到当前邮箱');
			return;
		}

		if (!nickname.trim()) {
			toast.warning('昵称不能为空');
			return;
		}

		const cleanHandle = handle.trim().toLowerCase().replace(/^@/, '');
		if (!cleanHandle) {
			toast.warning('用户名 Handle 不能为空');
			return;
		}

		isSubmitting = true;
		try {
			const targetId = userStore.id || userStore.handle || email;
			const oldHandle = userStore.handle;

			const res = await api.updateUser(targetId, {
				email,
				nickname: nickname.trim(),
				handle: cleanHandle
			});

			userStore.updateUserFromProfile(res.user);
			toast.success('已保存');
			onClose();

			// 如果当前 URL 是 /@oldHandle 或在其子页面下，且 handle 发生了变更，自动重定向到新的路由
			const currentPath = page.url.pathname;
			if (oldHandle && oldHandle !== res.user.handle) {
				if (currentPath.startsWith(`/@${oldHandle}`)) {
					const newPath = currentPath.replace(`/@${oldHandle}`, `/@${res.user.handle}`);
					goto(newPath, { replaceState: true });
				}
			}
		} catch (error: any) {
			toast.error(error.message || '保存失败');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Modal {isOpen} title="个人资料" maxWidth="sm" {onClose}>
	<form onsubmit={handleSave} class="space-y-4">
		<!-- Avatar Preview (Automatically generated based on nickname) -->
		<div class="flex items-center gap-3.5 pb-2">
			<Avatar seed={nickname || userStore.nickname} size="lg" />
			<div class="space-y-0.5">
				<p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{nickname || '用户'}</p>
				<p class="text-[11px] text-zinc-400 font-mono">
					@{handle.trim().toLowerCase().replace(/^@/, '') || 'handle'}
				</p>
			</div>
		</div>

		<!-- Nickname -->
		<div>
			<label for="profile-nickname" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
				昵称 <span class="text-rose-500">*</span>
			</label>
			<input
				id="profile-nickname"
				type="text"
				bind:value={nickname}
				required
				maxlength={50}
				class="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
			/>
		</div>

		<!-- Handle / Username -->
		<div>
			<label for="profile-handle" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
				用户名 Handle <span class="text-rose-500">*</span>
			</label>
			<div class="relative flex items-center">
				<span class="absolute left-3 text-xs text-zinc-400 font-mono">@</span>
				<input
					id="profile-handle"
					type="text"
					bind:value={handle}
					required
					pattern="[a-zA-Z0-9_-]+"
					maxlength={40}
					placeholder="handle"
					class="w-full pl-7 pr-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
				/>
			</div>
			<p class="text-[10px] text-zinc-400 mt-1 font-mono">
				专属主页：/@{handle.trim().toLowerCase().replace(/^@/, '') || 'handle'}
			</p>
		</div>

		<!-- Actions -->
		<div class="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
			<button
				type="button"
				onclick={onClose}
				class="px-3.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
			>
				取消
			</button>
			<button
				type="submit"
				disabled={isSubmitting}
				class="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg shadow-xs hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 cursor-pointer"
			>
				{#if isSubmitting}
					<Icon icon="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
					<span>保存中...</span>
				{:else}
					<span>保存</span>
				{/if}
			</button>
		</div>
	</form>
</Modal>
