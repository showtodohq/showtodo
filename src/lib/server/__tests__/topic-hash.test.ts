import { describe, test, expect } from 'vitest';
import { normalizeContent, computeTopicHash } from '../topic-hash';

describe('normalizeContent', () => {
	test('trims leading and trailing whitespace', () => {
		expect(normalizeContent('   hello world   ')).toBe('hello world');
	});

	test('converts uppercase letters to lowercase', () => {
		expect(normalizeContent('Learn TypeScript and Svelte 5')).toBe('learn typescript and svelte 5');
	});

	test('collapses multiple whitespace characters and newlines into a single space', () => {
		expect(normalizeContent('Read\n\n\nbook \t\t chapter 1')).toBe('read book chapter 1');
	});

	test('strips trailing punctuation (Chinese and English)', () => {
		expect(normalizeContent('每天早起跑步5公里。')).toBe('每天早起跑步5公里');
		expect(normalizeContent('Read 10 pages today!?!')).toBe('read 10 pages today');
		expect(normalizeContent('写一篇周报...~')).toBe('写一篇周报');
		expect(normalizeContent('背单词，')).toBe('背单词');
	});

	test('handles empty or blank string gracefully', () => {
		expect(normalizeContent('')).toBe('');
		expect(normalizeContent('   ')).toBe('');
	});
});

describe('computeTopicHash', () => {
	test('produces deterministic 16-character hex string', () => {
		const hash1 = computeTopicHash('每天背50个单词');
		const hash2 = computeTopicHash('每天背50个单词');
		expect(hash1).toHaveLength(16);
		expect(hash1).toBe(hash2);
		expect(/^[0-9a-f]{16}$/.test(hash1)).toBe(true);
	});

	test('matches identical content with slight formatting/punctuation differences', () => {
		const hash1 = computeTopicHash('  每天背50个单词。 ');
		const hash2 = computeTopicHash('每天背50个单词');
		const hash3 = computeTopicHash('每天背50个单词！');
		expect(hash1).toBe(hash2);
		expect(hash2).toBe(hash3);
	});

	test('produces same hash for same content regardless of context', () => {
		const hash1 = computeTopicHash('读《原则》');
		const hash2 = computeTopicHash('读《原则》');
		expect(hash1).toBe(hash2);
	});

	test('produces different hash for different content', () => {
		const hash1 = computeTopicHash('晨跑 5 公里');
		const hash2 = computeTopicHash('夜跑 5 公里');
		expect(hash1).not.toBe(hash2);
	});
});
