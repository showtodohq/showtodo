<script lang="ts">
	import { CATEGORIES } from '$lib/constants/categories';
	import { api } from '$lib/services/api';
	import { toast } from '$lib/stores/toast.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import type { Todo } from '$lib/types/todo';
	import Modal from '$lib/components/common/Modal.svelte';
	import Avatar from '$lib/components/common/Avatar.svelte';
	import StatusBadge from '$lib/components/common/StatusBadge.svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		isOpen: boolean;
		todo: Todo | null;
		onClose: () => void;
		onUpdated: (todo: Todo) => void;
	}

	let { isOpen, todo, onClose, onUpdated }: Props = $props();

	let content = $state('');
	let note = $state('');
	let isNotePublic = $state(true);
	let selectedCategory = $state<string | null>(null);
	let startDate = $state('');
	let dueDate = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (isOpen && todo) {
			content = todo.content;
			note = todo.note || '';
			isNotePublic = todo.isNotePublic;
			selectedCategory = todo.category || null;
			startDate = todo.startDate || '';
			dueDate = todo.dueDate || '';
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!todo) return;

		const email = userStore.email;
		if (!email) {
			toast.error('未找到作者身份');
			return;
		}

		if (!content.trim()) {
			toast.warning('待办内容不能为空');
			return;
		}

		isSubmitting = true;
		try {
			const res = await api.updateTodo(todo.id, {
				email,
				content: content.trim(),
				note: note.trim() ? note.trim() : null,
				isNotePublic,
				category: selectedCategory,
				startDate: startDate || undefined,
				dueDate: dueDate || null
			});

			toast.success('已保存修改');
			onUpdated({
				...todo,
				...res.todo,
				author: todo.author,
				reactions: todo.reactions
			});
			onClose();
		} catch (error: any) {
			toast.error(error.message || '保存失败');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Modal {isOpen} title="编辑待办" maxWidth="md" {onClose}>
	{#if todo}
		<form onsubmit={handleSubmit} class="space-y-4">
			<!-- 头部待办归属与当前状态 -->
			<div class="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800 text-xs">
				<div class="flex items-center gap-2 min-w-0">
					<Avatar
						avatar={todo.author?.avatar}
						seed={todo.author?.nickname || 'User'}
						size="xs"
						alt={todo.author?.nickname}
					/>
					<div class="truncate text-zinc-700 dark:text-zinc-300">
						<strong class="font-medium text-zinc-900 dark:text-zinc-100">{todo.author?.nickname || '作者'}</strong>
						<span class="text-zinc-400 font-mono">(@{todo.author?.handle})</span>
					</div>
				</div>
				<div class="shrink-0 flex items-center gap-1.5">
					<span class="text-[11px] text-zinc-400">状态:</span>
					<StatusBadge status={todo.status} size="sm" />
				</div>
			</div>

			<!-- 核心待办内容 -->
			<div>
				<label for="edit-content" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
					待办内容 <span class="text-rose-500">*</span>
				</label>
				<textarea
					id="edit-content"
					required
					rows="3"
					placeholder="输入待办主要内容..."
					bind:value={content}
					maxlength={1000}
					class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100 resize-none leading-relaxed"
				></textarea>
			</div>

			<!-- 选择分类 (Pill 胶囊选择) -->
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
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all cursor-pointer select-none {isSelected
								? 'ring-2 ring-blue-500/30 ' + cat.bgClass + ' ' + cat.textClass + ' ' + cat.borderClass + ' font-medium shadow-2xs'
								: 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-100'}"
						>
							<span class="w-2 h-2 rounded-full {cat.dotClass}"></span>
							<span>{cat.name}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- 起止日期 (2 列网格) -->
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label for="edit-start" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
						开始日期
					</label>
					<input
						id="edit-start"
						type="date"
						bind:value={startDate}
						class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100"
					/>
				</div>
				<div>
					<label for="edit-due" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
						截止日期 (可选)
					</label>
					<input
						id="edit-due"
						type="date"
						bind:value={dueDate}
						class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100"
					/>
				</div>
			</div>

			<!-- 详细备注与隐私公开设置 -->
			<div>
				<div class="flex items-center justify-between mb-1">
					<label for="edit-note" class="text-xs font-medium text-zinc-700 dark:text-zinc-300">
						详细备注 (可选)
					</label>
					<label class="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer select-none">
						<input
							type="checkbox"
							bind:checked={isNotePublic}
							class="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
						/>
						<Icon icon={isNotePublic ? 'lucide:globe' : 'lucide:lock'} class="w-3 h-3 text-zinc-400" />
						<span>{isNotePublic ? '公开备注' : '仅自己可见'}</span>
					</label>
				</div>
				<textarea
					id="edit-note"
					rows="2"
					placeholder="补充背景、链接或执行细节..."
					bind:value={note}
					maxlength={5000}
					class="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100 resize-none leading-relaxed"
				></textarea>
			</div>

			<!-- Actions -->
			<div class="pt-3 flex justify-end gap-2.5 border-t border-zinc-100 dark:border-zinc-800">
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
						<span>保存中...</span>
					{:else}
						<Icon icon="lucide:check" class="w-3.5 h-3.5" />
						<span>保存修改</span>
					{/if}
				</button>
			</div>
		</form>
	{/if}
</Modal>
