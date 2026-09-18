<script lang="ts">
	import { onDestroy } from 'svelte';
	import {
		SEARCH_DEFAULT_DEBOUNCE_MS,
		SEARCH_MAX_INPUT_LENGTH,
		SEARCH_FOCUS_SHORTCUT,
		SEARCH_ESCAPE_KEY,
		SEARCH_PLACEHOLDERS
	} from '$lib/constants/search';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Icon from '@iconify/svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		value?: string;
		placeholder?: string;
		debounceMs?: number;
		loading?: boolean;
		size?: 'sm' | 'md';
		autofocus?: boolean;
		enableGlobalShortcut?: boolean;
		class?: string;
		onsearch?: (query: string) => void;
		onclear?: () => void;
	}

	let {
		value = $bindable(''),
		placeholder = SEARCH_PLACEHOLDERS.TRENDING,
		debounceMs = SEARCH_DEFAULT_DEBOUNCE_MS,
		loading = false,
		size = 'sm',
		autofocus = false,
		enableGlobalShortcut = false,
		class: className = '',
		onsearch,
		onclear
	}: Props = $props();

	let inputRef = $state<HTMLInputElement | null>(null);
	let isFocused = $state(false);
	let isComposing = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (autofocus && inputRef) {
			inputRef.focus();
			inputRef.select();
		}
	});

	function clearDebounceTimer() {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}
	}

	function emitSearch(query: string) {
		clearDebounceTimer();
		onsearch?.(query);
	}

	function scheduleSearch() {
		clearDebounceTimer();
		debounceTimer = setTimeout(() => {
			onsearch?.(value);
		}, debounceMs);
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		value = target.value;
		if (!isComposing) {
			scheduleSearch();
		}
	}

	function handleCompositionStart() {
		isComposing = true;
	}

	function handleCompositionEnd(e: CompositionEvent) {
		isComposing = false;
		// 中文输入法选词完成后立即触发防抖检索
		value = (e.target as HTMLInputElement).value;
		scheduleSearch();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === SEARCH_ESCAPE_KEY) {
			e.preventDefault();
			if (value) {
				handleClear();
			} else {
				inputRef?.blur();
			}
			return;
		}

		if (e.key === 'Enter') {
			if (isComposing || e.isComposing) return;
			e.preventDefault();
			emitSearch(value);
		}
	}

	function handleClear() {
		value = '';
		clearDebounceTimer();
		emitSearch('');
		onclear?.();
		inputRef?.focus();
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
		if (!enableGlobalShortcut) return;

		const target = e.target as HTMLElement | null;
		const isInputActive =
			target?.tagName === 'INPUT' ||
			target?.tagName === 'TEXTAREA' ||
			target?.tagName === 'SELECT' ||
			target?.isContentEditable;

		if (isInputActive) return;

		if (e.key === SEARCH_FOCUS_SHORTCUT && !e.metaKey && !e.ctrlKey && !e.altKey) {
			e.preventDefault();
			inputRef?.focus();
			inputRef?.select();
		}
	}

	onDestroy(() => {
		clearDebounceTimer();
	});
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<div
	role="search"
	class={cn(
		'relative inline-flex items-center w-full transition-all group',
		className
	)}
>
	<!-- Left Search Icon -->
	<div
		class={cn(
			'absolute left-2.5 flex items-center justify-center pointer-events-none transition-colors duration-150',
			isFocused ? 'text-zinc-700 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-500'
		)}
	>
		<Icon icon="lucide:search" class={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
	</div>

	<!-- Main Search Input -->
	<input
		bind:this={inputRef}
		type="search"
		{value}
		maxlength={SEARCH_MAX_INPUT_LENGTH}
		{placeholder}
		oninput={handleInput}
		oncompositionstart={handleCompositionStart}
		oncompositionend={handleCompositionEnd}
		onkeydown={handleKeydown}
		onfocus={() => (isFocused = true)}
		onblur={() => (isFocused = false)}
		class={cn(
			'w-full bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-xl transition-all duration-150 focus:outline-hidden focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900',
			size === 'sm' ? 'h-8 text-xs pl-8 pr-8' : 'h-9 text-sm pl-9 pr-9',
			value.length > 0 ? 'pr-8' : ''
		)}
	/>

	<!-- Right Accessories (Loading Spinner / Clear Button / Keyboard Shortcut Hint) -->
	<div class="absolute right-2 flex items-center gap-1">
		{#if loading}
			<div class="text-zinc-400 shrink-0">
				<Spinner size="xs" />
			</div>
		{:else if value.length > 0}
			<button
				type="button"
				onclick={handleClear}
				class="h-5 w-5 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer"
				title="Clear search (Esc)"
				aria-label="Clear search"
			>
				<Icon icon="lucide:x" class="h-3 w-3" />
			</button>
		{:else if enableGlobalShortcut && !isFocused}
			<kbd
				class="hidden sm:inline-flex items-center justify-center h-4 min-w-4 px-1 rounded bg-zinc-200/70 dark:bg-zinc-700/70 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 pointer-events-none leading-none"
				title="Press / to search"
			>
				{SEARCH_FOCUS_SHORTCUT}
			</kbd>
		{/if}
	</div>
</div>
