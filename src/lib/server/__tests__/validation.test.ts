import { describe, test, expect } from 'vitest';
import {
	validateEmail,
	validateContent,
	validateNote,
	validateCategory,
	validateEmoji,
	validateStatus,
	validateStatusTransition,
	validateDate,
	validateOptionalDate,
	validateUUID,
	validateLimit,
	validateBoolean,
	validateHandle,
	sanitizeHandle,
	generateShortId
} from '../validation';
import { AppError } from '../errors';

describe('validateEmail', () => {
	test('accepts valid email', () => {
		expect(validateEmail('user@example.com')).toBe('user@example.com');
	});

	test('trims whitespace and lowers case', () => {
		expect(validateEmail('  User@Example.COM  ')).toBe('user@example.com');
	});

	test('rejects empty string', () => {
		expect(() => validateEmail('')).toThrow(AppError);
	});

	test('rejects string without @', () => {
		expect(() => validateEmail('userexample.com')).toThrow(AppError);
	});

	test('rejects string without domain', () => {
		expect(() => validateEmail('user@')).toThrow(AppError);
	});

	test('rejects non-string', () => {
		expect(() => validateEmail(123)).toThrow(AppError);
	});

	test('rejects null', () => {
		expect(() => validateEmail(null)).toThrow(AppError);
	});
});

describe('sanitizeHandle & validateHandle', () => {
	test('sanitizes email prefixes and special chars', () => {
		expect(sanitizeHandle('Exc.Dev+Work')).toBe('exc-dev-work');
		expect(sanitizeHandle('User_Name 2026!')).toBe('user-name-2026');
		expect(sanitizeHandle('张三@123')).toBe('123');
		expect(sanitizeHandle('---')).toBe('user');
		expect(sanitizeHandle('')).toBe('user');
	});

	test('validates clean handle', () => {
		expect(validateHandle('exc')).toBe('exc');
		expect(validateHandle('exc-8k2f')).toBe('exc-8k2f');
		expect(validateHandle('user_1')).toBe('user_1');
	});

	test('rejects invalid handles', () => {
		expect(() => validateHandle('')).toThrow(AppError);
		expect(() => validateHandle('-exc')).toThrow(AppError);
		expect(() => validateHandle('exc#1')).toThrow(AppError);
		expect(() => validateHandle('a'.repeat(51))).toThrow(AppError);
	});
});

describe('generateShortId', () => {
	test('generates 8-char url safe string', () => {
		const id1 = generateShortId();
		const id2 = generateShortId();
		expect(id1).toHaveLength(8);
		expect(id2).toHaveLength(8);
		expect(id1).not.toBe(id2);
		expect(/^[a-zA-Z0-9]{8}$/.test(id1)).toBe(true);
	});
});

describe('validateContent', () => {
	test('accepts normal content', () => {
		expect(validateContent('Learn SvelteKit')).toBe('Learn SvelteKit');
	});

	test('trims whitespace', () => {
		expect(validateContent('  hello  ')).toBe('hello');
	});

	test('rejects empty string', () => {
		expect(() => validateContent('')).toThrow(AppError);
	});

	test('rejects whitespace-only string', () => {
		expect(() => validateContent('   ')).toThrow(AppError);
	});

	test('rejects content over 1000 chars', () => {
		expect(() => validateContent('a'.repeat(1001))).toThrow(AppError);
	});

	test('accepts content at exactly 1000 chars', () => {
		const content = 'a'.repeat(1000);
		expect(validateContent(content)).toBe(content);
	});

	test('rejects non-string', () => {
		expect(() => validateContent(123)).toThrow(AppError);
	});
});

describe('validateNote', () => {
	test('accepts null', () => {
		expect(validateNote(null)).toBeNull();
	});

	test('accepts undefined', () => {
		expect(validateNote(undefined)).toBeNull();
	});

	test('accepts normal text', () => {
		expect(validateNote('some note')).toBe('some note');
	});

	test('rejects note over 5000 chars', () => {
		expect(() => validateNote('a'.repeat(5001))).toThrow(AppError);
	});

	test('accepts note at exactly 5000 chars', () => {
		const note = 'a'.repeat(5000);
		expect(validateNote(note)).toBe(note);
	});

	test('rejects non-string non-null', () => {
		expect(() => validateNote(123)).toThrow(AppError);
	});
});

describe('validateCategory', () => {
	test('accepts null', () => {
		expect(validateCategory(null)).toBeNull();
	});

	test('accepts undefined', () => {
		expect(validateCategory(undefined)).toBeNull();
	});

	test.each(['study', 'fitness', 'finance', 'dev', 'life', 'other'] as const)(
		'accepts valid category: %s',
		(cat) => {
			expect(validateCategory(cat)).toBe(cat);
		}
	);

	test('rejects invalid category', () => {
		expect(() => validateCategory('invalid')).toThrow(AppError);
	});
});

describe('validateEmoji', () => {
	test.each(['👀', '🔥', '💪', '👏'] as const)('accepts valid emoji: %s', (emoji) => {
		expect(validateEmoji(emoji)).toBe(emoji);
	});

	test('rejects invalid emoji', () => {
		expect(() => validateEmoji('😀')).toThrow(AppError);
	});

	test('rejects text', () => {
		expect(() => validateEmoji('fire')).toThrow(AppError);
	});
});

describe('validateStatus', () => {
	test.each(['pending', 'in_progress', 'done', 'abandoned'] as const)(
		'accepts valid status: %s',
		(s) => {
			expect(validateStatus(s)).toBe(s);
		}
	);

	test('rejects invalid status', () => {
		expect(() => validateStatus('invalid')).toThrow(AppError);
	});
});

describe('validateStatusTransition', () => {
	test('allows pending → in_progress', () => {
		expect(() => validateStatusTransition('pending', 'in_progress')).not.toThrow();
	});

	test('allows pending → done', () => {
		expect(() => validateStatusTransition('pending', 'done')).not.toThrow();
	});

	test('allows pending → abandoned', () => {
		expect(() => validateStatusTransition('pending', 'abandoned')).not.toThrow();
	});

	test('allows in_progress → done', () => {
		expect(() => validateStatusTransition('in_progress', 'done')).not.toThrow();
	});

	test('allows in_progress → abandoned', () => {
		expect(() => validateStatusTransition('in_progress', 'abandoned')).not.toThrow();
	});

	test('rejects done → pending', () => {
		expect(() => validateStatusTransition('done', 'pending')).toThrow(AppError);
	});

	test('rejects done → in_progress', () => {
		expect(() => validateStatusTransition('done', 'in_progress')).toThrow(AppError);
	});

	test('rejects abandoned → pending', () => {
		expect(() => validateStatusTransition('abandoned', 'pending')).toThrow(AppError);
	});

	test('rejects in_progress → pending', () => {
		expect(() => validateStatusTransition('in_progress', 'pending')).toThrow(AppError);
	});

	test('rejects done → abandoned', () => {
		expect(() => validateStatusTransition('done', 'abandoned')).toThrow(AppError);
	});

	test('rejects abandoned → in_progress', () => {
		expect(() => validateStatusTransition('abandoned', 'in_progress')).toThrow(AppError);
	});
});

describe('validateDate', () => {
	test('accepts valid date', () => {
		expect(validateDate('2026-08-25')).toBe('2026-08-25');
	});

	test('rejects invalid format (slashes)', () => {
		expect(() => validateDate('2026/08/25')).toThrow(AppError);
	});

	test('rejects datetime format', () => {
		expect(() => validateDate('2026-08-25T10:00:00')).toThrow(AppError);
	});

	test('rejects invalid date values (month 13)', () => {
		expect(() => validateDate('2026-13-01')).toThrow(AppError);
	});

	test('rejects invalid date values (Feb 30)', () => {
		expect(() => validateDate('2026-02-30')).toThrow(AppError);
	});
});

describe('validateOptionalDate', () => {
	test('accepts null', () => {
		expect(validateOptionalDate(null)).toBeNull();
	});

	test('accepts undefined', () => {
		expect(validateOptionalDate(undefined)).toBeNull();
	});

	test('validates non-null value', () => {
		expect(validateOptionalDate('2026-08-25')).toBe('2026-08-25');
	});
});

describe('validateUUID', () => {
	test('accepts valid uuid', () => {
		expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(
			'550e8400-e29b-41d4-a716-446655440000'
		);
	});

	test('rejects short string', () => {
		expect(() => validateUUID('abc')).toThrow(AppError);
	});

	test('rejects empty string', () => {
		expect(() => validateUUID('')).toThrow(AppError);
	});
});

describe('validateLimit', () => {
	test('returns default 20 for undefined', () => {
		expect(validateLimit(undefined)).toBe(20);
	});

	test('returns default 20 for null', () => {
		expect(validateLimit(null)).toBe(20);
	});

	test('accepts 1', () => {
		expect(validateLimit(1)).toBe(1);
	});

	test('accepts 100', () => {
		expect(validateLimit(100)).toBe(100);
	});

	test('accepts string number', () => {
		expect(validateLimit('50')).toBe(50);
	});

	test('rejects 0', () => {
		expect(() => validateLimit(0)).toThrow(AppError);
	});

	test('rejects 101', () => {
		expect(() => validateLimit(101)).toThrow(AppError);
	});

	test('rejects non-number string', () => {
		expect(() => validateLimit('abc')).toThrow(AppError);
	});
});

describe('validateBoolean', () => {
	test('returns default for undefined', () => {
		expect(validateBoolean(undefined, true)).toBe(true);
		expect(validateBoolean(undefined, false)).toBe(false);
	});

	test('accepts boolean true', () => {
		expect(validateBoolean(true, false)).toBe(true);
	});

	test('accepts boolean false', () => {
		expect(validateBoolean(false, true)).toBe(false);
	});

	test('accepts string "true"', () => {
		expect(validateBoolean('true', false)).toBe(true);
	});

	test('accepts string "false"', () => {
		expect(validateBoolean('false', true)).toBe(false);
	});

	test('rejects invalid value', () => {
		expect(() => validateBoolean('yes', true)).toThrow(AppError);
	});
});
