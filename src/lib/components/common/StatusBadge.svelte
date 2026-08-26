<script lang="ts">
	import { getStatusConfig } from '$lib/constants/status';
	import type { TodoStatus } from '$lib/types/todo';
	import Icon from '@iconify/svelte';

	interface Props {
		status: TodoStatus | string;
		size?: 'sm' | 'md';
		showIcon?: boolean;
		class?: string;
	}

	let { status, size = 'sm', showIcon = true, class: className = '' }: Props = $props();

	let config = $derived(getStatusConfig(status));
</script>

<span
	class="inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors {config.bgClass} {config.textClass} {config.borderClass} {size ===
	'sm'
		? 'px-2 py-0.5 text-xs'
		: 'px-2.5 py-1 text-sm'} {className}"
	title={config.description}
>
	{#if showIcon}
		<Icon icon={config.icon} class={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
	{:else}
		<span class="w-1.5 h-1.5 rounded-full {config.dotClass}"></span>
	{/if}
	<span>{config.label}</span>
</span>
