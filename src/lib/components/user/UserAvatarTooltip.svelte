<script lang="ts">
	import type { ComponentSize } from '$lib/types/common';
	import { userStore } from '$lib/stores/user.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';

	interface UserData {
		id?: string;
		nickname?: string;
		handle?: string;
		avatar?: string | null;
	}

	interface Props {
		user?: UserData | null;
		size?: ComponentSize | 'xl';
		isStack?: boolean;
		align?: 'left' | 'right' | 'center';
		isMe?: boolean;
		class?: string;
	}

	let {
		user,
		size = 'sm',
		isStack = false,
		align = 'left',
		isMe: explicitIsMe,
		class: className = ''
	}: Props = $props();

	const nickname = $derived(user?.nickname || '匿名待办者');
	const handle = $derived(user?.handle);
	const isMe = $derived(
		explicitIsMe !== undefined
			? explicitIsMe
			: Boolean(
					(userStore.id && user?.id === userStore.id) ||
					(userStore.handle && user?.handle === userStore.handle)
				)
	);

	const alignClasses = {
		left: 'left-0 items-start',
		right: 'right-0 items-end',
		center: 'left-1/2 -translate-x-1/2 items-center'
	};
</script>

<div class="relative group/avatar inline-flex items-center shrink-0 {className}">
	<Avatar
		src={user?.avatar}
		name={nickname}
		{size}
		class="cursor-pointer transition-all duration-150 {isStack
			? 'ring-1.5 ring-white dark:ring-zinc-900 group-hover/avatar:scale-115 group-hover/avatar:z-20 group-hover/avatar:ring-zinc-400 dark:group-hover/avatar:ring-zinc-600'
			: 'ring-1 ring-zinc-200/80 dark:ring-zinc-800 group-hover/avatar:scale-105'}"
	/>

	<!-- 悬停精致微型 Tooltip 气泡 (全站标准黑白反色胶囊) -->
	<div
		class="pointer-events-none absolute bottom-full mb-1.5 hidden group-hover/avatar:flex flex-col z-30 animate-in fade-in zoom-in-95 duration-100 {alignClasses[
			align
		]}"
	>
		<div
			class="rounded-md bg-zinc-900 px-2 py-1 text-[11px] text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900 whitespace-nowrap select-none"
		>
			<span class="font-semibold">{nickname}</span>
			{#if handle}
				<span class="opacity-60 text-[10px] ml-1 font-mono">@{handle}</span>
			{/if}
			{#if isMe}
				<span class="ml-1 text-[10px] text-amber-300 dark:text-amber-600 font-semibold">(我)</span>
			{/if}
		</div>
	</div>
</div>
