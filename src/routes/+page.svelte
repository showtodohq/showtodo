<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import {
		insertItem,
		updateItem,
		removeItem,
		optimisticAction
	} from '$lib/utils/mutation';

	// ---------------------------------------------------------------------------
	// 交互状态 (Svelte 5 Runes)
	// ---------------------------------------------------------------------------
	let testModalOpen = $state(false);
	let testInputVal = $state('');
	let testSelectVal = $state('option1');
	let testCheckboxVal = $state(true);

	// ---------------------------------------------------------------------------
	// 本地更新与乐观更新演示数据 (Local Mutation State)
	// ---------------------------------------------------------------------------
	interface LocalDemoItem {
		id: string;
		title: string;
		completed: boolean;
		count: number;
	}

	let localItems = $state<LocalDemoItem[]>([
		{ id: '1', title: '体验 Svelte 5 Runes 细粒度响应式代理', completed: true, count: 5 },
		{ id: '2', title: '验证 0ms 本地就地变异，无需重新请求 API', completed: false, count: 2 },
		{ id: '3', title: '测试乐观更新失败自动安全回滚机制', completed: false, count: 0 }
	]);
	let newItemTitle = $state('');

	// 1. 本地直接添加 (insertItem)
	function handleAddItem() {
		if (!newItemTitle.trim()) return;
		const newItem: LocalDemoItem = {
			id: String(Date.now()),
			title: newItemTitle.trim(),
			completed: false,
			count: 0
		};
		insertItem(localItems, newItem, 'start');
		newItemTitle = '';
		toast.success('本地添加成功（0ms 响应，未请求全量列表）');
	}

	// 2. 本地直接修改状态 (updateItem)
	function handleToggleItem(id: string) {
		updateItem(localItems, id, (item) => ({
			completed: !item.completed
		}));
		toast.info('本地状态已更新');
	}

	// 3. 本地直接删除 (removeItem)
	function handleDeleteItem(id: string) {
		const removed = removeItem(localItems, id);
		if (removed) {
			toast.warning(`已从本地移除: ${removed.title}`);
		}
	}

	// 4. 乐观更新演示：点赞与模拟网络失败自动回滚
	async function handleOptimisticLike(id: string, simulateFailure = false) {
		const item = localItems.find((i) => i.id === id);
		if (!item) return;

		const prevCount = item.count;

		try {
			await optimisticAction({
				apply: () => {
					// 0ms 立即在本地增加点赞数
					item.count += 1;
				},
				rollback: () => {
					// 失败时自动回滚到原数值
					item.count = prevCount;
				},
				action: async () => {
					// 模拟网络延迟
					await new Promise((resolve) => setTimeout(resolve, 600));
					if (simulateFailure) {
						throw new Error('模拟网络超时或服务端异常');
					}
					return { success: true };
				},
				onError: (err) => {
					toast.error(`操作失败并已自动回滚: ${(err as Error).message}`);
				}
			});
			toast.success('点赞成功（乐观更新即时生效）');
		} catch {
			// error handled by onError
		}
	}
</script>

<div class="space-y-8">
	<!-- 1. 框架就绪 Banner -->
	<div class="rounded-2xl border border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6 sm:p-8 shadow-xs">
		<div class="flex items-center gap-2 mb-2">
			<Badge variant="success" dot size="sm">开发框架已就绪</Badge>
			<Badge variant="neutral" size="sm">Svelte 5 Runes</Badge>
			<Badge variant="neutral" size="sm">Tailwind CSS v4</Badge>
		</div>
		<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
			ptdl-alpha 前端工程开发框架
		</h1>
		<p class="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
			采用极简单列居中布局 (<code>max-w-3xl sm:max-w-4xl</code>)、极简 Header、移动端抽屉导航，内置纯净原子 UI 组件体系与 Svelte 5 本地响应式变异工具库。
		</p>
	</div>

	<!-- 2. 本地更新与乐观更新机制演示 (Core Feature Demo) -->
	<Card hoverable={false}>
		{#snippet header()}
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">
						本地就地更新与乐观回滚 (Local Mutation Playground)
					</h3>
					<p class="text-xs text-zinc-400 mt-0.5">
						数据变更时纯本地 0ms 更新 Svelte 5 细粒度代理状态，无需重新全量拉取 API
					</p>
				</div>
				<Badge variant="primary" size="xs">mutation.ts</Badge>
			</div>
		{/snippet}

		<div class="space-y-4">
			<!-- 快速本地添加 -->
			<form
				onsubmit={(e) => { e.preventDefault(); handleAddItem(); }}
				class="flex gap-2"
			>
				<Input
					placeholder="输入测试项内容，体验 0ms 本地插入..."
					bind:value={newItemTitle}
					size="sm"
				/>
				<Button type="submit" size="sm" variant="primary" disabled={!newItemTitle.trim()}>
					本地添加
				</Button>
			</form>

			<!-- 本地数据列表 -->
			<div class="divide-y divide-zinc-100 dark:divide-zinc-800/80 rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden bg-zinc-50/40 dark:bg-zinc-900/40">
				{#each localItems as item (item.id)}
					<div class="flex items-center justify-between p-3.5 gap-3 transition-colors hover:bg-white dark:hover:bg-zinc-800/60">
						<div class="flex items-center gap-3 min-w-0">
							<Checkbox
								checked={item.completed}
								onchange={() => handleToggleItem(item.id)}
							/>
							<span class="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate {item.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}">
								{item.title}
							</span>
						</div>

						<div class="flex items-center gap-1.5 shrink-0">
							<!-- 成功乐观点赞 -->
							<Button
								size="xs"
								variant="secondary"
								onclick={() => handleOptimisticLike(item.id, false)}
								title="0ms 乐观更新成功"
							>
								🔥 {item.count}
							</Button>

							<!-- 失败自动回滚测试 -->
							<Button
								size="xs"
								variant="ghost"
								onclick={() => handleOptimisticLike(item.id, true)}
								title="测试网络失败自动回滚"
								class="text-[11px] text-zinc-400 hover:text-red-500"
							>
								模拟失败回滚
							</Button>

							<!-- 本地移除 -->
							<Button
								size="xs"
								variant="ghost"
								onclick={() => handleDeleteItem(item.id)}
								class="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
							>
								✕
							</Button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</Card>

	<!-- 3. 原子 UI 组件库规范预览 (Primitive Components Gallery) -->
	<div class="space-y-6">
		<h3 class="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
			通用原子 UI 组件库 (UI Primitives Gallery)
		</h3>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<!-- 按钮体系 -->
			<Card>
				{#snippet header()}
					<h4 class="text-xs font-bold text-zinc-800 dark:text-zinc-200">Button 按钮变体</h4>
				{/snippet}
				<div class="flex flex-wrap gap-2">
					<Button variant="primary" size="sm">Primary</Button>
					<Button variant="secondary" size="sm">Secondary</Button>
					<Button variant="outline" size="sm">Outline</Button>
					<Button variant="ghost" size="sm">Ghost</Button>
					<Button variant="danger" size="sm">Danger</Button>
					<Button variant="primary" size="sm" loading>Loading</Button>
				</div>
			</Card>

			<!-- 徽章体系 -->
			<Card>
				{#snippet header()}
					<h4 class="text-xs font-bold text-zinc-800 dark:text-zinc-200">Badge 徽章与标签</h4>
				{/snippet}
				<div class="flex flex-wrap gap-1.5">
					<Badge variant="neutral">Neutral</Badge>
					<Badge variant="primary" dot>Primary</Badge>
					<Badge variant="success" dot>Success</Badge>
					<Badge variant="warning" dot>Warning</Badge>
					<Badge variant="danger" dot>Danger</Badge>
					<Badge variant="purple">Purple</Badge>
					<Badge variant="pink">Pink</Badge>
				</div>
			</Card>

			<!-- 表单输入体系 -->
			<Card>
				{#snippet header()}
					<h4 class="text-xs font-bold text-zinc-800 dark:text-zinc-200">Input & Select 控件</h4>
				{/snippet}
				<div class="space-y-3">
					<Input
						size="sm"
						label="输入框"
						placeholder="请输入内容..."
						bind:value={testInputVal}
						helperText="支持错误高亮、图标与尺寸切换"
					/>
					<Select
						size="sm"
						label="下拉选择"
						bind:value={testSelectVal}
						options={[
							{ value: 'option1', label: '选项一 (Option 1)' },
							{ value: 'option2', label: '选项二 (Option 2)' },
							{ value: 'option3', label: '选项三 (Option 3)' }
						]}
					/>
				</div>
			</Card>

			<!-- 头像与浮动反馈 -->
			<Card>
				{#snippet header()}
					<h4 class="text-xs font-bold text-zinc-800 dark:text-zinc-200">Avatar & Feedback</h4>
				{/snippet}
				<div class="space-y-4">
					<div class="flex items-center gap-2.5">
						<Avatar name="Alex" size="xs" />
						<Avatar name="Sarah" size="sm" status="online" />
						<Avatar name="Chen" size="md" status="busy" />
						<Avatar name="Lin" size="lg" status="offline" />
					</div>
					<div class="flex flex-wrap gap-2 pt-2">
						<Button
							size="xs"
							variant="secondary"
							onclick={() => toast.success('操作成功通知！')}
						>
							Toast 成功
						</Button>
						<Button
							size="xs"
							variant="secondary"
							onclick={() => toast.error('网络请求失败示例')}
						>
							Toast 错误
						</Button>
						<Button
							size="xs"
							variant="outline"
							onclick={() => (testModalOpen = true)}
						>
							打开 Modal
						</Button>
					</div>
				</div>
			</Card>
		</div>
	</div>

	<!-- 通用 Modal 测试 -->
	<Modal
		bind:open={testModalOpen}
		title="通用对话框示例 (Modal Component)"
		description="基于 Svelte 5 构建，支持 ESC 关闭、背景点击遮罩关闭与过渡动效。"
	>
		<p class="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
			这是通用原子弹窗组件，可用于后续各类交互详情、确认操作与表单弹窗。
		</p>

		{#snippet footer()}
			<Button variant="secondary" size="sm" onclick={() => (testModalOpen = false)}>
				关闭
			</Button>
			<Button variant="primary" size="sm" onclick={() => { toast.success('已确认'); testModalOpen = false; }}>
				确认
			</Button>
		{/snippet}
	</Modal>
</div>
