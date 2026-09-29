import { describe, test, expect, beforeEach } from 'vitest';
import { testDb, cleanDatabase } from '../../__tests__/setup';
import * as userService from '../../services/user.service';
import * as todoService from '../../services/todo.service';
import { getResourceDefinitions, handleResourceRead } from '../resources';

beforeEach(async () => {
	await cleanDatabase();
});

describe('MCP Resources Handler', () => {
	test('getResourceDefinitions returns all standard resource templates', () => {
		const resources = getResourceDefinitions();
		expect(resources.length).toBeGreaterThanOrEqual(4);
		const uris = resources.map((r) => r.uriTemplate || r.uri);
		expect(uris).toContain('showtodo://me/overview');
		expect(uris).toContain('showtodo://users/{handle}/todolist');
		expect(uris).toContain('showtodo://topics/{topicHash}');
		expect(uris).toContain('showtodo://stats/summary');
	});

	describe('showtodo://me/overview', () => {
		test('fails when unauthenticated', async () => {
			const result = await handleResourceRead(testDb, 'showtodo://me/overview', null);
			expect(result.isError).toBe(true);
			expect(result.contents[0].text).toContain('Authentication required');
		});

		test('returns JSON overview for authenticated user', async () => {
			const user = await userService.findOrCreate(testDb, 'overview-user@example.com');
			await todoService.create(testDb, { authorId: user.id, content: 'Active Task 1' });

			const result = await handleResourceRead(testDb, 'showtodo://me/overview', user);
			expect(result.isError).toBe(false);
			const data = JSON.parse(result.contents[0].text);
			expect(data.user.email).toBe('overview-user@example.com');
			expect(data.todos).toHaveLength(1);
		});
	});

	describe('showtodo://users/{handle}/todolist', () => {
		test('returns public markdown todolist and sanitizes private notes', async () => {
			const user = await userService.findOrCreate(testDb, 'author@example.com');
			await todoService.create(testDb, {
				authorId: user.id,
				content: 'Public task',
				note: 'Secret confidential note',
				isNotePublic: false
			});
			await todoService.create(testDb, {
				authorId: user.id,
				content: 'Another task',
				note: 'Open shared note',
				isNotePublic: true
			});

			const result = await handleResourceRead(testDb, `showtodo://users/${user.handle}/todolist`, null);
			expect(result.isError).toBe(false);
			const text = result.contents[0].text;
			expect(text).toContain('Public task');
			expect(text).not.toContain('Secret confidential note');
			expect(text).toContain('Open shared note');
		});

		test('returns error for non-existent user handle', async () => {
			const result = await handleResourceRead(testDb, 'showtodo://users/nonexistent_person/todolist', null);
			expect(result.isError).toBe(true);
			expect(result.contents[0].text).toContain('User not found');
		});
	});

	describe('showtodo://stats/summary', () => {
		test('returns platform metrics successfully without authentication', async () => {
			const result = await handleResourceRead(testDb, 'showtodo://stats/summary', null);
			expect(result.isError).toBe(false);
			const data = JSON.parse(result.contents[0].text);
			expect(data).toHaveProperty('totalTodos');
		});
	});
});
