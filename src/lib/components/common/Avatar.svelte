<script lang="ts">
	import { getAvatarUrl } from '$lib/services/avatar';

	interface Props {
		avatar?: string | null;
		seed?: string | null;
		alt?: string;
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		class?: string;
	}

	let {
		avatar = null,
		seed = 'explorer',
		alt = 'Avatar',
		size = 'md',
		class: className = ''
	}: Props = $props();

	const sizeClasses = {
		xs: 'w-5 h-5 text-[10px]',
		sm: 'w-7 h-7 text-xs',
		md: 'w-9 h-9 text-sm',
		lg: 'w-12 h-12 text-base',
		xl: 'w-16 h-16 text-lg'
	};

	let imgUrl = $derived(getAvatarUrl(avatar, seed, 120));
	let hasError = $state(false);
</script>

<div
	class="relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-200/80 dark:ring-zinc-700/80 {sizeClasses[
		size
	]} {className}"
>
	{#if !hasError}
		<img
			src={imgUrl}
			{alt}
			class="w-full h-full object-cover"
			loading="lazy"
			onerror={() => (hasError = true)}
		/>
	{:else}
		<span class="font-medium text-zinc-500 uppercase">
			{(seed || 'U').slice(0, 1)}
		</span>
	{/if}
</div>
