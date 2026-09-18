<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tick } from 'svelte';
	import {
		POPOVER_PLACEMENT,
		POPOVER_TRIGGER,
		POPOVER_TIMING,
		POPOVER_COLLISION,
		POPOVER_ROLE,
		type PopoverPlacement,
		type PopoverTrigger,
		type PopoverRole
	} from '$lib/constants/popover';

	interface Props {
		placement?: PopoverPlacement;
		trigger?: PopoverTrigger;
		role?: PopoverRole;
		offset?: number;
		defaultOpen?: boolean;
		open?: boolean;
		disabled?: boolean;
		class?: string;
		onopenchange?: (isOpen: boolean) => void;
		triggerSnippet?: Snippet<[
			{
				isOpen: boolean;
				toggle: (e?: Event) => void;
				open: (e?: Event) => void;
				close: () => void;
				triggerProps: Record<string, unknown>;
			}
		]>;
		children?: Snippet<[{ isOpen: boolean; close: () => void }]>;
	}

	let {
		placement = POPOVER_PLACEMENT.BOTTOM,
		trigger = POPOVER_TRIGGER.CLICK,
		role = POPOVER_ROLE.DIALOG,
		offset = 8,
		defaultOpen = false,
		open: controlledOpen = $bindable(undefined),
		disabled = false,
		class: contentClass = '',
		onopenchange,
		triggerSnippet,
		children
	}: Props = $props();

	// 状态机：支持非受控与受控双向绑定 ($bindable)
	// svelte-ignore state_referenced_locally
	let internalOpen = $state(defaultOpen);
	const isOpen = $derived(controlledOpen !== undefined ? controlledOpen : internalOpen);

	let triggerEl = $state<HTMLElement | null>(null);
	let popoverEl = $state<HTMLElement | null>(null);

	let coords = $state({ x: 0, y: 0 });
	// svelte-ignore state_referenced_locally
	let effectivePlacement = $state<PopoverPlacement>(placement);

	$effect(() => {
		effectivePlacement = placement;
	});

	let hoverTimer: ReturnType<typeof setTimeout> | null = null;
	let supportsNativePopover = $state(false);

	// 检测当前环境对原生 Popover API 的支持情况
	$effect(() => {
		supportsNativePopover =
			typeof HTMLElement !== 'undefined' &&
			typeof HTMLElement.prototype.showPopover === 'function';
	});

	function setOpenState(next: boolean) {
		if (disabled) return;
		if (next === isOpen && internalOpen === next) return;

		internalOpen = next;
		if (controlledOpen !== undefined) {
			controlledOpen = next;
		}
		onopenchange?.(next);
	}

	// 坐标计算：针对 Top Layer / Fixed 进行精准定位与视口防碰撞翻转
	function updatePosition() {
		if (!triggerEl || typeof window === 'undefined') return;

		const tRect = triggerEl.getBoundingClientRect();
		const pRect = popoverEl ? popoverEl.getBoundingClientRect() : null;
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		// 若浮层刚激活尚未完成首次排版，使用通用基准宽度预估防切边
		const popoverWidth = (pRect && pRect.width > 0) ? pRect.width : 320;
		const popoverHeight = (pRect && pRect.height > 0) ? pRect.height : 200;

		let targetPlacement = placement;

		// 视口空间检测与自适应 Flip (例如 top 空间不足自适应翻转至 bottom)
		if (placement.startsWith('top')) {
			if (tRect.top < popoverHeight + POPOVER_COLLISION.MIN_SPACE_FOR_TOP && vh - tRect.bottom > tRect.top) {
				targetPlacement = placement.replace('top', 'bottom') as PopoverPlacement;
			}
		} else if (placement.startsWith('bottom')) {
			if (vh - tRect.bottom < popoverHeight + POPOVER_COLLISION.MIN_SPACE_FOR_BOTTOM && tRect.top > vh - tRect.bottom) {
				targetPlacement = placement.replace('bottom', 'top') as PopoverPlacement;
			}
		}

		effectivePlacement = targetPlacement;

		let x = tRect.left;
		let y = tRect.bottom + offset;

		if (targetPlacement.startsWith('top')) {
			y = tRect.top - popoverHeight - offset;
		} else if (targetPlacement.startsWith('bottom')) {
			y = tRect.bottom + offset;
		}

		// 水平对齐计算
		if (targetPlacement === POPOVER_PLACEMENT.TOP || targetPlacement === POPOVER_PLACEMENT.BOTTOM) {
			x = tRect.left + (tRect.width - popoverWidth) / 2;
		} else if (targetPlacement.endsWith('end')) {
			x = tRect.right - popoverWidth;
		} else if (targetPlacement.endsWith('start')) {
			x = tRect.left;
		}

		// 边界约束 (Viewport Clamping)
		const minX = POPOVER_COLLISION.VIEWPORT_PADDING;
		const maxX = Math.max(minX, vw - popoverWidth - POPOVER_COLLISION.VIEWPORT_PADDING);
		x = Math.max(minX, Math.min(maxX, x));
		y = Math.max(POPOVER_COLLISION.VIEWPORT_PADDING, y);

		coords = {
			x: Math.round(x),
			y: Math.round(y)
		};
	}

	// 响应 isOpen 变动，调用原生 Popover API 并校准坐标
	$effect(() => {
		if (isOpen) {
			updatePosition();
			void tick().then(() => {
				if (popoverEl && supportsNativePopover) {
					try {
						if (!popoverEl.matches(':popover-open')) {
							popoverEl.showPopover();
						}
					} catch {
						// 忽略
					}
				}
				updatePosition();
				if (typeof requestAnimationFrame !== 'undefined') {
					requestAnimationFrame(() => updatePosition());
				}
			});
		} else {
			if (popoverEl && supportsNativePopover) {
				try {
					if (popoverEl.matches(':popover-open')) {
						popoverEl.hidePopover();
					}
				} catch {
					// 忽略
				}
			}
		}
	});

	// 原生 ontoggle 事件监听（接收原生 Light-Dismiss / ESC 关闭）
	function handleNativeToggle(e: Event) {
		const toggleEvent = e as unknown as { newState?: string };
		if (toggleEvent.newState === 'closed') {
			if (isOpen) {
				setOpenState(false);
			}
		} else if (toggleEvent.newState === 'open') {
			if (!isOpen) {
				setOpenState(true);
			}
			updatePosition();
			if (typeof requestAnimationFrame !== 'undefined') {
				requestAnimationFrame(() => updatePosition());
			}
		}
	}

	// 页面滚动与缩放时实时校准位置
	$effect(() => {
		if (!isOpen || typeof window === 'undefined') return;

		const handleScrollOrResize = () => {
			updatePosition();
		};

		window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });
		window.addEventListener('resize', handleScrollOrResize, { passive: true });

		return () => {
			window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
			window.removeEventListener('resize', handleScrollOrResize);
		};
	});

	// 降级兜底：在非原生 Popover 环境或 SSR 模式下监听 Outside Click 与 ESC
	function handleWindowClick(e: MouseEvent) {
		if (supportsNativePopover || !isOpen) return;
		const target = e.target as Node;
		if (
			triggerEl &&
			popoverEl &&
			!triggerEl.contains(target) &&
			!popoverEl.contains(target)
		) {
			closePopover();
		}
	}

	function handleWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			closePopover();
		}
	}

	// 交互方法
	function toggle(e?: Event) {
		e?.stopPropagation();
		if (isOpen) {
			closePopover();
		} else {
			openPopover();
		}
	}

	function openPopover(e?: Event) {
		e?.stopPropagation();
		clearHoverTimer();
		updatePosition();
		setOpenState(true);
	}

	function closePopover() {
		clearHoverTimer();
		setOpenState(false);
	}

	function clearHoverTimer() {
		if (hoverTimer) {
			clearTimeout(hoverTimer);
			hoverTimer = null;
		}
	}

	function handleTriggerMouseEnter() {
		if (trigger !== POPOVER_TRIGGER.HOVER || disabled) return;
		clearHoverTimer();
		hoverTimer = setTimeout(() => {
			openPopover();
		}, POPOVER_TIMING.HOVER_OPEN_DELAY);
	}

	function handleTriggerMouseLeave() {
		if (trigger !== POPOVER_TRIGGER.HOVER) return;
		clearHoverTimer();
		hoverTimer = setTimeout(() => {
			closePopover();
		}, POPOVER_TIMING.HOVER_CLOSE_DELAY);
	}

	function handleContentMouseEnter() {
		if (trigger !== POPOVER_TRIGGER.HOVER) return;
		clearHoverTimer();
	}

	function handleContentMouseLeave() {
		if (trigger !== POPOVER_TRIGGER.HOVER) return;
		clearHoverTimer();
		hoverTimer = setTimeout(() => {
			closePopover();
		}, POPOVER_TIMING.HOVER_CLOSE_DELAY);
	}

	const triggerProps = $derived({
		'aria-haspopup': role,
		'aria-expanded': isOpen,
		onclick: trigger === POPOVER_TRIGGER.CLICK ? toggle : undefined,
		onmouseenter: handleTriggerMouseEnter,
		onmouseleave: handleTriggerMouseLeave
	});
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div class="relative inline-flex items-center" bind:this={triggerEl}>
	{#if triggerSnippet}
		{@render triggerSnippet({
			isOpen,
			toggle,
			open: openPopover,
			close: closePopover,
			triggerProps
		})}
	{/if}

	<!-- 原生 Popover 顶层浮层 (Top Layer) -->
	<!-- 采用 popover="auto"，脱离普通 DOM 流，彻底解决父级 overflow 截断与 z-index 冲突 -->
	<div
		bind:this={popoverEl}
		popover="auto"
		ontoggle={handleNativeToggle}
		onmouseenter={handleContentMouseEnter}
		onmouseleave={handleContentMouseLeave}
		{role}
		aria-hidden={!isOpen}
		data-placement={effectivePlacement}
		class="fixed m-0 p-0 border-0 bg-transparent overflow-visible text-inherit outline-none focus:outline-none select-none transition-opacity duration-150 {isOpen
			? 'opacity-100 pointer-events-auto'
			: 'opacity-0 pointer-events-none'} {contentClass}"
		style="left: {coords.x}px; top: {coords.y}px; {!supportsNativePopover && !isOpen ? 'display: none;' : ''}"
	>
		{#if (isOpen || defaultOpen) && children}
			{@render children({ isOpen, close: closePopover })}
		{/if}
	</div>
</div>

<style>
	/* 覆盖浏览器对 [popover] 的默认基础居中样式，确保 fixed 坐标精确生效 */
	:global([popover]) {
		top: auto;
		left: auto;
		right: auto;
		bottom: auto;
		margin: 0;
		border: none;
		padding: 0;
		background: transparent;
		overflow: visible;
	}
	:global([popover]::backdrop) {
		background: transparent;
	}
</style>
