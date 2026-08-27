<script lang="ts">
	import { api } from '$lib/services/api';
	import { toast } from '$lib/stores/toast.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import type { Author, Todo } from '$lib/types/todo';
	import type { UserProfile } from '$lib/types/user';
	import { addWeeks, formatDateISO, getWeekDates } from '$lib/utils/calendar';

	import CalendarToolbar from '$lib/components/calendar/CalendarToolbar.svelte';
	import CalendarMatrix from '$lib/components/calendar/CalendarMatrix.svelte';
	import CategoryLegend from '$lib/components/calendar/CategoryLegend.svelte';
	import TodoDetailModal from '$lib/components/todo/TodoDetailModal.svelte';
	import EditTodoModal from '$lib/components/todo/EditTodoModal.svelte';
	import DayTodosModal from '$lib/components/todo/DayTodosModal.svelte';
	import CreateTodoModal from '$lib/components/todo/CreateTodoModal.svelte';
	import UserProfileModal from '$lib/components/user/UserProfileModal.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import Icon from '@iconify/svelte';

	// 日历时间状态：当前基准日期
	let baseDate = $state<Date>(new Date());
	const weekDates = $derived(getWeekDates(baseDate));
	const startDateFrom = $derived(formatDateISO(weekDates[0]));
	const startDateTo = $derived(formatDateISO(weekDates[6]));

	// 分类筛选
	let selectedCategory = $state<string | 'all'>('all');

	// 数据状态
	let users = $state<UserProfile[]>([]);
	let todos = $state<Todo[]>([]);
	let isLoading = $state(true);
	let isLoadingMoreUsers = $state(false);
	let hasMoreUsers = $state(false);
	let userOffset = $state(0);
	const userLimit = 20;

	// 弹窗状态
	let activeDetailTodo = $state<Todo | null>(null);
	let isDetailModalOpen = $state(false);

	let activeEditTodo = $state<Todo | null>(null);
	let isEditModalOpen = $state(false);

	let dayModalUser = $state<UserProfile | null>(null);
	let dayModalDateStr = $state('');
	let isDayModalOpen = $state(false);

	const dayModalTodos = $derived.by(() => {
		if (!dayModalUser || !dayModalDateStr) return [];
		return todos.filter(
			(t) =>
				(t.authorId === dayModalUser?.id || t.author?.id === dayModalUser?.id) &&
				t.startDate === dayModalDateStr
		);
	});

	let isUserProfileModalOpen = $state(false);

	// 当基准周或分类改变时重新拉取数据
	$effect(() => {
		const from = startDateFrom;
		const to = startDateTo;
		const cat = selectedCategory;
		const myId = userStore.id;

		loadCalendarData(true);
	});

	async function loadCalendarData(reset = false) {
		if (reset) {
			isLoading = true;
			userOffset = 0;
		} else {
			isLoadingMoreUsers = true;
		}

		try {
			const res = await api.getCalendarWeekData({
				startDateFrom,
				startDateTo,
				limit: userLimit,
				offset: reset ? 0 : userOffset,
				currentUserId: userStore.id || undefined,
				category: selectedCategory !== 'all' ? selectedCategory : undefined
			});

			if (reset) {
				users = res.users;
				todos = res.todos;
			} else {
				const existingUserIds = new Set(users.map((u) => u.id));
				const newUsers = res.users.filter((u) => !existingUserIds.has(u.id));
				users = [...users, ...newUsers];

				const existingTodoIds = new Set(todos.map((t) => t.id));
				const newTodos = res.todos.filter((t) => !existingTodoIds.has(t.id));
				todos = [...todos, ...newTodos];
			}

			hasMoreUsers = res.hasMoreUsers;
			userOffset = reset ? res.users.length : userOffset + res.users.length;
		} catch (error: any) {
			toast.error(error.message || '加载日历数据失败');
		} finally {
			isLoading = false;
			isLoadingMoreUsers = false;
		}
	}

	// 周导航
	function handlePrevWeek() {
		baseDate = addWeeks(baseDate, -1);
	}

	function handleNextWeek() {
		baseDate = addWeeks(baseDate, 1);
	}

	function handleToday() {
		baseDate = new Date();
	}

	function handleSelectDate(selectedDate: Date) {
		baseDate = selectedDate;
	}

	// 待办卡片选择
	function handleSelectTodo(todo: Todo) {
		activeDetailTodo = todo;
		isDetailModalOpen = true;
	}

	// 打开单天全部待办
	function handleOpenDayTodos(user: UserProfile, dateStr: string) {
		dayModalUser = user;
		dayModalDateStr = dateStr;
		isDayModalOpen = true;
	}

	// 快速在某天新建
	function handleQuickCreate(user: UserProfile, dateStr: string) {
		uiStore.openCreateTodo(dateStr);
	}

	// 待办更新后更新本地状态
	function handleTodoUpdated(updatedTodo: Todo) {
		todos = todos.map((t) => (t.id === updatedTodo.id ? updatedTodo : t));
		if (activeDetailTodo?.id === updatedTodo.id) {
			activeDetailTodo = updatedTodo;
		}
		if (activeEditTodo?.id === updatedTodo.id) {
			activeEditTodo = updatedTodo;
		}
	}

	// 待办创建后更新本地状态
	function handleTodoCreated(newTodo: Todo, author: Author) {
		const fullTodo: Todo = {
			...newTodo,
			author: {
				id: author.id,
				handle: author.handle,
				nickname: author.nickname,
				avatar: author.avatar
			},
			reactions: {}
		};

		todos = [fullTodo, ...todos];

		if (!users.some((u) => u.id === author.id)) {
			users = [
				{
					id: author.id,
					email: author.email || '',
					handle: author.handle,
					nickname: author.nickname,
					avatar: author.avatar,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					lastTodoUpdatedAt: new Date().toISOString()
				},
				...users
			];
		}
	}
</script>

<div class="space-y-4 pb-12">
	<!-- 顶部一体化 Header: 紧凑主标题 + 周导航控制器 (响应式左右排布，大幅节省垂直空间) -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
		<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
			What is everyone working on?
		</h1>

		<!-- 周导航与当前周指示器 -->
		<CalendarToolbar
			{weekDates}
			onPrevWeek={handlePrevWeek}
			onNextWeek={handleNextWeek}
			onToday={handleToday}
			onSelectDate={handleSelectDate}
		/>
	</div>

	<!-- Calendar Matrix 主网格容器 -->
	<section>
		<CalendarMatrix
			{weekDates}
			{users}
			{todos}
			currentUserId={userStore.id}
			{isLoading}
			{isLoadingMoreUsers}
			{hasMoreUsers}
			onLoadMoreUsers={() => loadCalendarData(false)}
			onSelectTodo={handleSelectTodo}
			onOpenDayTodos={handleOpenDayTodos}
			onQuickCreate={handleQuickCreate}
		/>
	</section>

	<!-- 底部 6 大分类图例 -->
	<section>
		<CategoryLegend
			{selectedCategory}
			onSelectCategory={(cat) => (selectedCategory = cat)}
		/>
	</section>
</div>

<!-- 待办详情弹窗 -->
<TodoDetailModal
	todo={activeDetailTodo}
	isOpen={isDetailModalOpen}
	onClose={() => (isDetailModalOpen = false)}
	onTodoUpdated={handleTodoUpdated}
	onOpenEdit={(todo) => {
		activeEditTodo = todo;
		isEditModalOpen = true;
	}}
	onRequestEmail={() => (isUserProfileModalOpen = true)}
/>

<!-- 待办编辑弹窗 (顶层独立调度) -->
<EditTodoModal
	todo={activeEditTodo}
	isOpen={isEditModalOpen}
	onClose={() => (isEditModalOpen = false)}
	onUpdated={handleTodoUpdated}
/>

<!-- 单天全部待办弹窗 -->
<DayTodosModal
	isOpen={isDayModalOpen}
	user={dayModalUser}
	dateStr={dayModalDateStr}
	todos={dayModalTodos}
	onClose={() => (isDayModalOpen = false)}
	onSelectTodo={handleSelectTodo}
/>

<!-- 快捷发布弹窗 (受全局 uiStore 驱动) -->
<CreateTodoModal
	isOpen={uiStore.isCreateModalOpen}
	initialDate={uiStore.createInitialDate}
	onClose={() => uiStore.closeCreateTodo()}
	onCreated={handleTodoCreated}
/>

<!-- 个人身份管理弹窗 -->
<UserProfileModal
	isOpen={isUserProfileModalOpen}
	onClose={() => (isUserProfileModalOpen = false)}
/>
