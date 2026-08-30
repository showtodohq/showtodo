<script lang="ts">
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { toast } from '$lib/stores/toast.svelte';

	import { api } from '$lib/services/api';

	interface Props {
		open?: boolean;
		onclose?: () => void;
	}

	let { open = $bindable(false), onclose }: Props = $props();

	let emailInput = $state('');
	let isChangingEmail = $state(false);
	let saving = $state(false);

	function handleClose() {
		open = false;
		isChangingEmail = false;
		if (onclose) onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') {
			handleClose();
		}
	}

	async function handleSaveUser(e: SubmitEvent) {
		e.preventDefault();
		const clean = emailInput.trim().toLowerCase();
		if (!clean) return;

		// 简单的邮箱格式校验
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(clean)) {
			toast.error('请输入有效的电子邮箱地址');
			return;
		}

		saving = true;
		try {
			// 与服务端同步用户档案 (获取/创建真实 UUID id, DiceBear avatar, nickname, handle)
			const res = await api.syncUser(clean);
			if (res.user) {
				userStore.updateUserFromProfile(res.user);
				toast.success(`欢迎回来，${res.user.nickname}！`);
			}
			emailInput = '';
			isChangingEmail = false;
			open = false;
		} catch (err) {
			console.error('Failed to sync user with server:', err);
			toast.error(`同步用户失败: ${(err as Error).message}`);
		} finally {
			saving = false;
		}
	}

	function handleLogout() {
		userStore.clearSession();
		toast.info('已退出当前身份');
		isChangingEmail = false;
		open = false;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- 遮罩背景 -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		class="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
		onclick={handleClose}
	>
		<!-- 侧边抽屉本体 -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<aside
			onclick={(e) => e.stopPropagation()}
			class="fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 p-6 shadow-2xl transition-transform duration-200 animate-in slide-in-from-right"
		>
			<!-- 顶部标题与关闭按钮 -->
			<div class="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
				<h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">个人与偏好设置</h3>
				<button
					type="button"
					onclick={handleClose}
					class="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
					aria-label="Close drawer"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- 用户身份区 -->
			<div class="my-5">
				{#if userStore.current && !isChangingEmail}
					<!-- 已设置身份状态 -->
					<div class="flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
						<Avatar src={userStore.avatar} name={userStore.nickname} size="md" />
						<div class="min-w-0 flex-1 text-left">
							<div class="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
								{userStore.nickname}
							</div>
							<div class="text-[11px] text-zinc-400 font-mono truncate">
								{userStore.email}
							</div>
						</div>
					</div>

					<div class="mt-3 flex gap-2">
						<Button
							size="xs"
							variant="outline"
							class="flex-1"
							onclick={() => {
								emailInput = userStore.email || '';
								isChangingEmail = true;
							}}
						>
							更换邮箱
						</Button>
						<Button
							size="xs"
							variant="ghost"
							class="text-red-600 hover:text-red-700 dark:text-red-400"
							onclick={handleLogout}
						>
							退出
						</Button>
					</div>
				{:else}
					<!-- 未设置身份或正在更换身份 -->
					<div class="space-y-3 text-left">
						<div>
							<h4 class="text-xs font-bold text-zinc-800 dark:text-zinc-200">
								{isChangingEmail ? '更换身份邮箱' : '设置您的发布身份'}
							</h4>
							<p class="text-[11px] text-zinc-400 mt-0.5">
								输入邮箱即可自动关联您的公开待办与互动。
							</p>
						</div>

						<form onsubmit={handleSaveUser} class="space-y-2">
							<Input
								size="sm"
								type="email"
								placeholder="yourname@example.com"
								bind:value={emailInput}
								required
							/>
							<div class="flex gap-2">
								{#if isChangingEmail}
									<Button
										type="button"
										size="xs"
										variant="secondary"
										onclick={() => (isChangingEmail = false)}
									>
										取消
									</Button>
								{/if}
								<Button
									type="submit"
									size="xs"
									variant="primary"
									class="flex-1"
									loading={saving}
									disabled={saving || !emailInput.trim()}
								>
									确认保存
								</Button>
							</div>
						</form>
					</div>
				{/if}
			</div>

			<!-- 主题偏好设置 -->
			<div class="mt-auto border-t border-zinc-100 dark:border-zinc-800/80 pt-4 text-left">
				<div class="mb-2 flex items-center justify-between text-xs text-zinc-500">
					<span>外观偏好</span>
					<span class="font-mono text-[11px] uppercase">{theme.mode}</span>
				</div>
				<div class="grid grid-cols-3 gap-1.5">
					<Button
						size="xs"
						variant={theme.mode === 'light' ? 'primary' : 'secondary'}
						onclick={() => theme.setMode('light')}
					>
						浅色
					</Button>
					<Button
						size="xs"
						variant={theme.mode === 'dark' ? 'primary' : 'secondary'}
						onclick={() => theme.setMode('dark')}
					>
						深色
					</Button>
					<Button
						size="xs"
						variant={theme.mode === 'system' ? 'primary' : 'secondary'}
						onclick={() => theme.setMode('system')}
					>
						跟随系统
					</Button>
				</div>
			</div>
		</aside>
	</div>
{/if}
