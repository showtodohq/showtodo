import type { Todo, TodoStatus } from '$lib/types/todo';
import type { UserProfile } from '$lib/types/user';
import { isStatusCompletedOrAbandoned } from '$lib/constants/status';

/**
 * 状态排序权重：in_progress 优先，其次 pending，再后 done，最后 abandoned
 */
export const STATUS_SORT_WEIGHT: Record<TodoStatus, number> = {
	in_progress: 0,
	pending: 1,
	done: 2,
	abandoned: 3
};

/**
 * 获取某个日期所在周（周一至周日）的 7 个 Date 数组
 */
export function getWeekDates(baseDate: Date = new Date()): Date[] {
	const current = new Date(baseDate);
	// 将时间重置为 00:00:00，避免时区微小偏移
	current.setHours(0, 0, 0, 0);

	// JS getDay(): 0 是周日, 1 是周一, ..., 6 是周六
	const day = current.getDay();
	// 转换成周一为 0, 周日为 6
	const diffToMonday = day === 0 ? -6 : 1 - day;

	const monday = new Date(current);
	monday.setDate(current.getDate() + diffToMonday);

	const week: Date[] = [];
	for (let i = 0; i < 7; i++) {
		const d = new Date(monday);
		d.setDate(monday.getDate() + i);
		week.push(d);
	}
	return week;
}

/**
 * 格式化为 YYYY-MM-DD 本地字符串
 */
export function formatDateISO(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * 判断两个日期是否为同一天
 */
export function isSameDay(d1: Date, d2: Date): boolean {
	return (
		d1.getFullYear() === d2.getFullYear() &&
		d1.getMonth() === d2.getMonth() &&
		d1.getDate() === d2.getDate()
	);
}

/**
 * 日期增加指定周数
 */
export function addWeeks(date: Date, weeks: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + weeks * 7);
	return result;
}

/**
 * 格式化周导航区间文字，例如 "May 15 – May 21, 2024"
 */
export function formatWeekRangeText(weekDates: Date[]): string {
	if (weekDates.length === 0) return '';
	const start = weekDates[0];
	const end = weekDates[weekDates.length - 1];

	const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
	const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
	const startDay = start.getDate();
	const endDay = end.getDate();
	const startYear = start.getFullYear();
	const endYear = end.getFullYear();

	if (startYear === endYear) {
		if (startMonth === endMonth) {
			return `${startMonth} ${startDay} – ${endDay}, ${startYear}`;
		}
		return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${startYear}`;
	}
	return `${startMonth} ${startDay}, ${startYear} – ${endMonth} ${endDay}, ${endYear}`;
}

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * 格式化表头单天信息
 */
export function formatDayHeader(date: Date) {
	const today = new Date();
	const isToday = isSameDay(date, today);
	const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
	const dayName = WEEKDAY_NAMES[dayIndex];
	const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
	const dayNum = date.getDate();

	return {
		dayName,
		monthShort,
		dayNum,
		dateLabel: `${dayNum}`,
		isToday,
		isoString: formatDateISO(date)
	};
}

/**
 * 单元格内待办卡片排序规则：
 * 1. in_progress (0) > pending (1) > done (2) > abandoned (3)
 * 2. createdAt 升序
 */
export function sortTodosForCell(todos: Todo[]): Todo[] {
	return [...todos].sort((a, b) => {
		const weightA = STATUS_SORT_WEIGHT[a.status] ?? 1;
		const weightB = STATUS_SORT_WEIGHT[b.status] ?? 1;
		if (weightA !== weightB) {
			return weightA - weightB;
		}
		return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
	});
}

/**
 * 用户列表排序规则：
 * 1. 当前用户置顶 (如果存在)
 * 2. 其余用户按 lastTodoUpdatedAt 降序 (活跃创作者在前)
 */
export function sortUsersForCalendar(
	users: UserProfile[],
	currentUserId?: string | null
): UserProfile[] {
	return [...users].sort((a, b) => {
		if (currentUserId) {
			if (a.id === currentUserId) return -1;
			if (b.id === currentUserId) return 1;
		}
		const timeA = a.lastTodoUpdatedAt ? new Date(a.lastTodoUpdatedAt).getTime() : 0;
		const timeB = b.lastTodoUpdatedAt ? new Date(b.lastTodoUpdatedAt).getTime() : 0;
		return timeB - timeA;
	});
}

/**
 * 获取日历单元格待办状态：是否有未完成待办，或已全部完成
 */
export function getCalendarCellBadgeStatus(
	todos: Array<{ status?: string | null }>
): 'HAS_PENDING' | 'ALL_DONE' | 'EMPTY' {
	if (!todos || todos.length === 0) return 'EMPTY';
	const hasPending = todos.some((t) => !isStatusCompletedOrAbandoned(t.status));
	return hasPending ? 'HAS_PENDING' : 'ALL_DONE';
}

