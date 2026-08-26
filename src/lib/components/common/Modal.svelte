<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		isOpen: boolean;
		title?: string;
		maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
		onClose: () => void;
		children?: Snippet;
		headerSnippet?: Snippet;
		footerSnippet?: Snippet;
	}

	let {
		isOpen,
		title = '',
		maxWidth = 'md',
		onClose,
		children,
		headerSnippet,
		footerSnippet
	}: Props = $props();

	const maxWidthClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-2xl'
	};

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			onClose();
		}
	}

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				if (node.parentNode) {
					node.parentNode.removeChild(node);
				}
			}
		};
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<div
		use:portal
		class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
		role="dialog"
		aria-modal="true"
	>
		<!-- Backdrop -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
			onclick={onClose}
		></div>

		<!-- Modal Dialog Content -->
		<div
			class="relative w-full {maxWidthClasses[
				maxWidth
			]} bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200/80 dark:border-zinc-800 p-6 z-10 animate-in zoom-in-95 duration-200 text-zinc-900 dark:text-zinc-100"
		>
			<!-- Header -->
			<div class="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
				{#if headerSnippet}
					{@render headerSnippet()}
				{:else}
					<h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-50">
						{title}
					</h3>
				{/if}
				<button
					type="button"
					class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
					onclick={onClose}
					aria-label="关闭"
				>
					<Icon icon="lucide:x" class="w-4 h-4" />
				</button>
			</div>

			<!-- Body -->
			<div class="py-4">
				{#if children}
					{@render children()}
				{/if}
			</div>

			<!-- Footer -->
			{#if footerSnippet}
				<div class="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2.5">
					{@render footerSnippet()}
				</div>
			{/if}
		</div>
	</div>
{/if}
