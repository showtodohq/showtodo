<script lang="ts">
	import type { ComponentSize } from '$lib/types/common';
	import { cn } from '$lib/utils/cn';
	import { getAvatarUrl } from '$lib/services/avatar';

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

	let isLoaded = $state(false);
	let hasError = $state(false);

	const sizeClasses: Record<ComponentSize | 'xl', { box: string; text: string; dot: string }> = {
		xs: { box: 'h-6 w-6', text: 'text-[10px]', dot: 'h-1.5 w-1.5' },
		sm: { box: 'h-8 w-8', text: 'text-xs', dot: 'h-2 w-2' },
		md: { box: 'h-10 w-10', text: 'text-sm', dot: 'h-2.5 w-2.5' },
		lg: { box: 'h-12 w-12', text: 'text-base', dot: 'h-3 w-3' },
		xl: { box: 'h-16 w-16', text: 'text-xl', dot: 'h-3.5 w-3.5' }
	};

	const sizePixels: Record<ComponentSize | 'xl', number> = {
		xs: 24,
		sm: 32,
		md: 40,
		lg: 48,
		xl: 64
	};

	const statusClasses = {
		online: 'bg-emerald-500',
		busy: 'bg-amber-500',
		offline: 'bg-zinc-400'
	};

	const fallbackInitials = $derived(
		(name || 'U')
			.trim()
			.split(' ')
			.map((part) => part[0])
			.slice(0, 2)
			.join('')
			.toUpperCase() || 'U'
	);

	const resolvedSrc = $derived(
		getAvatarUrl(src, name, sizePixels[size] || 40)
	);

	// 当 resolvedSrc 改变时，重置状态以便重新加载新头像
	$effect(() => {
		if (resolvedSrc) {
			hasError = false;
			isLoaded = false;
		}
	});
</script>

<div
	class={cn(
		'relative inline-flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 select-none shrink-0 overflow-hidden',
		sizeClasses[size]?.box || 'h-10 w-10',
		className
	)}
>
	<!-- 底层 Fallback 占位首字母（图片加载中或加载失败时可见） -->
	<span class={cn('font-semibold text-zinc-600 dark:text-zinc-300', sizeClasses[size]?.text || 'text-sm')}>
		{fallbackInitials}
	</span>

	<!-- 上层实际头像图片 -->
	{#if resolvedSrc && !hasError}
		<img
			src={resolvedSrc}
			{alt}
			class={cn(
				'absolute inset-0 h-full w-full object-cover rounded-full transition-opacity duration-150',
				isLoaded ? 'opacity-100' : 'opacity-0'
			)}
			onload={() => {
				isLoaded = true;
				hasError = false;
			}}
			onerror={() => {
				hasError = true;
				isLoaded = false;
			}}
		/>
	{/if}

	{#if status}
		<span
			class={cn(
				'absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-zinc-900',
				sizeClasses[size]?.dot || 'h-2 w-2',
				statusClasses[status]
			)}
		></span>
	{/if}
</div>

