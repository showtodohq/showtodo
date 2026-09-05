<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		loading?: boolean;
		empty?: boolean;
		error?: string | null;
		skeleton?: Snippet;
		emptyView?: Snippet;
		errorView?: Snippet<[string]>;
		children?: Snippet;
	}

	let {
		loading = false,
		empty = false,
		error = null,
		skeleton,
		emptyView,
		errorView,
		children
	}: Props = $props();
</script>

{#if error}
	{#if errorView}
		{@render errorView(error)}
	{:else}
		<div
			class="p-8 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center space-y-2"
		>
			<div class="text-sm font-semibold text-red-600 dark:text-red-400">{error}</div>
		</div>
	{/if}
{:else if loading && empty}
	{@render skeleton?.()}
{:else if empty}
	{@render emptyView?.()}
{:else}
	{@render children?.()}
{/if}
