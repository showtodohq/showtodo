<script lang="ts">
	import type { ComponentSize } from '$lib/types/common';
	import { cn } from '$lib/utils/cn';

	interface Props {
		src?: string | null;
		name?: string;
		alt?: string;
		size?: ComponentSize | 'xl';
		class?: string;
		status?: 'online' | 'busy' | 'offline';
	}

	let {
		src,
		name = 'User',
		alt = name,
		size = 'md',
		class: className = '',
		status
	}: Props = $props();

	let imgError = $state(false);

	const sizeClasses: Record<ComponentSize | 'xl', { box: string; text: string; dot: string }> = {
		xs: { box: 'h-6 w-6', text: 'text-[10px]', dot: 'h-1.5 w-1.5' },
		sm: { box: 'h-8 w-8', text: 'text-xs', dot: 'h-2 w-2' },
		md: { box: 'h-10 w-10', text: 'text-sm', dot: 'h-2.5 w-2.5' },
		lg: { box: 'h-12 w-12', text: 'text-base', dot: 'h-3 w-3' },
		xl: { box: 'h-16 w-16', text: 'text-xl', dot: 'h-3.5 w-3.5' }
	};

	const statusClasses = {
		online: 'bg-emerald-500',
		busy: 'bg-amber-500',
		offline: 'bg-zinc-400'
	};

	// 获取 DiceBear 头像 URL
	function getDiceBearUrl(seed: string): string {
		const safeSeed = encodeURIComponent(seed.toLowerCase().trim() || 'user');
		return `https://api.dicebear.com/7.x/notionists/svg?seed=${safeSeed}&backgroundColor=f4f4f5,e4e4e7,d4d4d8`;
	}

	const fallbackInitials = $derived(
		name
			.trim()
			.split(' ')
			.map((part) => part[0])
			.slice(0, 2)
			.join('')
			.toUpperCase() || 'U'
	);

	const resolvedSrc = $derived(
		src && src.trim().length > 0
			? src
			: getDiceBearUrl(name)
	);
</script>

<div
	class={cn(
		'relative inline-flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 select-none shrink-0 overflow-hidden',
		sizeClasses[size].box,
		className
	)}
>
	{#if resolvedSrc && !imgError}
		<img
			src={resolvedSrc}
			{alt}
			class="h-full w-full object-cover rounded-full"
			onerror={() => {
				imgError = true;
			}}
		/>
	{:else}
		<span class={cn('font-semibold text-zinc-600 dark:text-zinc-300', sizeClasses[size].text)}>
			{fallbackInitials}
		</span>
	{/if}

	{#if status}
		<span
			class={cn(
				'absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-zinc-900',
				sizeClasses[size].dot,
				statusClasses[status]
			)}
		></span>
	{/if}
</div>
