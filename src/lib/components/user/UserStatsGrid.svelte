<script lang="ts">
	import type { TodoStatus } from '$lib/types/todo';
	import { getStatusConfig } from '$lib/constants/status';

	interface Props {
		totalCount?: number;
		statusCounts?: Record<TodoStatus, number>;
		completionRate?: number;
	}

	let {
		totalCount = 0,
		statusCounts = { pending: 0, in_progress: 0, done: 0, abandoned: 0 },
		completionRate = 0
	}: Props = $props();
</script>

<div
	class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-t border-zinc-200/60 dark:border-zinc-800/60 pt-6 mt-6"
>
	<div class="space-y-0.5">
		<div class="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
			{totalCount}
		</div>
		<div class="text-xs text-zinc-400 font-medium">累计待办</div>
	</div>
	<div class="space-y-0.5">
		<div class="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
			{statusCounts.done || 0}
		</div>
		<div class="text-xs text-zinc-400 font-medium">{getStatusConfig('done').label}</div>
	</div>
	<div class="space-y-0.5">
		<div class="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
			{statusCounts.in_progress || 0}
		</div>
		<div class="text-xs text-zinc-400 font-medium">{getStatusConfig('in_progress').label}</div>
	</div>
	<div class="space-y-0.5">
		<div class="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
			{completionRate}%
		</div>
		<div class="text-xs text-zinc-400 font-medium">完成率</div>
	</div>
</div>
