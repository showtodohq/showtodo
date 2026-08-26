<script lang="ts">
	import { CATEGORIES } from '$lib/constants/categories';
	import { api } from '$lib/services/api';
	import { toast } from '$lib/stores/toast.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import type { Author, Todo } from '$lib/types/todo';
	import Avatar from '$lib/components/common/Avatar.svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		onCreated: (todo: Todo, author: Author) => void;
	}

	let { onCreated }: Props = $props();

	function getTodayDateString(): string {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	let isExpanded = $state(false);
	let content = $state('');
	let email = $state('');
	let note = $state('');
	let isNotePublic = $state(true);
	let category = $state<string | null>(null);
	let startDate = $state(getTodayDateString());
	let dueDate = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (userStore.email) {
			email = userStore.email;
		}
	});

	function handleFocus() {
		isExpanded = true;
	}

	function resetForm() {
		content = '';
		note = '';
		isNotePublic = true;
		category = null;
		startDate = getTodayDateString();
		dueDate = '';
		isExpanded = false;
	}

	async function handleSubmit() {
		const targetEmail = (userStore.email || email).trim().toLowerCase();
		if (!targetEmail || !targetEmail.includes('@')) {
			toast.error('请输入有效的邮箱');
			return;
		}

		if (!content.trim()) {
			toast.warning('待办内容不能为空');
			return;
		}

		isSubmitting = true;
		try {
			const res = await api.createTodo({
				email: targetEmail,
				content: content.trim(),
				note: note.trim() ? note.trim() : null,
				isNotePublic,
				category: category || null,
				startDate: startDate || undefined,
				dueDate: dueDate || null
			});

			// 更新本地用户身份
			userStore.updateUserFromProfile(res.author);

			toast.success('发布成功！');
			onCreated(res.todo, res.author);
			resetForm();
		} catch (error: any) {
			toast.error(error.message || '发布失败，请重试');
		} finally {
			isSubmitting = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			handleSubmit();
		}
	}
</script>

<div
	class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 shadow-xs transition-all duration-200 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:shadow-md"
>
	<div class="flex items-start gap-3">
		<Avatar
			avatar={userStore.avatar}
			seed={userStore.nickname || email || 'me'}
			size="md"
			class="mt-0.5"
		/>

		<div class="flex-1 min-w-0">
			<!-- Main Content Input -->
			<textarea
				rows={isExpanded ? 2 : 1}
				bind:value={content}
				onfocus={handleFocus}
				onkeydown={handleKeydown}
				placeholder="写下公开目标或待办..."
				maxlength={1000}
				class="w-full resize-none bg-transparent border-0 p-0 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-0 leading-relaxed"
			></textarea>

			<!-- Expanded Options -->
			{#if isExpanded}
				<div class="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3.5 animate-in fade-in duration-150">
					<!-- Email (if not remembered) -->
					{#if !userStore.email}
						<div>
							<label for="create-email" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
								邮箱 <span class="text-rose-500">*</span>
							</label>
							<input
								id="create-email"
								type="email"
								bind:value={email}
								placeholder="name@example.com"
								required
								class="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
							/>
						</div>
					{/if}

					<!-- Category Selector -->
					<div>
						<div class="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
							分类
						</div>
						<div class="flex flex-wrap gap-1.5">
							<button
								type="button"
								onclick={() => (category = null)}
								class="px-2.5 py-1 rounded-full text-xs border transition-all cursor-pointer {category === null
									? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent font-medium shadow-xs'
									: 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'}"
							>
								无分类
							</button>
							{#each CATEGORIES as cat}
								<button
									type="button"
									onclick={() => (category = cat.id)}
									class="px-2.5 py-1 rounded-full text-xs border transition-all cursor-pointer {category === cat.id
										? 'ring-2 ring-zinc-900 dark:ring-zinc-100 font-medium ' + cat.bgClass + ' ' + cat.textClass
										: 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'}"
								>
									{cat.name}
								</button>
							{/each}
						</div>
					</div>

					<!-- Optional Note -->
					<div>
						<div class="flex items-center justify-between mb-1">
							<span class="text-xs font-medium text-zinc-600 dark:text-zinc-400">
								备注
							</span>
							<label class="inline-flex items-center gap-1 text-[11px] text-zinc-500 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={isNotePublic}
									class="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 w-3.5 h-3.5"
								/>
								<span>公开备注</span>
							</label>
						</div>
						<textarea
							rows="2"
							bind:value={note}
							maxlength={5000}
							placeholder="补充具体计划或背景..."
							class="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
						></textarea>
					</div>

					<!-- Date Range (Start Date & Due Date) & Bottom Toolbar -->
					<div class="flex flex-wrap items-center justify-between gap-3 pt-1">
						<div class="flex flex-wrap items-center gap-3">
							<!-- Start Date -->
							<div class="flex items-center gap-1.5">
								<label for="create-start" class="text-xs text-zinc-500 flex items-center gap-1">
									<Icon icon="lucide:calendar" class="w-3.5 h-3.5" />
									<span>开始:</span>
								</label>
								<input
									id="create-start"
									type="date"
									bind:value={startDate}
									class="px-2 py-1 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
								/>
							</div>

							<!-- Due Date -->
							<div class="flex items-center gap-1.5">
								<label for="create-due" class="text-xs text-zinc-500 flex items-center gap-1">
									<Icon icon="lucide:calendar-clock" class="w-3.5 h-3.5" />
									<span>截止:</span>
								</label>
								<input
									id="create-due"
									type="date"
									bind:value={dueDate}
									class="px-2 py-1 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
								/>
							</div>
						</div>

						<div class="flex items-center gap-2 ml-auto">
							<button
								type="button"
								onclick={() => (isExpanded = false)}
								class="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
							>
								收起
							</button>
							<button
								type="button"
								disabled={isSubmitting}
								onclick={handleSubmit}
								class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
							>
								{#if isSubmitting}
									<Icon icon="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
									<span>发布中...</span>
								{:else}
									<Icon icon="lucide:send" class="w-3.5 h-3.5" />
									<span>发布</span>
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
