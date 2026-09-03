<script lang="ts">
	import type { TopicParticipant, TodoStatus } from '$lib/types/todo';
	import { getStatusConfig } from '$lib/constants/status';
	import { formatRelativeTime } from '$lib/utils/format';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import TodoCheckbox from '$lib/components/todo/TodoCheckbox.svelte';

	interface Props {
		participants?: TopicParticipant[];
		currentUserId?: string;
		onstatuschange?: (nextStatus: TodoStatus, e?: MouseEvent) => void;
	}

	let { participants = [], currentUserId, onstatuschange }: Props = $props();
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between px-1">
		<h2
			class="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
		>
			同行伙伴 ({participants.length})
		</h2>
	</div>

	<div class="space-y-2.5">
		{#each participants as p (p.user.id)}
			{@const isSelf = Boolean(currentUserId && p.user.id === currentUserId)}
			<div
				class="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xs flex items-start justify-between gap-4 transition-colors {isSelf
					? 'ring-2 ring-blue-500/20 dark:ring-blue-400/20'
					: ''}"
			>
				<div class="flex items-start gap-3.5 min-w-0 flex-1">
					<a
						href="/users/{p.user.handle || p.user.id}"
						class="shrink-0 group/avatar"
					>
						<Avatar
							src={p.user.avatar}
							alt={p.user.nickname}
							size="md"
						/>
					</a>

					<div class="space-y-1.5 min-w-0 flex-1">
						<div class="flex items-center gap-2 flex-wrap">
							<a
								href="/users/{p.user.handle || p.user.id}"
								class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 transition-colors"
							>
								{p.user.nickname}
							</a>

							<span class="text-xs text-zinc-400 font-mono">
								@{p.user.handle}
							</span>

							{#if isSelf}
								<span
									class="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium"
								>
									我
								</span>
							{/if}

							<span class="text-[11px] text-zinc-400">
								· 加入于 {formatRelativeTime(p.createdAt)}
							</span>
						</div>

						<!-- 个人公开备注 -->
						{#if p.note}
							<p
								class="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-100/70 dark:bg-zinc-800/50 rounded-lg p-2 leading-relaxed break-words"
							>
								{p.note}
							</p>
						{/if}

						<!-- 查看此条待办详情直达链接 -->
						<div class="pt-1">
							<a
								href="/todos/{p.shortId || p.todoId}"
								class="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:underline"
							>
								查看打卡动态时间线 →
							</a>
						</div>
					</div>
				</div>

				<!-- 右侧：状态指示与复选打卡 -->
				<div class="flex flex-col items-end gap-2 shrink-0">
					<span
						class="px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusConfig(
							p.status
						).bgClass} {getStatusConfig(p.status).textClass} border {getStatusConfig(
							p.status
						).borderClass}"
					>
						{getStatusConfig(p.status).label}
					</span>

					{#if isSelf}
						<TodoCheckbox
							status={p.status}
							isMine={true}
							size="md"
							ontoggle={onstatuschange}
						/>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
