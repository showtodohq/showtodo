<script lang="ts">
	import { api } from '$lib/services/api';
	import { toast } from '$lib/stores/toast.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import Avatar from '$lib/components/common/Avatar.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	let nickname = $state('');
	let handle = $state('');
	let avatar = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (isOpen) {
			nickname = userStore.nickname || '';
			handle = userStore.handle || '';
			avatar = userStore.avatar || '';
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

			const res = await api.updateUser(targetId, {
				email,
				nickname: nickname.trim(),
				handle: cleanHandle,
				avatar: avatar.trim() ? avatar.trim() : null
			});

			userStore.updateUserFromProfile(res.user);
			toast.success('个人资料已保存！');
			onClose();
		} catch (error: any) {
			toast.error(error.message || '更新个人资料失败');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Modal {isOpen} title="编辑个人资料" maxWidth="sm" {onClose}>
	<form onsubmit={handleSave} class="space-y-4">
		<!-- Avatar Preview -->
		<div class="flex items-center gap-3.5 pb-2">
			<Avatar avatar={avatar.trim() || null} seed={nickname || userStore.nickname} size="lg" />
			<div class="space-y-1">
				<p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">头像预览</p>
				<p class="text-[11px] text-zinc-400">
					留空将自动根据昵称生成个性化 DiceBear 头像
				</p>
			</div>
		</div>

		<!-- Nickname -->
		<div>
			<label for="profile-nickname" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
				显示昵称 <span class="text-rose-500">*</span>
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
				个性化 Handle (主页唯一标识) <span class="text-rose-500">*</span>
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
					placeholder="your-unique-handle"
					class="w-full pl-7 pr-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
				/>
			</div>
			<p class="text-[10px] text-zinc-400 mt-1">
				用于您的专属主页链接：/@{handle.trim().toLowerCase().replace(/^@/, '') || 'handle'}
			</p>
		</div>

		<!-- Custom Avatar URL -->
		<div>
			<label for="profile-avatar" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
				自定义头像图片链接 (可选)
			</label>
			<input
				id="profile-avatar"
				type="url"
				bind:value={avatar}
				placeholder="https://images.unsplash.com/..."
				class="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
			/>
		</div>

		<!-- Actions -->
		<div class="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
			<button
				type="button"
				onclick={onClose}
				class="px-3.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
			>
				取消
			</button>
			<button
				type="submit"
				disabled={isSubmitting}
				class="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg shadow-xs hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
			>
				{#if isSubmitting}
					<Icon icon="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
					<span>保存中...</span>
				{:else}
					<span>保存修改</span>
				{/if}
			</button>
		</div>
	</form>
</Modal>
