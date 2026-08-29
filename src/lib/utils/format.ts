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

	if (diffSec < 60) return '刚刚';
	const diffMin = Math.floor(diffSec / 60);
	if (diffMin < 60) return `${diffMin}分钟前`;
	const diffHours = Math.floor(diffMin / 60);
	if (diffHours < 24) return `${diffHours}小时前`;
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 7) return `${diffDays}天前`;

	return formatDate(d);
}

/**
 * 字符串安全截断
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
	if (!text || text.length <= maxLength) return text;
	return text.slice(0, maxLength) + suffix;
}
