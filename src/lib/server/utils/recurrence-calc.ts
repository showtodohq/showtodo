/**
 * 周期性时间槽位推算与日历展开纯函数
 *
 * 遵循 DDD 原则，纯计算、无外部 I/O 依赖、严格时区感知。
 */

import type { RecurrenceFrequency } from '$lib/constants/recurrence';
import { DEFAULT_TIMEZONE, isValidTimezone, formatDateInTimezone } from './timezone';

export interface RecurrenceScheduleConfig {
	frequency: RecurrenceFrequency;
	interval: number;
	daysOfWeek?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
	dayOfMonth?: number;   // 1..31
	cronExpression?: string;
	timezone: string;
}

export interface VirtualOccurrence {
	ruleId: string;
	slotKey: string;
	content: string;
	topicHash: string;
	category: string | null;
	isVirtual: true;
	startDate: string;
	dueDate: string | null;
}

/**
 * 获取指定日期在指定时区下的纯年月日与星期数值
 */
function getPartsInTimezone(date: Date, tz: string) {
	const validTz = isValidTimezone(tz) ? tz : DEFAULT_TIMEZONE;
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone: validTz,
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		weekday: 'short',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		hour12: false
	});

	const parts = formatter.formatToParts(date);
	const map: Record<string, string> = {};
	for (const p of parts) {
		map[p.type] = p.value;
	}

	const year = Number(map.year);
	const month = Number(map.month); // 1-12
	const day = Number(map.day);     // 1-31
	const hour = Number(map.hour || 0);
	const minute = Number(map.minute || 0);
	const second = Number(map.second || 0);

	// 计算星期几 (0=Sun, 1=Mon, ..., 6=Sat)
	// 使用本地纯数学确定星期几
	const d = new Date(Date.UTC(year, month - 1, day));
	const dayOfWeek = d.getUTCDay();

	return { year, month, day, hour, minute, second, dayOfWeek };
}

/**
 * 纯算法：计算 ISO 8601 周数 (1..53) 与对应 ISO 年份
 */
export function getISOWeekInfo(year: number, month: number, day: number) {
	const target = new Date(Date.UTC(year, month - 1, day));
	// ISO 星期一为第 1 天，星期天为第 7 天
	const dayNr = (target.getUTCDay() + 6) % 7;
	// 将日期调整到该周的周四（周四所在的年份即为 ISO 周年份）
	target.setUTCDate(target.getUTCDate() - dayNr + 3);
	const firstThursday = target.getTime();
	target.setUTCMonth(0, 1);
	if (target.getUTCDay() !== 4) {
		target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
	}
	const weekNumber = 1 + Math.ceil((firstThursday - target.getTime()) / (7 * 86400000));
	const isoYear = new Date(firstThursday).getUTCFullYear();
	const isoDayOfWeek = dayNr + 1; // 1=Mon, ..., 7=Sun

	return { isoYear, weekNumber, isoDayOfWeek };
}

/**
 * 生成物理时间槽位唯一标识（slot_key）
 */
export function formatSlotKey(
	date: Date,
	frequency: RecurrenceFrequency,
	tz: string = DEFAULT_TIMEZONE
): string {
	const safeTz = isValidTimezone(tz) ? tz : DEFAULT_TIMEZONE;
	const { year, month, day } = getPartsInTimezone(date, safeTz);
	const yStr = String(year);
	const mStr = String(month).padStart(2, '0');
	const dStr = String(day).padStart(2, '0');

	switch (frequency) {
		case 'daily':
		case 'weekdays':
			return `${yStr}-${mStr}-${dStr}`;
		case 'weekly': {
			const { isoYear, weekNumber, isoDayOfWeek } = getISOWeekInfo(year, month, day);
			const wStr = String(weekNumber).padStart(2, '0');
			return `${isoYear}-W${wStr}-${isoDayOfWeek}`;
		}
		case 'monthly':
			return `${yStr}-${mStr}`;
		case 'custom_cron':
		default:
			return `${yStr}-${mStr}-${dStr}`;
	}
}

/**
 * 判断当前时间是否在宽限期窗口内
 */
export function isWithinGracePeriod(
	dueDate: Date,
	checkTime: Date = new Date(),
	graceHours: number = 4
): boolean {
	const dueMs = dueDate.getTime();
	const checkMs = checkTime.getTime();
	if (checkMs <= dueMs) return true;
	return checkMs <= dueMs + graceHours * 3600 * 1000;
}

/**
 * 计算指定月份的最大天数（自动处理闰年 2 月 28/29）
 */
export function getDaysInMonth(year: number, month: number): number {
	// month 是 1-12，Date.UTC(year, month, 0) 返回该月最后一天
	return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * 核心：计算下一次周期的执行时间点 (纯函数，时区感知)
 */
export function calculateNextOccurrence(
	currentRun: Date,
	config: RecurrenceScheduleConfig
): Date {
	const { frequency, interval = 1, daysOfWeek = [], dayOfMonth = 1, timezone } = config;
	const safeTz = isValidTimezone(timezone) ? timezone : DEFAULT_TIMEZONE;
	const parts = getPartsInTimezone(currentRun, safeTz);

	switch (frequency) {
		case 'daily': {
			// 直接增加 interval 天
			const nextDate = new Date(currentRun.getTime() + interval * 86400000);
			return nextDate;
		}

		case 'weekdays': {
			// 下一个工作日 (周一至周五)
			let d = new Date(currentRun.getTime() + 86400000);
			while (true) {
				const curParts = getPartsInTimezone(d, safeTz);
				// 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
				if (curParts.dayOfWeek >= 1 && curParts.dayOfWeek <= 5) {
					return d;
				}
				d = new Date(d.getTime() + 86400000);
			}
		}

		case 'weekly': {
			// 在 daysOfWeek 中寻找下一个满足条件的星期
			const sortedDays = Array.isArray(daysOfWeek) && daysOfWeek.length > 0
				? [...new Set(daysOfWeek)].sort((a, b) => a - b)
				: [parts.dayOfWeek];

			// 尝试在未来 1~7 天寻找匹配的星期
			let candidate = new Date(currentRun.getTime() + 86400000);
			for (let step = 1; step <= 7 * Math.max(1, interval); step++) {
				const cParts = getPartsInTimezone(candidate, safeTz);
				if (sortedDays.includes(cParts.dayOfWeek)) {
					return candidate;
				}
				candidate = new Date(candidate.getTime() + 86400000);
			}
			return candidate;
		}

		case 'monthly': {
			// 增加 interval 个月，并对齐 dayOfMonth
			let nextMonth = parts.month + interval;
			let nextYear = parts.year;
			while (nextMonth > 12) {
				nextMonth -= 12;
				nextYear += 1;
			}
			const maxDays = getDaysInMonth(nextYear, nextMonth);
			const targetDay = Math.min(dayOfMonth, maxDays);

			// 保留原本的小时/分钟/秒
			// 转换为 UTC 时间点
			// 先构造目标时区本地 ISO 串，然后求差
			const mStr = String(nextMonth).padStart(2, '0');
			const dStr = String(targetDay).padStart(2, '0');
			const hStr = String(parts.hour).padStart(2, '0');
			const minStr = String(parts.minute).padStart(2, '0');
			const sStr = String(parts.second).padStart(2, '0');

			// 利用 Date.UTC 模拟目标时间
			const approx = new Date(Date.UTC(nextYear, nextMonth - 1, targetDay, parts.hour, parts.minute, parts.second));
			return approx;
		}

		case 'custom_cron':
		default: {
			// 默认步进 24 小时
			return new Date(currentRun.getTime() + interval * 86400000);
		}
	}
}

/**
 * 日历端未来虚拟展开投影纯函数 (Virtual Occurrences Projection)
 * 在内存中将规则列表按时间窗口展开为虚拟占位任务，绝不向数据库写入任何数据
 */
export function expandVirtualOccurrences(
	rules: Array<{
		id: string;
		content: string;
		topicHash: string;
		frequency: RecurrenceFrequency;
		interval: number;
		daysOfWeek?: number[] | null;
		dayOfMonth?: number | null;
		timezone: string;
		nextRunAt: Date;
		category?: string | null;
	}>,
	windowStart: Date,
	windowEnd: Date,
	viewTimezone: string = DEFAULT_TIMEZONE
): VirtualOccurrence[] {
	const results: VirtualOccurrence[] = [];
	const startMs = windowStart.getTime();
	const endMs = windowEnd.getTime();

	for (const rule of rules) {
		let cursor = new Date(rule.nextRunAt.getTime());

		// 若当前游标落后于窗口开始，先推算至窗口内
		let guard = 0;
		while (cursor.getTime() < startMs && guard < 500) {
			cursor = calculateNextOccurrence(cursor, {
				frequency: rule.frequency,
				interval: rule.interval,
				daysOfWeek: rule.daysOfWeek ?? undefined,
				dayOfMonth: rule.dayOfMonth ?? undefined,
				timezone: rule.timezone
			});
			guard++;
		}

		// 在窗口内收集虚拟条目
		guard = 0;
		while (cursor.getTime() <= endMs && guard < 100) {
			const slotKey = formatSlotKey(cursor, rule.frequency, viewTimezone);
			results.push({
				ruleId: rule.id,
				slotKey,
				content: rule.content,
				topicHash: rule.topicHash,
				category: rule.category ?? null,
				isVirtual: true,
				startDate: cursor.toISOString(),
				dueDate: new Date(cursor.getTime() + 86400000 - 1000).toISOString()
			});

			cursor = calculateNextOccurrence(cursor, {
				frequency: rule.frequency,
				interval: rule.interval,
				daysOfWeek: rule.daysOfWeek ?? undefined,
				dayOfMonth: rule.dayOfMonth ?? undefined,
				timezone: rule.timezone
			});
			guard++;
		}
	}

	return results;
}
