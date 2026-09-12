import { api } from '$lib/services/api';
import { userStore } from '$lib/stores/user.svelte';
import { todoRegistry } from '$lib/stores/entities/todo-registry.svelte';
import { todoMutations } from '$lib/stores/mutations.svelte';
import { formatDateISO, isSameDay } from '$lib/utils/calendar';
import type { Todo, TodoStatus, CategoryId } from '$lib/types/todo';

export interface CalendarDayCell {
	date: Date;
	dateStr: string;
	dayNum: number;
	isCurrentMonth: boolean;
	isToday: boolean;
	todos: Todo[];
}

export function createMyTodosResource() {
	let loading = $state(false);
	let error = $state<string | null>(null);
	let todoIds = $state<string[]>([]);

	// 视图切换状态：'stream' | 'kanban' | 'calendar'
	let activeView = $state<'stream' | 'kanban' | 'calendar'>('stream');

	// 信息流筛选与搜索
	let streamTab = $state<TodoStatus | 'all'>('all');
	let activeCategory = $state<CategoryId | null>(null);
	let searchQuery = $state('');

	// 月日历当前年月 (默认当前本地月份)
	const now = new Date();
	let calendarYear = $state(now.getFullYear());
	let calendarMonth = $state(now.getMonth()); // 0 - 11
	let selectedCalendarDate = $state<string | null>(formatDateISO(now));

	// 派生响应式当前用户待办实体集合
	const todos = $derived.by(() => {
		return todoIds
			.map((id) => todoRegistry.get(id))
			.filter((t): t is Todo => Boolean(t));
	});

	const totalCount = $derived(todos.length);

	const statusCounts = $derived.by(() => {
		const counts: Record<TodoStatus, number> = {
			pending: 0,
			in_progress: 0,
			done: 0,
			abandoned: 0
		};
		for (const t of todos) {
			if (t.status in counts) counts[t.status]++;
		}
		return counts;
	});

	const completionRate = $derived(
		totalCount > 0 ? Math.round(((statusCounts.done || 0) / totalCount) * 100) : 0
	);

	// 全局筛选 (分类 + 搜索过滤) 后的基础待办集
	const baseFilteredTodos = $derived.by(() => {
		let res = todos;
		if (activeCategory) {
			res = res.filter((t) => t.category === activeCategory);
		}
		const query = searchQuery.trim().toLowerCase();
		if (query) {
			res = res.filter(
				(t) =>
					t.content.toLowerCase().includes(query) ||
					(t.note && t.note.toLowerCase().includes(query))
			);
		}
		return res;
	});

	// 信息流视图专用的待办列表（在分类/搜索基础上叠加 status tab）
	const streamFilteredTodos = $derived.by(() => {
		if (streamTab === 'all') {
			return baseFilteredTodos;
		}
		return baseFilteredTodos.filter((t) => t.status === streamTab);
	});

	// 看板 4 列垂直分组
	const kanbanColumns = $derived.by(() => {
		const cols: Record<TodoStatus, Todo[]> = {
			pending: [],
			in_progress: [],
			done: [],
			abandoned: []
		};
		for (const t of baseFilteredTodos) {
			if (t.status in cols) {
				cols[t.status].push(t);
			}
		}
		return cols;
	});

	// 日期分组映射：以本地 YYYY-MM-DD 为键
	const todosByDate = $derived.by(() => {
		const map = new Map<string, Todo[]>();
		for (const t of baseFilteredTodos) {
			const targetDateStr = t.startDate || t.createdAt;
			const localDate = new Date(targetDateStr);
			const key = formatDateISO(localDate);
			const list = map.get(key) || [];
			list.push(t);
			map.set(key, list);
		}
		return map;
	});

	// 月日历动态单元格生成 (按需计算当月实际所需行数，避免固定 42 格导致多出一整行全是下个月的日期)
	const monthCalendarDays = $derived.by((): CalendarDayCell[] => {
		const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1);
		// 当月总天数
		const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
		// 周一为 0，周日为 6
		const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
		const startDay = new Date(calendarYear, calendarMonth, 1 - startDayOfWeek);

		// 计算当月跨越所需的实际周数 (4, 5 或 6 行)
		const totalWeeks = Math.ceil((startDayOfWeek + daysInMonth) / 7);
		const totalCells = totalWeeks * 7;

		const today = new Date();
		const cells: CalendarDayCell[] = [];

		for (let i = 0; i < totalCells; i++) {
			const date = new Date(startDay);
			date.setDate(startDay.getDate() + i);
			const dateStr = formatDateISO(date);
			const isCurrentMonth = date.getMonth() === calendarMonth;
			const isToday = isSameDay(date, today);
			const dayTodos = todosByDate.get(dateStr) || [];

			cells.push({
				date,
				dateStr,
				dayNum: date.getDate(),
				isCurrentMonth,
				isToday,
				todos: dayTodos
			});
		}

		return cells;
	});

	// 当前选中日期的待办列表
	const selectedDateTodos = $derived.by(() => {
		if (!selectedCalendarDate) return [];
		return todosByDate.get(selectedCalendarDate) || [];
	});

	// 日历导航方法
	function prevMonth() {
		if (calendarMonth === 0) {
			calendarMonth = 11;
			calendarYear--;
		} else {
			calendarMonth--;
		}
	}

	function nextMonth() {
		if (calendarMonth === 11) {
			calendarMonth = 0;
			calendarYear++;
		} else {
			calendarMonth++;
		}
	}

	function resetToCurrentMonth() {
		const d = new Date();
		calendarYear = d.getFullYear();
		calendarMonth = d.getMonth();
		selectedCalendarDate = formatDateISO(d);
	}

	function setCalendarMonth(year: number, month: number) {
		calendarYear = year;
		calendarMonth = month;
	}

	function selectCalendarDate(dateStr: string | null) {
		selectedCalendarDate = dateStr;
	}

	// 状态变更动作
	function handleToggle(todo: Todo, nextStatus?: TodoStatus, e?: MouseEvent) {
		todoMutations.toggleStatus(todo.id, nextStatus, e, todo);
	}

	function changeStatus(todoId: string, nextStatus: TodoStatus, e?: MouseEvent) {
		const t = todoRegistry.get(todoId);
		todoMutations.toggleStatus(todoId, nextStatus, e, t);
	}

	function insertTop(id: string) {
		if (!todoIds.includes(id)) {
			todoIds = [id, ...todoIds];
		}
	}

	async function createTodo(data: {
		content: string;
		note?: string | null;
		isNotePublic?: boolean;
		category?: CategoryId | string | null;
	}) {
		const created = await todoMutations.createTodo(data);
		if (created && !todoIds.includes(created.id)) {
			todoIds = [created.id, ...todoIds];
		}
		return created;
	}

	// 测试或预填充辅助
	function setTodoIds(ids: string[]) {
		todoIds = [...ids];
	}

	// 远程拉取数据
	async function load(force = false) {
		const viewerId = userStore.id;
		if (!viewerId) {
			todoIds = [];
			loading = false;
			return;
		}

		loading = true;
		error = null;
		try {
			const fetched: Todo[] = [];
			let cursor: string | undefined;
			do {
				const res = await api.getTodos({
					authorId: viewerId,
					currentUserId: viewerId,
					limit: 100,
					cursor
				});
				fetched.push(...(res.todos || []));
				cursor = res.nextCursor || undefined;
			} while (cursor);

			todoRegistry.upsertMany(fetched);
			todoIds = [...new Set(fetched.map((t) => t.id))];
		} catch (err) {
			console.error('Failed to load my todos:', err);
			error = (err as Error).message || '加载待办失败';
		} finally {
			loading = false;
		}
	}

	return {
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get todos() {
			return todos;
		},
		get totalCount() {
			return totalCount;
		},
		get statusCounts() {
			return statusCounts;
		},
		get completionRate() {
			return completionRate;
		},
		get activeView() {
			return activeView;
		},
		set activeView(v: 'stream' | 'kanban' | 'calendar') {
			activeView = v;
		},
		get streamTab() {
			return streamTab;
		},
		set streamTab(v: TodoStatus | 'all') {
			streamTab = v;
		},
		get activeCategory() {
			return activeCategory;
		},
		set activeCategory(v: CategoryId | null) {
			activeCategory = v;
		},
		get searchQuery() {
			return searchQuery;
		},
		set searchQuery(v: string) {
			searchQuery = v;
		},
		get calendarYear() {
			return calendarYear;
		},
		get calendarMonth() {
			return calendarMonth;
		},
		get selectedCalendarDate() {
			return selectedCalendarDate;
		},
		get kanbanColumns() {
			return kanbanColumns;
		},
		get streamFilteredTodos() {
			return streamFilteredTodos;
		},
		get todosByDate() {
			return todosByDate;
		},
		get monthCalendarDays() {
			return monthCalendarDays;
		},
		get selectedDateTodos() {
			return selectedDateTodos;
		},
		prevMonth,
		nextMonth,
		resetToCurrentMonth,
		setCalendarMonth,
		selectCalendarDate,
		handleToggle,
		changeStatus,
		createTodo,
		insertTop,
		setTodoIds,
		load
	};
}
