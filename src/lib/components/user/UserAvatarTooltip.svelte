<script lang="ts">
	import type { ComponentSize } from '$lib/types/common';
	import { userStore } from '$lib/stores/user.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Icon from '@iconify/svelte';

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
		goldBadge?: boolean;
		class?: string;
	}

	let {
		user,
		size = 'sm',
		isStack = false,
		align = 'left',
		isMe: explicitIsMe,
		goldBadge = false,
		class: className = ''
	}: Props = $props();

	const isMe = $derived(
		explicitIsMe !== undefined
			? explicitIsMe
			: Boolean(
					(userStore.id && user?.id === userStore.id) ||
					(userStore.handle && user?.handle === userStore.handle)
				)
	);

	const nickname = $derived(user?.nickname || (isMe && userStore.email ? userStore.nickname : 'Anonymous'));
	const handle = $derived(user?.handle || (isMe && userStore.email ? userStore.handle : undefined));
	const avatar = $derived(user?.avatar ?? (isMe && userStore.email ? userStore.avatar : null));

	const profileUrl = $derived(
		handle ? `/users/${handle}` : (user?.id || (isMe ? userStore.id : null)) ? `/users/${user?.id || userStore.id}` : null
	);

	const alignClasses = {
		left: 'left-0 items-start',
		right: 'right-0 items-end',
		center: 'left-1/2 -translate-x-1/2 items-center'
	};
</script>

<div class="relative group/avatar inline-flex items-center shrink-0 {className}">
	{#if profileUrl}
		<a
			href={profileUrl}
			class="inline-flex rounded-full focus:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-400"
			onclick={(e) => e.stopPropagation()}
		>
			<Avatar
				src={avatar}
				name={nickname}
				{size}
				{goldBadge}
				class="cursor-pointer transition-all duration-150 {goldBadge
					? 'group-hover/avatar:scale-115 group-hover/avatar:z-20'
					: isStack
						? 'ring-1.5 ring-white dark:ring-zinc-900 group-hover/avatar:scale-115 group-hover/avatar:z-20 group-hover/avatar:ring-zinc-400 dark:group-hover/avatar:ring-zinc-600'
						: 'ring-1 ring-zinc-200/80 dark:ring-zinc-800 group-hover/avatar:scale-105'}"
			/>
		</a>
	{:else}
		<Avatar
			src={avatar}
			name={nickname}
			{size}
			{goldBadge}
			class="cursor-pointer transition-all duration-150 {goldBadge
				? 'group-hover/avatar:scale-115 group-hover/avatar:z-20'
				: isStack
					? 'ring-1.5 ring-white dark:ring-zinc-900 group-hover/avatar:scale-115 group-hover/avatar:z-20 group-hover/avatar:ring-zinc-400 dark:group-hover/avatar:ring-zinc-600'
					: 'ring-1 ring-zinc-200/80 dark:ring-zinc-800 group-hover/avatar:scale-105'}"
		/>
	{/if}

	<!-- Tooltip popup -->
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
				<span class="ml-1 text-[10px] text-amber-300 dark:text-amber-600 font-semibold">(You)</span>
			{/if}
			{#if goldBadge}
				<span class="inline-flex items-center gap-1 ml-1 text-[10px] text-amber-400 font-medium">
					<Icon icon="lucide:trophy" class="h-3 w-3 shrink-0" />
					<span>All Completed</span>
				</span>
			{/if}
		</div>
	</div>
</div>
