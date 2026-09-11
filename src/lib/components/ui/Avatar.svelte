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
		goldBadge?: boolean;
	}

	let {
		src,
		name = 'User',
		alt = name,
		size = 'md',
		class: className = '',
		status,
		goldBadge = false
	}: Props = $props();

	let isLoaded = $state(false);
	let hasError = $state(false);

	const sizeClasses: Record<ComponentSize | 'xl', { box: string; text: string; dot: string; badge: string; icon: string }> = {
		xs: { box: 'h-6 w-6', text: 'text-[10px]', dot: 'h-1.5 w-1.5', badge: 'h-3 w-3 -top-1 -right-1', icon: 'h-2 w-2' },
		sm: { box: 'h-8 w-8', text: 'text-xs', dot: 'h-2 w-2', badge: 'h-3.5 w-3.5 -top-1 -right-1', icon: 'h-2.5 w-2.5' },
		md: { box: 'h-10 w-10', text: 'text-sm', dot: 'h-2.5 w-2.5', badge: 'h-4 w-4 -top-1 -right-1', icon: 'h-2.5 w-2.5' },
		lg: { box: 'h-12 w-12', text: 'text-base', dot: 'h-3 w-3', badge: 'h-4.5 w-4.5 -top-1 -right-1', icon: 'h-3 w-3' },
		xl: { box: 'h-16 w-16', text: 'text-xl', dot: 'h-3.5 w-3.5', badge: 'h-5 w-5 -top-1.5 -right-1.5', icon: 'h-3.5 w-3.5' }
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
		'relative inline-flex items-center justify-center rounded-full select-none shrink-0',
		sizeClasses[size]?.box || 'h-10 w-10',
		className
	)}
>
	<!-- 头像圆形主体 -->
	<div
		class={cn(
			'relative flex h-full w-full items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 border overflow-hidden transition-all duration-200',
			goldBadge
				? 'border-amber-400 dark:border-amber-400/80 ring-2 ring-amber-400/80 dark:ring-amber-400/90 shadow-[0_0_8px_rgba(245,158,11,0.45)]'
				: 'border-zinc-200 dark:border-zinc-700'
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
	</div>

	<!-- 在线状态点 -->
	{#if status}
		<span
			class={cn(
				'absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-zinc-900',
				sizeClasses[size]?.dot || 'h-2 w-2',
				statusClasses[status]
			)}
		></span>
	{/if}

	<!-- 金色成就勋章 Badge -->
	{#if goldBadge}
		<span
			class={cn(
				'absolute z-10 flex items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-amber-950 shadow-xs ring-1.5 ring-white dark:ring-zinc-950 animate-in zoom-in-75 duration-200',
				sizeClasses[size]?.badge || 'h-3.5 w-3.5 -top-1 -right-1'
			)}
			title="全员完成金色荣誉徽章"
		>
			<svg
				class={cn('shrink-0 fill-current', sizeClasses[size]?.icon || 'h-2 w-2')}
				viewBox="0 0 20 20"
			>
				<path
					d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
				/>
			</svg>
		</span>
	{/if}
</div>

