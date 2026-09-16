<script lang="ts">
	import type { ComponentSize } from '$lib/types/common';
	import { cn } from '$lib/utils/cn';

	interface Props {
		size?: ComponentSize;
		class?: string;
	}

	let { size = 'md', class: className = '' }: Props = $props();

	const sizeClasses: Record<ComponentSize, string> = {
		xs: 'h-3 w-3 border-[1.5px]',
		sm: 'h-4 w-4 border-2',
		md: 'h-5 w-5 border-2',
		lg: 'h-8 w-8 border-[3px]'
	};
</script>

<div
	role="status"
	aria-label="Loading"
	class={cn(
		'inline-block animate-spin rounded-full border-current border-t-transparent text-zinc-900 dark:text-zinc-100',
		sizeClasses[size],
		className
	)}
>
	<span class="sr-only">Loading...</span>
</div>
