/**
 * 格式化 ISO 日期为本地可读格式 (如 2026-08-29)
 */
export function formatDate(dateInput: string | Date | number): string {
	const d = new Date(dateInput);
	if (isNaN(d.getTime())) return '';
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

/**
 * 格式化为相对时间 (如 "刚刚", "5分钟前", "2小时前", "昨天")
 */
export function formatRelativeTime(dateInput: string | Date | number): string {
	const d = new Date(dateInput);
	if (isNaN(d.getTime())) return '';
	const now = Date.now();
	const diffMs = now - d.getTime();
	const diffSec = Math.floor(diffMs / 1000);

	if (diffSec < 60) return 'just now';
	const diffMin = Math.floor(diffSec / 60);
	if (diffMin < 60) return `${diffMin}m ago`;
	const diffHours = Math.floor(diffMin / 60);
	if (diffHours < 24) return `${diffHours}h ago`;
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 7) return `${diffDays}d ago`;

	return formatDate(d);
}

/**
 * 格式化短日期 (如 09-01)
 */
export function formatShortDate(dateInput: string | Date | number): string {
	const d = new Date(dateInput);
	if (isNaN(d.getTime())) return '';
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${m}-${day}`;
}

/**
 * 格式化排期范围 (如 "09-01 ~ 09-03", "Due 09-03", "09-01")
 */
export function formatScheduleRange(startDate?: string | null, dueDate?: string | null): string | null {
	const s = startDate ? formatShortDate(startDate) : null;
	const d = dueDate ? formatShortDate(dueDate) : null;

	if (s && d) {
		if (s === d) return `${s}`;
		return `${s} ~ ${d}`;
	}
	if (d) return `Due ${d}`;
	if (s) return `${s}`;
	return null;
}

/**
 * 字符串安全截断
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
	if (!text || text.length <= maxLength) return text;
	return text.slice(0, maxLength) + suffix;
}

/**
 * 获取 YYYY-MM-DD 格式的今天（或指定日期）字符串
 */
export function getTodayString(date: Date = new Date()): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/**
 * 跨浏览器安全解析日期为本地 Date 对象 (避免 YYYY-MM-DD 字符串被直接 new Date 解析为 UTC 导致的跨日偏差)
 */
export function parseLocalDate(dateInput: Date | string | number = new Date()): Date {
	if (dateInput instanceof Date) {
		return new Date(dateInput.getTime());
	}
	if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
		const [year, month, day] = dateInput.trim().split('-').map(Number);
		return new Date(year, month - 1, day);
	}
	return new Date(dateInput);
}

/**
 * 将用户本地自然日（00:00:00.000 ~ 23:59:59.999），精确转换为后端数据库所需要的 UTC 绝对时间戳范围
 */
export function getLocalDayAsUtcRange(dateInput: Date | string | number = new Date()): {
	startDateFrom: string;
	startDateTo: string;
} {
	const d = parseLocalDate(dateInput);

	const y = d.getFullYear();
	const m = d.getMonth();
	const day = d.getDate();

	const localStart = new Date(y, m, day, 0, 0, 0, 0);
	const localEnd = new Date(y, m, day, 23, 59, 59, 999);

	return {
		startDateFrom: localStart.toISOString(),
		startDateTo: localEnd.toISOString()
	};
}

export interface MarkdownLinkPart {
	text: string;
	href?: string;
}

/**
 * 将包含 Markdown 链接 (如 [Title](https://...)) 的纯文本解析为结构化文本与链接片段数组
 */
export function parseMarkdownLinks(text: string): MarkdownLinkPart[] {
	if (!text) return [];

	const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
	const parts: MarkdownLinkPart[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(text)) !== null) {
		if (match.index > lastIndex) {
			parts.push({ text: text.slice(lastIndex, match.index) });
		}
		parts.push({ text: match[1], href: match[2] });
		lastIndex = regex.lastIndex;
	}

	if (lastIndex < text.length) {
		parts.push({ text: text.slice(lastIndex) });
	}

	return parts.length > 0 ? parts : [{ text }];
}

