<script lang="ts">
	import { goto } from '$app/navigation';

	interface BreadcrumbItem {
		label: string;
		href?: string;
	}

	interface Props {
		backHref?: string;
		backLabel?: string;
		crumbs?: BreadcrumbItem[];
		class?: string;
	}

	let {
		backHref = '/',
		backLabel = 'Back',
		crumbs = [],
		class: className = ''
	}: Props = $props();

	function handleBack() {
		// 如果有浏览历史，优先回退；否则跳转到指定的上一级兜底路径
		if (typeof window !== 'undefined' && window.history.length > 1) {
			window.history.back();
		} else {
			goto(backHref);
		}
	}
</script>

<nav aria-label="Breadcrumb" class="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 py-1 {className}">
	<div class="flex items-center gap-1.5 flex-wrap">
		<!-- 返回上一级按钮 -->
		<button
			type="button"
			onclick={handleBack}
			class="inline-flex items-center justify-center p-1 -ml-1 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/60 transition-all cursor-pointer group"
			title={backLabel}
			aria-label={backLabel}
		>
			<svg
				class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			{#if crumbs.length === 0}
				<span class="ml-1 font-medium">{backLabel}</span>
			{/if}
		</button>

		<!-- 面包屑链路 -->
		{#if crumbs.length > 0}
			{#each crumbs as crumb, idx}
				{#if crumb.href && idx < crumbs.length - 1}
					<a
						href={crumb.href}
						class="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
					>
						{crumb.label}
					</a>
					<span class="text-zinc-300 dark:text-zinc-700 select-none">/</span>
				{:else}
					<span class="text-zinc-800 dark:text-zinc-200 font-medium truncate max-w-[200px] sm:max-w-xs">
						{crumb.label}
					</span>
				{/if}
			{/each}
		{/if}
	</div>
</nav>
