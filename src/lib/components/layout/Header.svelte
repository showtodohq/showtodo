<script lang="ts">
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import { userStore } from '$lib/stores/user.svelte';

	interface Props {
		onAvatarClick?: () => void;
	}

	let { onAvatarClick }: Props = $props();
</script>

<header class="sticky top-0 z-30 h-14 border-b border-zinc-200/80 bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors">
	<div class="mx-auto flex h-full max-w-3xl sm:max-w-4xl items-center justify-between px-4 sm:px-6">
		<!-- 左侧：品牌 Logo 与产品名称 -->
		<a href="/" class="flex items-center gap-2.5 group transition-opacity hover:opacity-90">
			<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-mono text-xs font-bold shadow-xs">
				PT
			</div>
			<span class="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
				ptdl-alpha
			</span>
		</a>

		<!-- 右侧：仅保留用户头像入口 -->
		<button
			type="button"
			onclick={onAvatarClick}
			class="flex items-center rounded-full ring-2 ring-transparent hover:ring-zinc-300 dark:hover:ring-zinc-700 transition-all cursor-pointer p-0.5"
			title="用户中心与设置"
			aria-label="User settings"
		>
			<Avatar
				src={userStore.avatar}
				name={userStore.nickname}
				size="sm"
			/>
		</button>
	</div>
</header>
