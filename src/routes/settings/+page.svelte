<script lang="ts">
	import type { PageData } from './$types';
	import { userStore } from '$lib/stores/user.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { THEME_MODE_TABS } from '$lib/constants/tabs';
	import { getSettingsSeo } from '$lib/constants/seo';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import Icon from '@iconify/svelte';

	let { data }: { data: PageData } = $props();

	const hasPassword = $derived(data.hasPassword);
	const apiKeysCount = $derived(data.apiKeys?.length ?? 0);
	const profileUrl = $derived(`/@${userStore.handle || userStore.id}`);
</script>

<SeoHead seo={getSettingsSeo()} />

<div class="space-y-8">
	<!-- 模块 1: 个人资料概览 (无边框无背景) -->
	<section class="space-y-4">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<div class="flex items-center gap-4">
				<Avatar
					src={userStore.avatar}
					name={userStore.nickname}
					size="lg"
					class="shrink-0"
				/>
				<div class="min-w-0">
					<div class="flex items-center gap-2 flex-wrap">
						<h2 class="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
							{userStore.nickname}
						</h2>
						{#if userStore.handle}
							<span class="text-xs font-mono text-zinc-400 dark:text-zinc-500">
								@{userStore.handle}
							</span>
						{/if}
					</div>
					<p class="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate mt-0.5">
						{userStore.email}
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<Button
					variant="secondary"
					size="sm"
					href={profileUrl}
					class="text-xs border-0 bg-zinc-100/70 hover:bg-zinc-200/70 active:bg-zinc-200 text-zinc-700 hover:text-zinc-900 dark:bg-zinc-800/50 dark:hover:bg-zinc-700/60 dark:text-zinc-300 dark:hover:text-zinc-100 shadow-none transition-all duration-200 ease-out active:scale-[0.98] group"
				>
					<Icon icon="lucide:user" class="h-3.5 w-3.5 mr-1.5 text-zinc-400 transition-transform duration-200 group-hover:scale-110" />
					Public Profile
				</Button>
				<Button
					variant="secondary"
					size="sm"
					href={`${profileUrl}/todolist`}
					class="text-xs border-0 bg-zinc-100/70 hover:bg-zinc-200/70 active:bg-zinc-200 text-zinc-700 hover:text-zinc-900 dark:bg-zinc-800/50 dark:hover:bg-zinc-700/60 dark:text-zinc-300 dark:hover:text-zinc-100 shadow-none transition-all duration-200 ease-out active:scale-[0.98] group"
				>
					<Icon icon="lucide:check-square" class="h-3.5 w-3.5 mr-1.5 text-zinc-400 transition-transform duration-200 group-hover:scale-110" />
					Todo List
				</Button>
			</div>
		</div>
	</section>

	<!-- 模块 2: 核心安全与集成状态网格 (无边框无背景) -->
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/60">
		<!-- 密码与认证区 -->
		<div class="flex flex-col justify-between space-y-4">
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<div class="p-2 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300">
						<Icon icon="lucide:key-round" class="h-4 w-4" />
					</div>
					{#if hasPassword}
						<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50/70 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
							<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
							Active
						</span>
					{:else}
						<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50/70 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
							<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
							Not configured
						</span>
					{/if}
				</div>
				<div>
					<h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">
						Password & Security
					</h3>
					<p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
						{hasPassword
							? 'Your password is active. You can sign in using your email and password anytime.'
							: 'Create a password to enable email & password sign-in alongside OAuth.'}
					</p>
				</div>
			</div>

			<div class="pt-2">
				<Button
					variant="secondary"
					size="sm"
					href="/settings/password"
					class="w-full text-xs justify-between border-0 bg-zinc-100/70 hover:bg-zinc-200/70 active:bg-zinc-200 dark:bg-zinc-800/50 dark:hover:bg-zinc-700/60 text-zinc-800 dark:text-zinc-200 shadow-none transition-all duration-200 ease-out active:scale-[0.98] group"
				>
					<span>{hasPassword ? 'Change Password' : 'Set Password'}</span>
					<Icon icon="lucide:arrow-right" class="h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 group-hover:translate-x-1" />
				</Button>
			</div>
		</div>

		<!-- AI & MCP API Keys 区 -->
		<div class="flex flex-col justify-between space-y-4">
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<div class="p-2 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
						<Icon icon="lucide:sparkles" class="h-4 w-4" />
					</div>
					<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100/70 dark:bg-zinc-800/50">
						{apiKeysCount} {apiKeysCount === 1 ? 'key' : 'keys'}
					</span>
				</div>
				<div>
					<h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">
						AI & MCP API Keys
					</h3>
					<p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
						Connect Claude, Cursor, and custom autonomous agents to manage your todos via Model Context Protocol.
					</p>
				</div>
			</div>

			<div class="pt-2">
				<Button
					variant="secondary"
					size="sm"
					href="/settings/apikey"
					class="w-full text-xs justify-between border-0 bg-zinc-100/70 hover:bg-zinc-200/70 active:bg-zinc-200 dark:bg-zinc-800/50 dark:hover:bg-zinc-700/60 text-zinc-800 dark:text-zinc-200 shadow-none transition-all duration-200 ease-out active:scale-[0.98] group"
				>
					<span>Manage API Keys</span>
					<Icon icon="lucide:arrow-right" class="h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 group-hover:translate-x-1" />
				</Button>
			</div>
		</div>
	</div>

	<!-- 模块 3: 外观偏好设置 (无边框无背景) -->
	<section class="pt-6 border-t border-zinc-100 dark:border-zinc-800/60">
		<div class="flex items-center justify-between gap-4 flex-wrap">
			<div class="space-y-0.5">
				<div class="flex items-center gap-2">
					<Icon icon="lucide:palette" class="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
					<h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">
						Appearance & Theme
					</h3>
				</div>
				<p class="text-xs text-zinc-500 dark:text-zinc-400">
					Choose light, dark, or sync with your operating system preference.
				</p>
			</div>

			<Tabs
				options={THEME_MODE_TABS}
				value={theme.mode}
				onchange={(val) => theme.setMode(val)}
				size="sm"
			/>
		</div>
	</section>
</div>
