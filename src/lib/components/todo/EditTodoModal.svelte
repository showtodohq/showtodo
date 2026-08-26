<script lang="ts">
	import { CATEGORIES } from '$lib/constants/categories';
	import { getAllStatusesWithState } from '$lib/constants/status';
	import { api } from '$lib/services/api';
	import { toast } from '$lib/stores/toast.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import type { Todo, TodoStatus } from '$lib/types/todo';
	import Modal from '$lib/components/common/Modal.svelte';
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
	let category = $state<string | null>(null);
	let status = $state<TodoStatus>('pending');
	let startDate = $state('');
	let dueDate = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (isOpen && todo) {
			content = todo.content;
			note = todo.note || '';
			isNotePublic = todo.isNotePublic;
			category = todo.category || null;
			status = todo.status;
			startDate = todo.startDate || '';
			dueDate = todo.dueDate || '';
		}
	});

	let statusOptions = $derived.by(() => {
		if (!todo) return [];
		return getAllStatusesWithState(todo.status);
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
				category: category || null,
				status,
				startDate: startDate || undefined,
				dueDate: dueDate || null
			});

			toast.success('已保存');
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
			<!-- 内容 -->
			<div>
				<label for="edit-content" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
					内容 <span class="text-rose-500">*</span>
				</label>
				<input
					id="edit-content"
					type="text"
					bind:value={content}
					required
					maxlength={1000}
					class="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
				/>
			</div>

			<!-- 变更状态 -->
			<div>
				<div class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
					变更状态
				</div>
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
					{#each statusOptions as st}
						{@const isSelected = status === st.id}
						<button
							type="button"
							disabled={!st.isAllowed}
							onclick={() => (status = st.id)}
							class="px-2.5 py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all {isSelected
								? 'ring-2 ring-zinc-900 dark:ring-zinc-100 ' + st.bgClass + ' ' + st.textClass + ' shadow-xs font-semibold'
								: st.isAllowed
									? 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 cursor-pointer'
									: 'opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800/30 border-transparent text-zinc-400'}"
						>
							<Icon icon={st.actionIcon} class="w-3.5 h-3.5 {st.actionColorClass}" />
							<span>{st.actionLabel}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- 分类 -->
			<div>
				<div class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
					分类
				</div>
				<div class="flex flex-wrap gap-1.5">
					<button
						type="button"
						onclick={() => (category = null)}
						class="px-2.5 py-1 rounded-md text-xs border transition-colors cursor-pointer {category === null
							? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent font-medium'
							: 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}"
					>
						无分类
					</button>
					{#each CATEGORIES as cat}
						<button
							type="button"
							onclick={() => (category = cat.id)}
							class="px-2.5 py-1 rounded-md text-xs border transition-colors cursor-pointer {category === cat.id
								? 'ring-2 ring-zinc-900 dark:ring-zinc-100 ' + cat.bgClass + ' ' + cat.textClass
								: 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}"
						>
							{cat.name}
						</button>
					{/each}
				</div>
			</div>

			<!-- 备注 -->
			<div>
				<div class="flex items-center justify-between mb-1">
					<label for="edit-note" class="text-xs font-medium text-zinc-700 dark:text-zinc-300">
						备注
					</label>
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
					id="edit-note"
					rows="3"
					bind:value={note}
					maxlength={5000}
					placeholder="补充计划或备注..."
					class="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
				></textarea>
			</div>

			<!-- 起止日期 -->
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label for="edit-start" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
						开始日期
					</label>
					<input
						id="edit-start"
						type="date"
						bind:value={startDate}
						class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
					/>
				</div>
				<div>
					<label for="edit-due" class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
						截止日期
					</label>
					<input
						id="edit-due"
						type="date"
						bind:value={dueDate}
						class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
					/>
				</div>
			</div>

			<!-- Actions -->
			<div class="pt-3 flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
				<button
					type="button"
					onclick={onClose}
					class="px-3.5 py-1.5 text-xs font-medium rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
				>
					取消
				</button>
				<button
					type="submit"
					disabled={isSubmitting}
					class="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 cursor-pointer"
				>
					{#if isSubmitting}
						<Icon icon="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
						<span>保存中...</span>
					{:else}
						<span>保存</span>
					{/if}
				</button>
			</div>
		</form>
	{/if}
</Modal>
