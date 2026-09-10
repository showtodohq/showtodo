<script lang="ts">
	import type { CategoryId } from '$lib/types/todo';
	import { CATEGORIES } from '$lib/constants/categories';
	import { userStore } from '$lib/stores/user.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { api } from '$lib/services/api';
	import Avatar from '$lib/components/ui/Avatar.svelte';

	interface Props {
		onsubmit?: (data: {
			content: string;
			note: string | null;
			isNotePublic?: boolean;
			category: CategoryId | null;
		}) => Promise<unknown> | unknown;
		selectedCategory?: CategoryId | null;
		placeholder?: string;
		class?: string;
	}

	let {
		onsubmit,
		selectedCategory = $bindable<CategoryId | null>(null),
		placeholder = '写下今天的一个目标...',
		class: className = ''
	}: Props = $props();

	let content = $state('');
	let note = $state('');
	let isNoteOpen = $state(false);
	let isNotePublic = $state(true);
	let inlineEmail = $state('');
	let isFocused = $state(false);
	let isComposing = $state(false);
	let submitting = $state(false);
	let containerRef = $state<HTMLDivElement | null>(null);

	const autoFocus = (el: HTMLElement) => el.focus();

	const isExpanded = $derived(
		isFocused ||
			content.trim().length > 0 ||
			note.trim().length > 0 ||
			isNoteOpen ||
			selectedCategory !== null
	);

	function handleClickOutside(e: MouseEvent) {
		const path = e.composedPath ? e.composedPath() : [];
		if (containerRef && !containerRef.contains(e.target as Node) && !path.includes(containerRef)) {
			if (!content.trim() && !note.trim() && selectedCategory === null) {
				isFocused = false;
				isNoteOpen = false;
			} else {
				isFocused = false;
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

	function handleCompositionStart() {
		isComposing = true;
	}

	function handleCompositionEnd() {
		isComposing = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (isComposing || e.isComposing || e.keyCode === 229) {
			return;
		}

		if ((e.key === 'Enter' && !e.shiftKey) || ((e.metaKey || e.ctrlKey) && e.key === 'Enter')) {
			e.preventDefault();
			handleSubmit();
		}
	}

	async function handleSubmit() {
		const clean = content.trim();
		if (!clean || submitting) return;

		if (!userStore.email) {
			const cleanEmail = inlineEmail.trim().toLowerCase();
			if (!cleanEmail || !cleanEmail.includes('@')) {
				toast.info('请先填写有效邮箱即可一键发布');
				return;
			}

			submitting = true;
			try {
				const { user } = await api.syncUser(cleanEmail);
				userStore.updateUserFromProfile(user);
			} catch {
				userStore.setSession({
					email: cleanEmail,
					nickname: cleanEmail.split('@')[0],
					handle: cleanEmail.split('@')[0]
				});
			}
		}

		submitting = true;
		try {
			await onsubmit?.({
				content: clean,
				note: note.trim() || null,
				isNotePublic,
				category: selectedCategory
			});
			// 重置状态
			content = '';
			note = '';
			isNoteOpen = false;
			isNotePublic = true;
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
	class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 sm:p-3.5 transition-all duration-200 shadow-2xs focus-within:border-zinc-300 dark:focus-within:border-zinc-700 focus-within:ring-2 focus-within:ring-zinc-900/5 dark:focus-within:ring-white/5 {className}"
>
	<div class="flex gap-2.5 sm:gap-3">
		<!-- 左侧用户头像 -->
		<div class="shrink-0 pt-0.5">
			<Avatar
				src={userStore.avatar}
				name={userStore.nickname || 'Guest'}
				size="sm"
				class="h-8 w-8 ring-1 ring-zinc-200/80 dark:ring-zinc-800"
			/>
		</div>

		<!-- 右侧主输入与操作区 -->
		<div class="flex-1 min-w-0 space-y-2.5 sm:space-y-3">
			<!-- 主待办正文输入区 (纯留白无边框设计) -->
			<textarea
				bind:value={content}
				onkeydown={handleKeydown}
				oncompositionstart={handleCompositionStart}
				oncompositionend={handleCompositionEnd}
				onfocus={() => (isFocused = true)}
				placeholder={placeholder}
				rows={isExpanded ? 2 : 1}
				class="w-full resize-none bg-transparent text-sm font-semibold placeholder:font-normal placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100 focus:outline-hidden leading-relaxed transition-all duration-150 py-1"
			></textarea>

			<!-- 正文下方：纯留白设计的邮箱输入框 (字体和正文同大，舒展透气) -->
			{#if !userStore.email && isExpanded}
				<div class="pt-1.5 pb-0.5 animate-in fade-in duration-150">
					<input
						type="email"
						bind:value={inlineEmail}
						onkeydown={handleKeydown}
						onfocus={() => (isFocused = true)}
						placeholder="输入你的邮箱一键快捷发布..."
						class="w-full bg-transparent text-sm font-semibold placeholder:font-normal placeholder:text-zinc-400/90 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100 focus:outline-hidden leading-relaxed py-1 transition-all"
					/>
				</div>
			{/if}

			<!-- 详细备注输入区 (独立呼吸层次，舒缓留白) -->
			{#if isNoteOpen || note.trim()}
				<div class="space-y-2 animate-in fade-in duration-150 pt-2.5 sm:pt-3 border-t border-zinc-100/80 dark:border-zinc-900/60">
					<textarea
						use:autoFocus
						bind:value={note}
						onfocus={() => (isFocused = true)}
						placeholder="添加备注、链接或执行细节..."
						rows="2"
						class="w-full resize-none bg-transparent text-xs text-zinc-600 dark:text-zinc-400 placeholder:text-zinc-400/80 dark:placeholder:text-zinc-600 focus:outline-hidden leading-relaxed transition-all py-1"
					></textarea>

					<!-- 备注隐私切换选项 (极简高质感自定义微复选框) -->
					<div class="flex items-center justify-between text-xs pt-1 select-none">
						<button
							type="button"
							onpointerdown={(e) => e.preventDefault()}
							onclick={(e) => {
								e.stopPropagation();
								isNotePublic = !isNotePublic;
							}}
							class="group/chk inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors focus:outline-hidden"
						>
							<div
								class="h-3.5 w-3.5 rounded-[4px] border transition-all duration-150 flex items-center justify-center shrink-0 {isNotePublic
									? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900 shadow-2xs'
									: 'border-zinc-300 dark:border-zinc-700 bg-transparent group-hover/chk:border-zinc-400 dark:group-hover/chk:border-zinc-600'}"
							>
								{#if isNotePublic}
									<svg
										class="h-2.5 w-2.5 stroke-[2.5]"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M5 13l4 4L19 7"
										/>
									</svg>
								{/if}
							</div>
							<span class="leading-none">{isNotePublic ? '公开此备注到广场' : '仅自己可见 (不公开)'}</span>
						</button>
					</div>
				</div>
			{/if}

			<!-- 工具栏与发布按钮 (单行委托防失焦，移动端全宽滑动不挤压，桌面端单行对齐) -->
			{#if isExpanded}
				<div
					role="toolbar"
					tabindex="-1"
					aria-label="待办工具栏"
					onpointerdown={(e) => {
						if ((e.target as HTMLElement).closest('button')) e.preventDefault();
					}}
					class="flex flex-col sm:flex-row sm:items-center justify-between pt-2.5 sm:pt-3 border-t border-zinc-100 dark:border-zinc-900/80 gap-2 sm:gap-3 animate-in fade-in duration-150"
				>
					<!-- 分类快捷标签组 (移动端独享整行横向平滑滑动，告别横向挤压) -->
					<div class="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none min-w-0">
						{#each CATEGORIES as cat}
							{@const isSelected = selectedCategory === cat.id}
							<button
								type="button"
								onclick={() => (selectedCategory = isSelected ? null : cat.id)}
								class="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150 cursor-pointer shrink-0 {isSelected
									? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
									: 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'}"
								title="选择分类: {cat.name}"
							>
								<span
									class="h-1.5 w-1.5 rounded-full shrink-0"
									style="background-color: {cat.color};"
								></span>
								<span>{cat.name}</span>
							</button>
						{/each}
					</div>

					<!-- 右侧操作组 (移动端自适应靠右，拥有充足触控热区) -->
					<div class="flex items-center justify-end gap-2 shrink-0 pt-0.5 sm:pt-0">
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
							disabled={!content.trim() || submitting || (!userStore.email && !inlineEmail.trim())}
							class="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
						>
							<span>{submitting ? '发布中...' : '发布'}</span>
							<span class="text-[10px] opacity-60 font-mono hidden sm:inline">↵</span>
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
