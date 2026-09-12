<script lang="ts" module>
	// 模块级单例计数器，完美支持多层弹窗嵌套或并发时的滚动锁引用计数
	let activeModalCount = 0;
	let originalOverflow = '';
	let originalPaddingRight = '';

	function acquireScrollLock() {
		if (typeof document === 'undefined') return;
		if (activeModalCount === 0) {
			originalOverflow = document.body.style.overflow;
			originalPaddingRight = document.body.style.paddingRight;

			// 计算原生垂直滚动条宽度，防止 overflow: hidden 后页面内容跳动（Layout Shift）
			const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
			if (scrollbarWidth > 0) {
				document.body.style.paddingRight = `${scrollbarWidth}px`;
			}
			document.body.style.overflow = 'hidden';
		}
		activeModalCount++;
	}

	function releaseScrollLock() {
		if (typeof document === 'undefined') return;
		activeModalCount = Math.max(0, activeModalCount - 1);
		if (activeModalCount === 0) {
			document.body.style.overflow = originalOverflow;
			document.body.style.paddingRight = originalPaddingRight;
		}
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		open?: boolean;
		title?: string;
		description?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
		closeOnClickOutside?: boolean;
		closeOnEsc?: boolean;
		class?: string;
		header?: Snippet;
		children?: Snippet;
		footer?: Snippet;
		onclose?: () => void;
	}

	let {
		open = $bindable(false),
		title,
		description,
		size = 'md',
		closeOnClickOutside = true,
		closeOnEsc = true,
		class: className = '',
		header,
		children,
		footer,
		onclose
	}: Props = $props();

	// 监听 open 状态，在客户端挂载时锁定背景滚动，并在关闭或组件销毁时完整还原
	$effect(() => {
		if (open) {
			acquireScrollLock();
			return () => {
				releaseScrollLock();
			};
		}
	});

	function handleClose() {
		open = false;
		if (onclose) onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (closeOnEsc && e.key === 'Escape' && open) {
			e.preventDefault();
			handleClose();
		}
	}

	const sizeClasses = {
		sm: 'max-w-sm',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl',
		full: 'max-w-full m-4'
	};
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- 背景遮罩 (配置 overscroll-contain 彻底隔离滚动链向底层穿透) -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto overscroll-contain bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
		onclick={(e) => {
			if (closeOnClickOutside && e.target === e.currentTarget) {
				handleClose();
			}
		}}
	>
		<!-- 弹窗本体 (自包含滚动容器) -->
		<div
			class={cn(
				'w-full rounded-2xl border border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-150 text-left overscroll-contain',
				sizeClasses[size],
				className
			)}
		>
			<!-- 弹窗头部 -->
			{#if header}
				{@render header()}
			{:else if title || description}
				<div class="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800/80 px-6 py-4">
					<div>
						{#if title}
							<h3 class="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
								{title}
							</h3>
						{/if}
						{#if description}
							<p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
								{description}
							</p>
						{/if}
					</div>

					<button
						type="button"
						onclick={handleClose}
						class="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
						aria-label="Close modal"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{/if}

			<!-- 弹窗内容主体 -->
			{#if children}
				<div class="px-6 py-5">
					{@render children()}
				</div>
			{/if}

			<!-- 弹窗底部操作区 -->
			{#if footer}
				<div class="flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-3.5">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
