import { AppError } from './errors';

export const VALID_CATEGORIES = ['study', 'fitness', 'finance', 'dev', 'life', 'other'] as const;
export type Category = (typeof VALID_CATEGORIES)[number];

export const VALID_EMOJIS = ['❤️', '👍', '🔥', '💪', '👏', '🚀', '🎉', '👀'] as const;
export type Emoji = (typeof VALID_EMOJIS)[number];

export const VALID_STATUSES = ['pending', 'in_progress', 'done', 'abandoned'] as const;
export type TodoStatus = (typeof VALID_STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<TodoStatus, readonly TodoStatus[]> = {
	pending: ['in_progress', 'done', 'abandoned'],
	in_progress: ['pending', 'done', 'abandoned'],
	done: ['in_progress', 'pending', 'abandoned'],
	abandoned: ['pending', 'in_progress', 'done']
};

export function validateActivityContent(value: unknown): string | null {
	if (value === null || value === undefined) return null;
	if (typeof value !== 'string') {
		throw new AppError('VALIDATION_ERROR', 'activity note must be a string');
	}
	const trimmed = value.trim();
	if (trimmed.length === 0) return null;
	if (trimmed.length > 1000) {
		throw new AppError('VALIDATION_ERROR', 'activity note must be at most 1000 characters');
	}
	return trimmed;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HANDLE_REGEX = /^[a-z0-9][a-z0-9_-]{0,48}[a-z0-9]$|^[a-z0-9]$/;

export function isUUID(value: string | undefined | null): boolean {
	if (!value || typeof value !== 'string') return false;
	return UUID_REGEX.test(value.trim());
}

export function validateEmail(value: unknown): string {
	if (typeof value !== 'string' || !EMAIL_REGEX.test(value.trim())) {
		throw new AppError('VALIDATION_ERROR', 'Invalid email format');
	}
	return value.trim().toLowerCase();
}

/**
 * 将用户输入/邮箱前缀清洗为合法的 URL Handle
 */
export function sanitizeHandle(raw: string): string {
	if (!raw) return 'user';
	let cleaned = raw
		.toLowerCase()
		.trim()
		.replace(/[@.+=_\s]+/g, '-') // 点、加号、下划线、空格等替换为连字符
		.replace(/[^a-z0-9-]/g, '') // 移除非字母数字横线的符号（包括中文和 Emoji）
		.replace(/-+/g, '-') // 连续横线合并
		.replace(/^-+|-+$/g, ''); // 去除首尾横线

	if (!cleaned || cleaned.length === 0) {
		cleaned = 'user';
	}
	return cleaned.slice(0, 30);
}

export function validateHandle(value: unknown): string {
	if (typeof value !== 'string') {
		throw new AppError('VALIDATION_ERROR', 'handle must be a string');
	}
	const handle = value.trim().toLowerCase();
	if (handle.length < 1 || handle.length > 50 || !HANDLE_REGEX.test(handle)) {
		throw new AppError(
			'VALIDATION_ERROR',
			'handle must be 1-50 characters, containing only lowercase letters, numbers, hyphens and underscores'
		);
	}
	return handle;
}

const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateShortId(length = 8): string {
	let res = '';
	for (let i = 0; i < length; i++) {
		const idx = Math.floor(Math.random() * BASE62_CHARS.length);
		res += BASE62_CHARS[idx];
	}
	return res;
}

export function generateRandomSuffix(length = 4): string {
	let res = '';
	const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
	for (let i = 0; i < length; i++) {
		const idx = Math.floor(Math.random() * chars.length);
		res += chars[idx];
	}
	return res;
}

export function validateContent(value: unknown): string {
	if (typeof value !== 'string' || value.trim().length === 0) {
		throw new AppError('VALIDATION_ERROR', 'content is required');
	}
	if (value.trim().length > 1000) {
		throw new AppError('VALIDATION_ERROR', 'content must be at most 1000 characters');
	}
	return value.trim();
}

export function validateNote(value: unknown): string | null {
	if (value === null || value === undefined) return null;
	if (typeof value !== 'string') {
		throw new AppError('VALIDATION_ERROR', 'note must be a string');
	}
	if (value.length > 5000) {
		throw new AppError('VALIDATION_ERROR', 'note must be at most 5000 characters');
	}
	return value;
}

export function validateCategory(value: unknown): Category | null {
	if (value === null || value === undefined) return null;
	if (typeof value !== 'string' || !(VALID_CATEGORIES as readonly string[]).includes(value)) {
		throw new AppError(
			'VALIDATION_ERROR',
			`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
		);
	}
	return value as Category;
}

export function validateEmoji(value: unknown): Emoji {
	if (typeof value !== 'string' || !(VALID_EMOJIS as readonly string[]).includes(value)) {
		throw new AppError(
			'VALIDATION_ERROR',
			`Invalid emoji. Must be one of: ${VALID_EMOJIS.join(', ')}`
		);
	}
	return value as Emoji;
}

export function validateStatus(value: unknown): TodoStatus {
	if (typeof value !== 'string' || !(VALID_STATUSES as readonly string[]).includes(value)) {
		throw new AppError(
			'VALIDATION_ERROR',
			`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
		);
	}
	return value as TodoStatus;
}

export function validateStatusTransition(from: TodoStatus, to: TodoStatus): void {
	const allowed = ALLOWED_TRANSITIONS[from];
	if (!allowed.includes(to)) {
		throw new AppError(
			'INVALID_STATUS_TRANSITION',
			`Cannot transition from '${from}' to '${to}'`
		);
	}
}

export function validateDate(value: unknown): string {
	if (typeof value !== 'string' || !DATE_REGEX.test(value.trim())) {
		throw new AppError('VALIDATION_ERROR', 'Invalid date format. Use YYYY-MM-DD');
	}
	const trimmed = value.trim();
	const parsed = new Date(trimmed + 'T00:00:00Z');
	if (isNaN(parsed.getTime())) {
		throw new AppError('VALIDATION_ERROR', 'Invalid date');
	}
	const [y, m, d] = trimmed.split('-').map(Number);
	if (parsed.getUTCFullYear() !== y || parsed.getUTCMonth() + 1 !== m || parsed.getUTCDate() !== d) {
		throw new AppError('VALIDATION_ERROR', 'Invalid date');
	}
	return trimmed;
}

export function validateOptionalDate(value: unknown): string | null {
	if (value === null || value === undefined) return null;
	return validateDate(value);
}

export function validateDateTime(value: unknown): string {
	if (typeof value !== 'string') {
		throw new AppError('VALIDATION_ERROR', 'Invalid date-time format');
	}
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		throw new AppError('VALIDATION_ERROR', 'Invalid date-time format');
	}

	if (DATE_REGEX.test(trimmed)) {
		validateDate(trimmed);
		return new Date(`${trimmed}T00:00:00.000Z`).toISOString();
	}

	const parsed = new Date(trimmed);
	if (isNaN(parsed.getTime())) {
		throw new AppError('VALIDATION_ERROR', 'Invalid date-time format');
	}
	return parsed.toISOString();
}

export function validateOptionalDateTime(value: unknown): string | null {
	if (value === null || value === undefined) return null;
	return validateDateTime(value);
}

export function validateUUID(value: unknown): string {
	if (typeof value !== 'string' || !UUID_REGEX.test(value)) {
		throw new AppError('VALIDATION_ERROR', 'Invalid UUID format');
	}
	return value;
}

export function validateLimit(value: unknown, max = 1000, defaultVal = 20): number {
	if (value === null || value === undefined) return defaultVal;
	const num = typeof value === 'string' ? parseInt(value, 10) : value;
	if (typeof num !== 'number' || isNaN(num) || num < 1 || num > max) {
		throw new AppError('VALIDATION_ERROR', `limit must be between 1 and ${max}`);
	}
	return num;
}

export function validateBoolean(value: unknown, defaultValue: boolean): boolean {
	if (value === null || value === undefined) return defaultValue;
	if (typeof value === 'boolean') return value;
	if (value === 'true') return true;
	if (value === 'false') return false;
	throw new AppError('VALIDATION_ERROR', 'Invalid boolean value');
}
