<script lang="ts">
	import { REACTIONS } from '$lib/constants/reactions';
	import { api } from '$lib/services/api';
	import { toast } from '$lib/stores/toast.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import type { ReactionDetail, ReactionEmoji } from '$lib/types/todo';
	import Avatar from '$lib/components/common/Avatar.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		todoId: string;
		initialReactions?: Record<string, number>;
		onRequestEmail?: () => void;
	}

	let { todoId, initialReactions = {}, onRequestEmail }: Props = $props();

	let reactionsCount = $state<Record<string, number>>({});
	let userReacted = $state<Record<string, boolean>>({});
	let isSubmitting = $state<string | null>(null);

	$effect(() => {
		reactionsCount = { ...initialReactions };
	});

	// Reaction 详情弹窗
	let isDetailsModalOpen = $state(false);
	let reactionDetails = $state<ReactionDetail[]>([]);
	let isLoadingDetails = $state(false);

	async function toggleReaction(emoji: ReactionEmoji) {
		const email = userStore.email;
		if (!email) {
			toast.info('请先设置邮箱');
			if (onRequestEmail) {
				onRequestEmail();
			}
			return;
		}

		if (isSubmitting === emoji) return;
		isSubmitting = emoji;

		const hasReacted = !!userReacted[emoji];
		const currentCount = reactionsCount[emoji] || 0;

		// 乐观更新
		userReacted[emoji] = !hasReacted;
		reactionsCount[emoji] = Math.max(0, currentCount + (hasReacted ? -1 : 1));

		try {
			if (hasReacted) {
				await api.removeReaction(todoId, emoji, email);
			} else {
				await api.addReaction(todoId, emoji, email);
			}
		} catch (error: any) {
			// 回滚
			userReacted[emoji] = hasReacted;
			reactionsCount[emoji] = currentCount;
			toast.error(error.message || '操作失败');
		} finally {
			isSubmitting = null;
		}
	}

	async function openDetails() {
		isDetailsModalOpen = true;
		isLoadingDetails = true;
		try {
			const res = await api.getReactions(todoId);
			reactionDetails = res.reactions;
		} catch (error: any) {
			toast.error('获取互动详情失败');
		} finally {
			isLoadingDetails = false;
		}
	}

	let totalReactions = $derived(
		Object.values(reactionsCount).reduce((sum, count) => sum + (count || 0), 0)
	);
</script>

<div class="flex flex-wrap items-center gap-1.5 pt-2">
	{#each REACTIONS as item}
		{@const count = reactionsCount[item.emoji] || 0}
		{@const isActive = !!userReacted[item.emoji]}
		<button
			type="button"
			class="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-all duration-150 active:scale-95 cursor-pointer {isActive
				? item.activeClass + ' font-semibold ring-1 ring-current'
				: count > 0
					? 'bg-zinc-50 border-zinc-200/90 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:border-zinc-700 dark:text-zinc-300'
					: 'bg-transparent border-dashed border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:text-zinc-500'}"
			onclick={() => toggleReaction(item.emoji)}
			title={item.label}
		>
			<span class="text-sm leading-none">{item.emoji}</span>
			{#if count > 0}
				<span class="tabular-nums font-mono text-[11px]">{count}</span>
			{/if}
		</button>
	{/each}

	{#if totalReactions > 0}
		<button
			type="button"
			class="inline-flex items-center gap-1 px-1.5 py-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-md transition-colors cursor-pointer"
			onclick={openDetails}
			title="互动详情"
		>
			<Icon icon="lucide:users" class="w-3.5 h-3.5" />
			<span class="text-[11px]">{totalReactions}</span>
		</button>
	{/if}
</div>

<!-- 互动详情 Modal -->
<Modal
	isOpen={isDetailsModalOpen}
	title="互动详情"
	maxWidth="sm"
	onClose={() => (isDetailsModalOpen = false)}
>
	{#if isLoadingDetails}
		<div class="py-6 flex flex-col items-center justify-center gap-2 text-zinc-400">
			<Icon icon="lucide:loader-2" class="w-6 h-6 animate-spin text-zinc-500" />
			<p class="text-xs">加载中...</p>
		</div>
	{:else if reactionDetails.length === 0}
		<p class="text-center py-6 text-sm text-zinc-400">暂无互动</p>
	{:else}
		<div class="space-y-4 max-h-72 overflow-y-auto pr-1">
			{#each reactionDetails as r}
				<div class="border-b border-zinc-100 dark:border-zinc-800 pb-3 last:border-0 last:pb-0">
					<div class="flex items-center gap-2 mb-2">
						<span class="text-base">{r.emoji}</span>
						<span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
							{r.count} 人
						</span>
					</div>
					<div class="flex flex-wrap gap-2 pl-4">
						{#each r.users as u}
							<div
								class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300"
							>
								<Avatar avatar={u.avatar} seed={u.nickname} size="xs" />
								<span>{u.nickname}</span>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</Modal>
