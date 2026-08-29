<script lang="ts">
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		open?: boolean;
		onclose?: () => void;
	}

	let { open = $bindable(false), onclose }: Props = $props();

	let emailInput = $state('');

	function handleClose() {
		open = false;
		if (onclose) onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') {
			handleClose();
		}
	}

	function handleSwitchUser(e: SubmitEvent) {
		e.preventDefault();
		const clean = emailInput.trim().toLowerCase();
		if (!clean) return;

		userStore.setSession({
			email: clean,
			nickname: clean.split('@')[0],
			handle: clean.split('@')[0].replace(/[^a-z0-9-_]/gi, '').toLowerCase() || 'user'
		});
		toast.success(`已切换为: ${clean.split('@')[0]}`);
		emailInput = '';
	}

	const PRESET_USERS = [
		{ email: 'alex@example.com', name: 'Alex' },
		{ email: 'sarah@example.com', name: 'Sarah' },
		{ email: 'chen@example.com', name: '陈晨' }
	];
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
			<!-- 顶部关闭按钮 -->
			<div class="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
				<h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">设置与个人</h3>
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

			<!-- 用户身份卡片 -->
			<div class="my-5 flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
				<Avatar src={userStore.avatar} name={userStore.nickname} size="md" />
				<div class="overflow-hidden text-left">
					<div class="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
						{userStore.nickname}
					</div>
					<div class="text-[11px] text-zinc-400 font-mono truncate">
						{userStore.email || '未设置身份'}
					</div>
				</div>
			</div>

			<!-- 切换身份表单 -->
			<div class="space-y-3 text-left">
				<span class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
					免密身份切换
				</span>

				<form onsubmit={handleSwitchUser} class="space-y-2">
					<Input
						size="sm"
						type="email"
						placeholder="输入任意邮箱..."
						bind:value={emailInput}
					/>
					<Button type="submit" size="xs" variant="primary" class="w-full" disabled={!emailInput.trim()}>
						切换身份
					</Button>
				</form>

				<!-- 快捷预设 -->
				<div class="flex flex-wrap gap-1.5 pt-1">
					{#each PRESET_USERS as u}
						<button
							type="button"
							onclick={() => {
								userStore.setSession({ email: u.email, nickname: u.name, handle: u.email.split('@')[0] });
								toast.success(`已切换为: ${u.name}`);
							}}
							class={cn(
								'rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors',
								userStore.email === u.email
									? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
									: 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
							)}
						>
							{u.name}
						</button>
					{/each}
				</div>
			</div>

			<!-- 主题设置 -->
			<div class="mt-auto border-t border-zinc-100 dark:border-zinc-800/80 pt-4 text-left">
				<div class="mb-2 flex items-center justify-between text-xs text-zinc-500">
					<span>色彩模式</span>
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
						跟随
					</Button>
				</div>
			</div>
		</aside>
	</div>
{/if}
