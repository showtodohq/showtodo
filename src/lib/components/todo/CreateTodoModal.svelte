<script lang="ts">
	import type { Author, Todo } from '$lib/types/todo';
	import Modal from '$lib/components/common/Modal.svelte';
	import { CATEGORIES } from '$lib/constants/categories';
	import { userStore } from '$lib/stores/user.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { api } from '$lib/services/api';
	import { formatDateISO } from '$lib/utils/calendar';
	import Icon from '@iconify/svelte';

	interface Props {
		isOpen: boolean;
		initialDate?: string;
		onClose: () => void;
		onCreated?: (todo: Todo, author: Author) => void;
	}

	let { isOpen, initialDate, onClose, onCreated }: Props = $props();

	let email = $state(userStore.email || '');
	let content = $state('');
	let note = $state('');
	let isNotePublic = $state(true);
	let selectedCategory = $state<string | null>(null);
	let startDate = $state(formatDateISO(new Date()));
	let dueDate = $state('');
	let showMoreOptions = $state(false);
	let isSubmitting = $state(false);

	$effect(() => {
		if (isOpen) {
			email = userStore.email || '';
			startDate = initialDate || formatDateISO(new Date());
			content = '';
			note = '';
			isNotePublic = true;
			selectedCategory = null;
			dueDate = '';
			showMoreOptions = false;
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!email.trim()) {
			toast.warning('请填写邮箱');
			return;
		}
		if (!content.trim()) {
			toast.warning('待办内容不能为空');
			return;
		}

		isSubmitting = true;
		try {
			const res = await api.createTodo({
				email: email.trim(),
				content: content.trim(),
				note: note.trim() || null,
				isNotePublic,
				category: selectedCategory,
				startDate: startDate || undefined,
				dueDate: dueDate || null
			});

			userStore.updateUserFromProfile(res.author);

			toast.success('发布成功！');
			onCreated?.(res.todo, res.author);
			onClose();
		} catch (error: any) {
			toast.error(error.message || '发布待办失败');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Modal {isOpen} {onClose} title="发布公开待办" maxWidth="md">
	<form onsubmit={handleSubmit} class="space-y-4">
		<!-- Email 身份 -->
		<div>
			<label for="create-email" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
				邮箱 (用于关联身份)
			</label>
			<input
				id="create-email"
				type="email"
				required
				placeholder="name@example.com"
				bind:value={email}
				class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100"
			/>
		</div>

		<!-- 待办内容 -->
		<div>
			<label for="create-content" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
				待办内容 <span class="text-rose-500">*</span>
			</label>
			<textarea
				id="create-content"
				required
				rows="2"
				placeholder="今天计划完成什么？"
				bind:value={content}
				class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100 resize-none"
			></textarea>
		</div>

		<!-- 分类选择 -->
		<div>
			<div class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
				选择分类
			</div>
			<div class="flex flex-wrap gap-1.5">
				{#each CATEGORIES as cat (cat.id)}
					{@const isSelected = selectedCategory === cat.id}
					<button
						type="button"
						onclick={() => (selectedCategory = isSelected ? null : cat.id)}
						class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all cursor-pointer {isSelected
							? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-2xs font-medium'
							: 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-700 hover:bg-zinc-100'}"
					>
						<span class="w-2 h-2 rounded-full {cat.dotClass}"></span>
						<span>{cat.name}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- 日期选择 -->
		<div class="grid grid-cols-2 gap-3">
			<div>
				<label for="create-start-date" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
					开始日期
				</label>
				<input
					id="create-start-date"
					type="date"
					bind:value={startDate}
					class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100"
				/>
			</div>
			<div>
				<label for="create-due-date" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
					截止日期 (可选)
				</label>
				<input
					id="create-due-date"
					type="date"
					bind:value={dueDate}
					class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100"
				/>
			</div>
		</div>

		<!-- 更多选项开关 -->
		<div>
			<button
				type="button"
				onclick={() => (showMoreOptions = !showMoreOptions)}
				class="text-[11px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
			>
				<Icon icon={showMoreOptions ? 'lucide:chevron-up' : 'lucide:chevron-down'} class="w-3.5 h-3.5" />
				<span>{showMoreOptions ? '收起附加选项' : '展开附加备注'}</span>
			</button>
		</div>

		{#if showMoreOptions}
			<div class="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
				<div>
					<label for="create-note" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
						详细备注 (可选)
					</label>
					<textarea
						id="create-note"
						rows="2"
						placeholder="补充背景、链接或执行细节"
						bind:value={note}
						class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100 resize-none"
					></textarea>
				</div>

				<div class="flex items-center gap-2">
					<input
						id="create-note-public"
						type="checkbox"
						bind:checked={isNotePublic}
						class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
					/>
					<label for="create-note-public" class="text-xs text-zinc-600 dark:text-zinc-400 select-none">
						备注公开给所有人可见
					</label>
				</div>
			</div>
		{/if}

		<!-- 提交按钮 -->
		<div class="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
			<button
				type="button"
				onclick={onClose}
				class="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
			>
				取消
			</button>
			<button
				type="submit"
				disabled={isSubmitting}
				class="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
			>
				{#if isSubmitting}
					<Icon icon="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
					<span>发布中...</span>
				{:else}
					<Icon icon="lucide:send" class="w-3.5 h-3.5" />
					<span>发布待办</span>
				{/if}
			</button>
		</div>
	</form>
</Modal>
