import { AppError } from './errors';

export const VALID_CATEGORIES = ['study', 'fitness', 'finance', 'dev', 'life', 'other'] as const;
export type Category = (typeof VALID_CATEGORIES)[number];

export const VALID_EMOJIS = ['👀', '🔥', '💪', '👏'] as const;
export type Emoji = (typeof VALID_EMOJIS)[number];

export const VALID_STATUSES = ['pending', 'in_progress', 'done', 'abandoned'] as const;
export type TodoStatus = (typeof VALID_STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<TodoStatus, readonly TodoStatus[]> = {
	pending: ['in_progress', 'done', 'abandoned'],
	in_progress: ['done', 'abandoned'],
	done: [],
	abandoned: []
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function validateEmail(value: unknown): string {
	if (typeof value !== 'string' || !EMAIL_REGEX.test(value.trim())) {
		throw new AppError('VALIDATION_ERROR', 'Invalid email format');
	}
	return value.trim();
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
	if (typeof value !== 'string' || !DATE_REGEX.test(value)) {
		throw new AppError('VALIDATION_ERROR', 'Invalid date format. Use YYYY-MM-DD');
	}
	const parsed = new Date(value + 'T00:00:00Z');
	if (isNaN(parsed.getTime())) {
		throw new AppError('VALIDATION_ERROR', 'Invalid date');
	}
	// Verify the parsed date components match the input to catch things like 2026-02-30
	const [y, m, d] = value.split('-').map(Number);
	if (parsed.getUTCFullYear() !== y || parsed.getUTCMonth() + 1 !== m || parsed.getUTCDate() !== d) {
		throw new AppError('VALIDATION_ERROR', 'Invalid date');
	}
	return value;
}

export function validateOptionalDate(value: unknown): string | null {
	if (value === null || value === undefined) return null;
	return validateDate(value);
}

export function validateUUID(value: unknown): string {
	if (typeof value !== 'string' || !UUID_REGEX.test(value)) {
		throw new AppError('VALIDATION_ERROR', 'Invalid UUID format');
	}
	return value;
}

export function validateLimit(value: unknown): number {
	if (value === null || value === undefined) return 20;
	const num = typeof value === 'string' ? parseInt(value, 10) : value;
	if (typeof num !== 'number' || isNaN(num) || num < 1 || num > 100) {
		throw new AppError('VALIDATION_ERROR', 'limit must be between 1 and 100');
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
