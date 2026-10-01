/**
 * 服务端时区领域工具
 *
 * 遵循 DDD 原则，将时区解析、合法性校验、自然日格式化与安全 SQL 表达式构造收敛在此。
 */

export const DEFAULT_TIMEZONE = 'Asia/Shanghai';

/**
 * 校验传入的时区字符串是否为合法且安全的 IANA 时区标识
 * （有效防御 SQL 注入与无效时区导致数据库报错）
 */
export function isValidTimezone(tz?: string | null): boolean {
	if (!tz || typeof tz !== 'string') return false;
	const trimmed = tz.trim();
	if (trimmed.length === 0 || trimmed.length > 50) return false;

	// IANA 时区通常仅包含字母、下划线、斜杠、加减号
	if (!/^[a-zA-Z0-9_\-+]+(?:\/[a-zA-Z0-9_\-+]+)*$/.test(trimmed)) {
		return false;
	}

	try {
		Intl.DateTimeFormat(undefined, { timeZone: trimmed });
		return true;
	} catch {
		return false;
	}
}

/**
 * 解析并归一化请求中的时区（优先 Query 参数，其次 Header，最后安全回退）
 */
export function resolveTimezone(
	paramTz?: string | null,
	headerTz?: string | null,
	fallbackTz: string = DEFAULT_TIMEZONE
): string {
	if (paramTz && isValidTimezone(paramTz)) {
		return paramTz.trim();
	}
	if (headerTz && isValidTimezone(headerTz)) {
		return headerTz.trim();
	}
	return fallbackTz;
}

/**
 * 将任意 Date 对象格式化为指定时区下的 YYYY-MM-DD
 */
export function formatDateInTimezone(date: Date, tz: string = DEFAULT_TIMEZONE): string {
	const validTz = isValidTimezone(tz) ? tz : DEFAULT_TIMEZONE;
	const formatter = new Intl.DateTimeFormat('en-CA', {
		timeZone: validTz,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
	return formatter.format(date);
}

/**
 * 获取指定时区下的今天（YYYY-MM-DD）
 */
export function getTodayInTimezone(tz: string = DEFAULT_TIMEZONE): string {
	return formatDateInTimezone(new Date(), tz);
}

/**
 * 获取以 endDate（在指定时区）为截止日的连续近 N 天的 YYYY-MM-DD 字符串列表（按时间升序）
 * 彻底消除服务端进程所处时区对日期迭代的影响
 */
export function getPastDaysList(
	daysCount: number,
	endDate: Date = new Date(),
	tz: string = DEFAULT_TIMEZONE
): string[] {
	const endDayStr = formatDateInTimezone(endDate, tz);
	const [year, month, day] = endDayStr.split('-').map(Number);

	const result: string[] = [];
	for (let i = daysCount - 1; i >= 0; i--) {
		// 使用纯本地年月日计算，不产生 UTC 转换时差
		const d = new Date(year, month - 1, day - i);
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const dStr = String(d.getDate()).padStart(2, '0');
		result.push(`${y}-${m}-${dStr}`);
	}
	return result;
}

/**
 * 获取指定 Date 在指定时区下的本地时差毫秒数 (local - utc)
 */
function getTimezoneOffsetMs(date: Date, timeZone: string): number {
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		hour12: false
	});
	const parts = formatter.formatToParts(date);
	const map: Record<string, string> = {};
	for (const p of parts) map[p.type] = p.value;
	const h = map.hour === '24' ? 0 : Number(map.hour || 0);
	const asUtc = Date.UTC(
		Number(map.year),
		Number(map.month) - 1,
		Number(map.day),
		h,
		Number(map.minute || 0),
		Number(map.second || 0)
	);
	return asUtc - date.getTime();
}

/**
 * 根据指定时区的年月日时分秒，精确构造对应的绝对 UTC Date 对象
 */
export function createDateInTimezone(
	year: number,
	month: number, // 1-12
	day: number,   // 1-31
	hour = 0,
	minute = 0,
	second = 0,
	tz: string = DEFAULT_TIMEZONE
): Date {
	const validTz = isValidTimezone(tz) ? tz : DEFAULT_TIMEZONE;
	const targetUtcEstimate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
	const offset = getTimezoneOffsetMs(targetUtcEstimate, validTz);
	return new Date(targetUtcEstimate.getTime() - offset);
}
