<script lang="ts">
	import type { TodoActivity, TodoStatus } from '$lib/types/todo';
	import { getStatusConfig } from '$lib/constants/status';
	import { formatRelativeTime } from '$lib/utils/format';

	interface Props {
		activities?: TodoActivity[];
		isLoading?: boolean;
	}

	let { activities = [], isLoading = false }: Props = $props();

	const sortedActivities = $derived(
		[...activities].sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		)
	);
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between px-1">
		<h2 class="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
			🌱 成长动态与打卡记录 ({isLoading && sortedActivities.length === 0 ? '...' : sortedActivities.length})
		</h2>
	</div>

	{#if isLoading && sortedActivities.length === 0}
		<div
			class="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800 animate-pulse"
			aria-busy="true"
		>
			{#each Array(2) as _, i (i)}
				<div class="relative">
					<div class="absolute -left-6 top-1 h-5 w-5 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80"></div>
					<div
						class="p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/60 space-y-2"
					>
						<div class="h-3 w-28 bg-zinc-200/80 dark:bg-zinc-800/80 rounded"></div>
						<div class="h-2.5 w-48 bg-zinc-200/60 dark:bg-zinc-800/60 rounded"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if sortedActivities.length === 0}
		<div
			class="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800/80 py-10 text-center text-xs text-zinc-400"
		>
			暂无动态记录
		</div>
	{:else}
		<div
			class="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800"
		>
			{#each sortedActivities as act (act.id)}
				<div class="relative group/act">
					<!-- 轴点图标 -->
					<div
						class="absolute -left-6 top-0.5 h-5 w-5 rounded-full bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px]"
					>
						{#if act.type === 'created'}
							<span>🚀</span>
						{:else if act.type === 'status_change'}
							<span>🔄</span>
						{:else}
							<span>🌱</span>
						{/if}
					</div>

					<!-- 动态内容卡片 -->
					<div
						class="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/60 space-y-1"
					>
						<div class="flex items-center justify-between text-[11px]">
							<span class="font-semibold text-zinc-800 dark:text-zinc-200">
								{#if act.type === 'created'}
									创建待办
								{:else if act.type === 'status_change'}
									状态变更为
									<span class="font-medium text-zinc-900 dark:text-zinc-100">
										「{getStatusConfig(act.toStatus || 'pending').label}」
									</span>
								{:else}
									记录进展
								{/if}
							</span>
							<span class="font-mono text-zinc-400">
								{formatRelativeTime(act.createdAt)}
							</span>
						</div>

						{#if act.content}
							<p
								class="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed break-words pt-0.5"
							>
								{act.content}
							</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
