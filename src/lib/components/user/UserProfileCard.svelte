<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { UserProfile } from '$lib/types/user';
	import { toast } from '$lib/stores/toast.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

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
	let isSaving = $state(false);

	$effect(() => {
		editNickname = user.nickname;
		editHandle = user.handle;
		editAvatar = user.avatar || '';
	});

	async function handleSave(e: SubmitEvent) {
		e.preventDefault();
		if (!editNickname.trim() || !editHandle.trim()) return;

		isSaving = true;
		try {
			await onsaveprofile?.({
				nickname: editNickname.trim(),
				handle: editHandle.trim(),
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

<div
	class="p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-xs"
>
	<div class="flex items-start justify-between gap-4 flex-wrap">
		<div class="flex items-center gap-4">
			<Avatar src={user.avatar} alt={user.nickname} size="lg" />
			<div class="space-y-1">
				<div class="flex items-center gap-2">
					<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
						{user.nickname}
					</h1>
					{#if isMe}
						<span
							class="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium"
						>
							本人主页
						</span>
					{/if}
				</div>

				<div class="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
					<button
						type="button"
						onclick={copyHandle}
						class="font-mono text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline cursor-pointer"
						title="点击复制用户名"
					>
						@{user.handle}
					</button>
					<span>·</span>
					<span>加入于 {user.createdAt ? user.createdAt.slice(0, 10) : '未知'}</span>
				</div>
			</div>
		</div>

		{#if isMe && !isEditing}
			<Button variant="outline" size="xs" onclick={() => (isEditing = true)}>
				编辑资料
			</Button>
		{/if}
	</div>

	<!-- 编辑资料表单 -->
	{#if isEditing}
		<form
			onsubmit={handleSave}
			class="mt-6 pt-6 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-4 max-w-md animate-in fade-in duration-150"
		>
			<div class="space-y-3">
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
				<Button type="submit" variant="primary" size="xs" loading={isSaving}>
					保存修改
				</Button>
			</div>
		</form>
	{/if}

	<!-- 统计指标网格插槽或展示 -->
	{@render children?.()}
</div>
