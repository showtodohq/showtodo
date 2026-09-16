<script lang="ts">
	import type { TodoActivity, TodoStatus } from '$lib/types/todo';
	import { getStatusConfig } from '$lib/constants/status';
	import { formatRelativeTime } from '$lib/utils/format';
	import Icon from '@iconify/svelte';

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
		<h2 class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
			<Icon icon="lucide:activity" class="h-3.5 w-3.5" />
			<span>Activity & Check-in History ({isLoading && sortedActivities.length === 0 ? '...' : sortedActivities.length})</span>
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
						class="py-2 px-3 rounded-xl space-y-2"
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
			No activity records yet
		</div>
	{:else}
		<div
			class="relative pl-6 space-y-2 sm:space-y-2.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800"
		>
			{#each sortedActivities as act (act.id)}
				<div class="relative group/act">
					<!-- Dot icon -->
					<div
						class="absolute -left-6 top-1 h-5 w-5 rounded-full bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-500"
					>
						{#if act.type === 'created'}
							<Icon icon="lucide:plus" class="h-3 w-3 text-blue-500" />
						{:else if act.type === 'status_change'}
							<Icon icon="lucide:refresh-cw" class="h-2.5 w-2.5 text-amber-500" />
						{:else}
							<Icon icon="lucide:check-circle-2" class="h-3 w-3 text-emerald-500" />
						{/if}
					</div>

					<!-- Activity content -->
					<div
						class="py-2 px-3 rounded-xl transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 space-y-1"
					>
						<div class="flex items-center justify-between text-[11px]">
							<span class="font-semibold text-zinc-800 dark:text-zinc-200">
								{#if act.type === 'created'}
									Created todo
								{:else if act.type === 'status_change'}
									Status changed to
									<span class="font-medium text-zinc-900 dark:text-zinc-100">
										"{getStatusConfig(act.toStatus || 'pending').label}"
									</span>
								{:else}
									Logged progress
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
