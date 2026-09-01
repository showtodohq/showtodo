<script lang="ts">
	import type { CategoryId } from '$lib/types/todo';
	import { CATEGORIES } from '$lib/constants/categories';
	import { userStore } from '$lib/stores/user.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';

	interface Props {
		onsubmit?: (data: {
			content: string;
			note: string | null;
			category: CategoryId | null;
		}) => Promise<void> | void;
		placeholder?: string;
		class?: string;
	}

	let { onsubmit, placeholder = '写下今天的一个目标... (Enter 发送)', class: className = '' }: Props = $props();

	let content = $state('');
	let note = $state('');
	let isNoteOpen = $state(false);
	let selectedCategory = $state<CategoryId | null>(null);
	let isFocused = $state(false);
	let submitting = $state(false);
	let containerRef = $state<HTMLDivElement | null>(null);

	const isExpanded = $derived(
		isFocused || content.trim().length > 0 || note.trim().length > 0 || isNoteOpen
	);

	function handleClickOutside(e: MouseEvent) {
		if (containerRef && !containerRef.contains(e.target as Node)) {
			if (!content.trim() && !note.trim()) {
				isFocused = false;
				isNoteOpen = false;
			}
		}
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isFocused) {
			if (!content.trim() && !note.trim()) {
				isFocused = false;
				isNoteOpen = false;
			} else {
				isFocused = false;
			}
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}

	async function handleSubmit() {
		const clean = content.trim();
		if (!clean || submitting) return;

		if (!userStore.email) {
			toast.info('请先点击右上角头像设置您的发布邮箱');
			return;
		}

		submitting = true;
		try {
			await onsubmit?.({
				content: clean,
				note: note.trim() || null,
				category: selectedCategory
			});
			// 重置状态
			content = '';
			note = '';
			isNoteOpen = false;
			selectedCategory = null;
			isFocused = false;
		} catch (error) {
			console.error('Failed to submit todo:', error);
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleGlobalKeydown} />

<div
	bind:this={containerRef}
	class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 sm:p-3.5 transition-all duration-200 shadow-2xs focus-within:border-zinc-300 dark:focus-within:border-zinc-700 {className}"
>
	<div class="flex gap-3">
		<!-- 左侧用户头像 -->
		<div class="shrink-0 pt-0.5">
			<Avatar
				src={userStore.avatar}
				name={userStore.nickname}
				size="sm"
				class="h-8 w-8 ring-1 ring-zinc-200/80 dark:ring-zinc-800"
			/>
		</div>

		<!-- 右侧主输入与操作区 -->
		<div class="flex-1 min-w-0 space-y-2">
			<!-- 主待办正文输入区 -->
			<textarea
				bind:value={content}
				onkeydown={handleKeydown}
				onfocus={() => (isFocused = true)}
				placeholder={userStore.email ? placeholder : '写下今天的一个目标... (需先设置邮箱)'}
				rows={isExpanded ? 2 : 1}
				class="w-full resize-none bg-transparent text-sm font-semibold placeholder:font-normal placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100 focus:outline-hidden leading-relaxed transition-all duration-150 py-0.5"
			></textarea>

			<!-- 详细备注输入区 -->
			{#if isNoteOpen || note.trim()}
				<div class="animate-in fade-in duration-150 pt-0.5">
					<textarea
						bind:value={note}
						placeholder="添加备注、链接或执行细节..."
						rows="2"
						class="w-full resize-none bg-transparent text-xs text-zinc-600 dark:text-zinc-400 placeholder:text-zinc-400/80 dark:placeholder:text-zinc-600 focus:outline-hidden leading-relaxed transition-all"
					></textarea>
				</div>
			{/if}

			<!-- 工具栏与发布按钮 -->
			{#if isExpanded}
				<div
					class="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-900/80 gap-2 animate-in fade-in duration-150"
				>
					<!-- 分类快捷标签组 -->
					<div class="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
						{#each CATEGORIES as cat}
							{@const isSelected = selectedCategory === cat.id}
							<button
								type="button"
								onclick={() => (selectedCategory = isSelected ? null : cat.id)}
								class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all duration-150 cursor-pointer {isSelected
									? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
									: 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'}"
								title="选择分类: {cat.name}"
							>
								<span
									class="h-1.5 w-1.5 rounded-full shrink-0"
									style="background-color: {cat.color};"
								></span>
								{cat.name}
							</button>
						{/each}
					</div>

					<!-- 右侧操作组 -->
					<div class="flex items-center gap-1.5 shrink-0">
						<button
							type="button"
							onclick={() => (isNoteOpen = !isNoteOpen)}
							class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer {isNoteOpen ||
							note.trim()
								? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
								: 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-900'}"
							title={isNoteOpen ? '收起备注' : '添加备注'}
						>
							<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
							<span class="text-[11px]">备注</span>
						</button>

						<button
							type="button"
							onclick={handleSubmit}
							disabled={!content.trim() || submitting}
							class="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
						>
							{submitting ? '发布中...' : '发布'}
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
