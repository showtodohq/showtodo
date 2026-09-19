import { api } from '$lib/services/api';
import { userStore } from '$lib/stores/user.svelte';
import { todoRegistry } from '$lib/stores/entities/todo-registry.svelte';
import { userProfileRegistry } from '$lib/stores/entities/user-registry.svelte';
import { todoMutations } from '$lib/stores/mutations.svelte';
import { formatDateISO, isSameDay } from '$lib/utils/calendar';
import type { Todo, TodoStatus, CategoryId } from '$lib/types/todo';
import type { UserProfile, CurrentUserSession } from '$lib/types/user';

export interface CalendarDayCell {
	date: Date;
	dateStr: string;
	dayNum: number;
	isCurrentMonth: boolean;
	isToday: boolean;
	todos: Todo[];
}

function getInitialWorkbenchData(handle?: string | null): {
	targetUser: UserProfile | CurrentUserSession | null;
	todoIds: string[];
	hasCache: boolean;
} {
	if (!handle) {
		const currentUser = userStore.current;
		const cachedTodoIds = userStore.id ? userProfileRegistry.getUserTodoIds(userStore.id) : undefined;
		if (currentUser && cachedTodoIds !== undefined) {
			return {
				targetUser: currentUser,
				todoIds: cachedTodoIds,
				hasCache: true
			};
		}
		return {
			targetUser: currentUser,
			todoIds: [],
			hasCache: false
		};
	}

	const cachedUser = userProfileRegistry.getProfile(handle);
	const cachedTodoIds = userProfileRegistry.getUserTodoIds(handle);

	if (cachedUser && cachedTodoIds !== undefined) {
		return {
			targetUser: cachedUser,
			todoIds: cachedTodoIds,
			hasCache: true
		};
	}

	if (cachedUser) {
		return {
			targetUser: cachedUser,
			todoIds: cachedTodoIds || [],
			hasCache: Boolean(cachedTodoIds !== undefined)
		};
	}

	if (userStore.isAuthor(handle)) {
		const currentUser = userStore.current;
		const userTodoIds = userStore.id ? userProfileRegistry.getUserTodoIds(userStore.id) : undefined;
		return {
			targetUser: currentUser,
			todoIds: userTodoIds || [],
			hasCache: Boolean(userTodoIds !== undefined)
		};
	}

	return {
		targetUser: null,
		todoIds: [],
		hasCache: false
	};
}

export function createMyTodosResource(initialTargetHandle?: string) {
	const initialData = getInitialWorkbenchData(initialTargetHandle);
	const hasInitialData = initialData.hasCache;

	let loading = $state(!hasInitialData && Boolean(initialTargetHandle || userStore.id));
	let isRevalidating = $state(false);
	let error = $state<string | null>(null);
	let todoIds = $state<string[]>(initialData.todoIds);
	let targetUser = $state<UserProfile | CurrentUserSession | null>(initialData.targetUser);
	let targetHandle = $state<string | null>(initialTargetHandle || null);

	const isMe = $derived.by(() => {
		if (targetUser) {
			return userStore.isAuthor(targetUser.id, targetUser.email, targetUser.handle);
		}
		if (!targetHandle && userStore.id) return true;
		return false;
	});

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
		if (!isMe) return;
		todoMutations.toggleStatus(todo.id, nextStatus, e, todo);
	}

	function changeStatus(todoId: string, nextStatus: TodoStatus, e?: MouseEvent) {
		if (!isMe) return;
		const t = todoRegistry.get(todoId);
		todoMutations.toggleStatus(todoId, nextStatus, e, t);
	}

	function logProgress(todoId: string, nextStatus: TodoStatus, note: string) {
		if (!isMe) return;
		const t = todoRegistry.get(todoId);
		return todoMutations.toggleStatus(todoId, nextStatus, undefined, t, {
			activityNote: note
		});
	}

	function insertTop(id: string) {
		if (!todoIds.includes(id)) {
			todoIds = [id, ...todoIds];
			if (targetUser?.id) {
				userProfileRegistry.setUserTodoIds(targetUser.id, todoIds);
			}
			if (targetHandle) {
				userProfileRegistry.setUserTodoIds(targetHandle, todoIds);
			}
		}
	}

	async function createTodo(data: {
		content: string;
		note?: string | null;
		isNotePublic?: boolean;
		category?: CategoryId | string | null;
	}) {
		if (!isMe) return null;
		const created = await todoMutations.createTodo(data);
		if (created && !todoIds.includes(created.id)) {
			todoIds = [created.id, ...todoIds];
			if (targetUser?.id) {
				userProfileRegistry.setUserTodoIds(targetUser.id, todoIds);
			}
			if (targetHandle) {
				userProfileRegistry.setUserTodoIds(targetHandle, todoIds);
			}
		}
		return created;
	}

	// 测试或预填充辅助
	function setTodoIds(ids: string[]) {
		todoIds = [...ids];
	}

	// 远程拉取数据
	async function load(handleOrForce?: string | boolean) {
		let handleToLoad = targetHandle;
		if (typeof handleOrForce === 'string') {
			handleToLoad = handleOrForce;
			targetHandle = handleOrForce;
		}

		const viewerId = userStore.id;
		const cachedUser = handleToLoad ? userProfileRegistry.getProfile(handleToLoad) : (viewerId ? userStore.current : null);
		const cachedTodoIds = handleToLoad
			? userProfileRegistry.getUserTodoIds(handleToLoad)
			: (viewerId ? userProfileRegistry.getUserTodoIds(viewerId) : undefined);
		const hasValidCache = todoIds.length > 0 || (cachedUser && cachedTodoIds !== undefined);

		if (hasValidCache) {
			loading = false;
			isRevalidating = true;
		} else {
			loading = true;
			isRevalidating = false;
		}
		error = null;

		try {
			let targetAuthorId = viewerId;

			if (handleToLoad) {
				// 1. 若为当前登录用户本人，直接短路复用全局 userStore，0 网络往返
				if (userStore.isAuthor(handleToLoad) && userStore.current) {
					targetUser = userStore.current;
					targetAuthorId = userStore.id;
				} else {
					// 2. 若全局用户注册表已有缓存档案，直接复用已登记的用户 ID，避免重复网络查询
					const cachedProfile = userProfileRegistry.getProfile(handleToLoad);
					if (cachedProfile) {
						targetUser = cachedProfile;
						targetAuthorId = cachedProfile.id;
					} else {
						// 3. 仅在首次冷启动且无缓存时，向后端查询用户 Profile
						try {
							const res = await api.getUserById(
								handleToLoad,
								viewerId ? { currentUserId: viewerId } : undefined
							);
							targetUser = res.user;
							targetAuthorId = res.user.id;
							userProfileRegistry.upsertProfile(res.user);
						} catch (uErr) {
							console.error('Failed to load user profile for todolist:', uErr);
							error = 'User not found';
							todoIds = [];
							targetUser = null;
							return;
						}
					}
				}
			} else {
				if (!viewerId) {
					todoIds = [];
					targetUser = null;
					return;
				}
				targetUser = userStore.current;
			}

			const fetched: Todo[] = [];
			let cursor: string | undefined;
			do {
				const res = await api.getTodos({
					authorId: targetAuthorId,
					currentUserId: viewerId,
					limit: 100,
					cursor
				});
				fetched.push(...(res.todos || []));
				cursor = res.nextCursor || undefined;
			} while (cursor);

			todoRegistry.upsertMany(fetched);
			const uniqueIds = [...new Set(fetched.map((t) => t.id))];
			todoIds = uniqueIds;

			if (targetAuthorId) {
				userProfileRegistry.setUserTodoIds(targetAuthorId, uniqueIds);
			}
			if (handleToLoad) {
				userProfileRegistry.setUserTodoIds(handleToLoad, uniqueIds);
			}
		} catch (err) {
			console.error('Failed to load todos for workbench:', err);
			error = (err as Error).message || 'Failed to load todos';
		} finally {
			loading = false;
			isRevalidating = false;
		}
	}

	return {
		get loading() {
			return loading;
		},
		get isRevalidating() {
			return isRevalidating;
		},
		get error() {
			return error;
		},
		get targetUser() {
			return targetUser;
		},
		get isMe() {
			return isMe;
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
		logProgress,
		createTodo,
		insertTop,
		setTodoIds,
		load
	};
}
