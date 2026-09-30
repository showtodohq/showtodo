<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { toast } from '$lib/stores/toast.svelte';
	import { getSettingsApiKeySeo } from '$lib/constants/seo';
	import { formatRelativeTime } from '$lib/utils/format';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Icon from '@iconify/svelte';

	let { data }: { data: PageData } = $props();

	let isCreatingKey = $state(false);
	let revokingId = $state<string | null>(null);
	let newKeyName = $state('');
	let showCreateModal = $state(false);
	let newlyCreatedToken = $state<string | null>(null);
	let copiedToken = $state(false);
	let copiedConfig = $state(false);
	let showGuide = $state(false);

	async function copyToClipboard(text: string, type: 'token' | 'config') {
		try {
			await navigator.clipboard.writeText(text);
			if (type === 'token') {
				copiedToken = true;
				setTimeout(() => (copiedToken = false), 2000);
			} else {
				copiedConfig = true;
				setTimeout(() => (copiedConfig = false), 2000);
			}
			toast.success('Copied to clipboard!');
		} catch {
			toast.error('Failed to copy to clipboard');
		}
	}

	const sampleConfig = `{
  "mcpServers": {
    "showtodo": {
      "url": "https://showtodo.com/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY_HERE"
      }
    }
  }
}`;
</script>

<SeoHead seo={getSettingsApiKeySeo()} />

<div class="space-y-6">
	<!-- 顶部标题说明与创建按钮 (无边框无背景) -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<div class="p-2 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
					<Icon icon="lucide:sparkles" class="h-4 w-4" />
				</div>
				<h2 class="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
					AI & Model Context Protocol (MCP)
				</h2>
			</div>
			<p class="text-xs text-zinc-500 dark:text-zinc-400">
				Connect Claude, Cursor, or AI agents to manage your todos via standard HTTP/SSE endpoint.
			</p>
		</div>

		<Button
			variant="primary"
			size="sm"
			class="shrink-0 text-xs border-0 bg-zinc-900/90 text-white hover:bg-zinc-900 active:bg-zinc-950 dark:bg-zinc-100/90 dark:text-zinc-900 dark:hover:bg-zinc-100 shadow-none transition-all duration-200 ease-out active:scale-[0.98] group"
			onclick={() => (showCreateModal = true)}
		>
			<Icon icon="lucide:plus" class="h-3.5 w-3.5 mr-1.5 transition-transform duration-200 group-hover:scale-110" />
			New API Key
		</Button>
	</div>

	<!-- 刚刚生成的新 Token 提示 (无边框微背景微动效) -->
	{#if newlyCreatedToken}
		<div class="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 space-y-2 border-0 animate-in fade-in zoom-in-95 duration-150">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-1.5 font-semibold text-xs text-amber-700 dark:text-amber-300">
					<Icon icon="lucide:alert-triangle" class="h-4 w-4" />
					<span>Save your API Key now</span>
				</div>
				<button
					type="button"
					onclick={() => (newlyCreatedToken = null)}
					class="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer transition-colors"
				>
					Dismiss
				</button>
			</div>
			<p class="text-xs text-zinc-600 dark:text-zinc-400">
				For security, this token is only shown once. Copy and store it in your AI client configuration.
			</p>
			<div class="flex items-center gap-2 pt-1">
				<code class="flex-1 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-zinc-800/90 font-mono text-xs text-zinc-800 dark:text-zinc-200 select-all truncate">
					{newlyCreatedToken}
				</code>
				<Button
					variant="secondary"
					size="sm"
					class="border-0 bg-white/90 hover:bg-white text-zinc-800 dark:bg-zinc-800/90 dark:hover:bg-zinc-800 dark:text-zinc-100 shadow-none transition-all duration-200 ease-out active:scale-[0.98]"
					onclick={() => copyToClipboard(newlyCreatedToken!, 'token')}
				>
					{#if copiedToken}
						<Icon icon="lucide:check" class="h-3.5 w-3.5 mr-1" />
						Copied
					{:else}
						<Icon icon="lucide:copy" class="h-3.5 w-3.5 mr-1" />
						Copy
					{/if}
				</Button>
			</div>
		</div>
	{/if}

	<!-- 1:N API Key 列表 (无边框无背景) -->
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<h3 class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
				Active API Keys ({data.apiKeys?.length ?? 0})
			</h3>
		</div>

		{#if !data.apiKeys || data.apiKeys.length === 0}
			<div class="p-8 text-center space-y-2">
				<div class="w-10 h-10 rounded-full bg-zinc-100/70 dark:bg-zinc-800/50 flex items-center justify-center mx-auto text-zinc-400">
					<Icon icon="lucide:key" class="h-5 w-5" />
				</div>
				<p class="text-xs font-medium text-zinc-700 dark:text-zinc-300">
					No active API keys yet
				</p>
				<p class="text-[11px] text-zinc-400 max-w-xs mx-auto">
					Generate an API key above to allow Cursor or Claude to manage and inspect your todos.
				</p>
			</div>
		{:else}
			<div class="divide-y divide-zinc-100 dark:divide-zinc-800/60">
				{#each data.apiKeys as key (key.id)}
					<div class="py-3 sm:px-2 flex items-center justify-between gap-4 transition-colors rounded-xl hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
						<div class="space-y-1 min-w-0">
							<div class="flex items-center gap-2">
								<span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
									{key.name}
								</span>
								<span class="px-2 py-0.5 rounded-md bg-zinc-100/80 dark:bg-zinc-800/70 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
									{key.prefix}
								</span>
							</div>
							<div class="flex items-center gap-3 text-[11px] text-zinc-400 dark:text-zinc-500">
								<span>Created {formatRelativeTime(key.createdAt)}</span>
								<span>•</span>
								<span>
									Last active: {key.lastUsedAt ? formatRelativeTime(key.lastUsedAt) : 'Never used'}
								</span>
							</div>
						</div>

						<form
							method="POST"
							action="?/revokeApiKey"
							use:enhance={({ cancel }) => {
								if (!confirm(`Are you sure you want to revoke key "${key.name}"?`)) {
									cancel();
									return;
								}
								revokingId = key.id;
								return async ({ result, update }) => {
									try {
										if (result.type === 'success') {
											toast.success('API Key revoked.');
										} else if (result.type === 'failure') {
											const resData = result.data as { revokeError?: string } | undefined;
											toast.error(resData?.revokeError || 'Failed to revoke API key');
										} else if (result.type === 'error') {
											toast.error(result.error?.message || 'Failed to revoke API key');
										}
										await update();
									} finally {
										revokingId = null;
									}
								};
							}}
						>
							<input type="hidden" name="id" value={key.id} />
							<Button
								type="submit"
								variant="ghost"
								size="xs"
								loading={revokingId === key.id}
								disabled={revokingId !== null}
								class="border-0 bg-rose-50/70 text-rose-600 hover:bg-rose-100/80 hover:text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/50 text-xs shadow-none transition-all duration-200 ease-out active:scale-[0.96]"
							>
								Revoke
							</Button>
						</form>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- 渐进式呈现：展开接入指引 (无边框无背景) -->
	<div class="pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
		<button
			type="button"
			onclick={() => (showGuide = !showGuide)}
			class="flex items-center justify-between w-full text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 py-2 cursor-pointer group transition-colors"
		>
			<span class="flex items-center gap-1.5">
				<Icon icon="lucide:book-open" class="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
				<span>How to configure in Cursor / Claude Desktop</span>
			</span>
			<Icon
				icon="lucide:chevron-down"
				class="h-4 w-4 transition-transform duration-200 {showGuide ? 'rotate-180' : ''}"
			/>
		</button>

		{#if showGuide}
			<div class="mt-3 p-4 rounded-2xl bg-zinc-100/60 dark:bg-zinc-800/40 border-0 space-y-3 animate-in fade-in duration-150">
				<p class="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
					Add ShowTodo as a remote MCP server in your client settings (e.g. Cursor <code class="px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-700 text-[11px]">Settings &gt; Features &gt; MCP</code>):
				</p>

				<div class="relative">
					<pre class="p-3 rounded-xl bg-zinc-900 text-zinc-100 font-mono text-[11px] overflow-x-auto leading-relaxed">{sampleConfig}</pre>
					<button
						type="button"
						onclick={() => copyToClipboard(sampleConfig, 'config')}
						class="absolute top-2 right-2 px-2.5 py-1 rounded-lg border-0 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-medium transition-all duration-200 ease-out active:scale-[0.96] flex items-center gap-1 cursor-pointer"
					>
						{#if copiedConfig}
							<Icon icon="lucide:check" class="h-3 w-3" />
							<span>Copied</span>
						{:else}
							<Icon icon="lucide:copy" class="h-3 w-3" />
							<span>Copy JSON</span>
						{/if}
					</button>
				</div>

				<p class="text-[11px] text-zinc-500 dark:text-zinc-400">
					Available capabilities include creating todos, listing personal tasks, logging progress milestones, discovering public peer topics, and cheering companions.
				</p>
			</div>
		{/if}
	</div>
</div>

<!-- 创建 API Key 弹窗 Modal -->
<Modal
	bind:open={showCreateModal}
	title="Create new API Key"
	description="Assign a label for the client or device using this token (e.g. 'Cursor - MacBook')."
	size="md"
>
	<form
		method="POST"
		action="?/createApiKey"
		use:enhance={() => {
			isCreatingKey = true;
			return async ({ result, update }) => {
				try {
					if (result.type === 'success') {
						const resData = result.data as { rawToken?: string; keyName?: string } | undefined;
						if (resData?.rawToken) {
							newlyCreatedToken = resData.rawToken;
							showCreateModal = false;
							newKeyName = '';
							toast.success('API Key created successfully!');
						}
					} else if (result.type === 'failure') {
						const resData = result.data as { createError?: string } | undefined;
						toast.error(resData?.createError || 'Failed to create API key');
					} else if (result.type === 'error') {
						toast.error(result.error?.message || 'Failed to create API key');
					}
					await update();
				} finally {
					isCreatingKey = false;
				}
			};
		}}
		class="space-y-4"
	>
		<Input
			size="md"
			label="Key Label / Device Name"
			placeholder="e.g. Cursor Pro, Claude Desktop"
			name="name"
			bind:value={newKeyName}
			required
		/>

		<div class="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
			<Button
				type="button"
				variant="secondary"
				size="sm"
				class="border-0 bg-zinc-100/70 hover:bg-zinc-200/70 active:bg-zinc-200 text-zinc-700 dark:bg-zinc-800/50 dark:hover:bg-zinc-700/60 dark:text-zinc-300 shadow-none transition-all duration-200 ease-out active:scale-[0.98]"
				onclick={() => (showCreateModal = false)}
			>
				Cancel
			</Button>
			<Button
				type="submit"
				variant="primary"
				size="sm"
				loading={isCreatingKey}
				disabled={isCreatingKey || !newKeyName.trim()}
				class="border-0 bg-zinc-900/90 text-white hover:bg-zinc-900 active:bg-zinc-950 dark:bg-zinc-100/90 dark:text-zinc-900 dark:hover:bg-zinc-100 shadow-none transition-all duration-200 ease-out active:scale-[0.98]"
			>
				Generate Key
			</Button>
		</div>
	</form>
</Modal>
