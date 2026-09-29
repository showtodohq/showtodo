import { describe, test, expect, beforeEach } from 'vitest';
import { testDb, cleanDatabase } from '../../__tests__/setup';
import * as userService from '../../services/user.service';
import * as todoService from '../../services/todo.service';
import { handleToolCall, getToolDefinitions } from '../tools';

beforeEach(async () => {
	await cleanDatabase();
});

describe('MCP Tools Handler', () => {
	test('getToolDefinitions returns all 6 supported tools with valid schemas', () => {
		const tools = getToolDefinitions();
		expect(tools).toHaveLength(6);
		const names = tools.map((t) => t.name);
		expect(names).toEqual(
			expect.arrayContaining([
				'create_todo',
				'list_my_todos',
				'update_todo_status',
				'add_progress_note',
				'discover_topics',
				'react_to_todo'
			])
		);
		for (const tool of tools) {
			expect(tool.description).toBeTruthy();
			expect(tool.inputSchema.type).toBe('object');
		}
	});

	describe('create_todo', () => {
		test('fails with authentication error when currentUser is null', async () => {
			const result = await handleToolCall(testDb, 'create_todo', { content: 'Test todo' }, null);
			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain('Authentication required');
		});

		test('creates a todo when authenticated and returns formatted summary', async () => {
			const user = await userService.findOrCreate(testDb, 'mcp-user@example.com');
			const result = await handleToolCall(
				testDb,
				'create_todo',
				{
					content: 'Build MCP endpoint for AI',
					category: 'dev',
					note: 'Supports Streamable HTTP'
				},
				user
			);

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain('Build MCP endpoint for AI');
			expect(result.content[0].text).toContain('dev');

			const todos = await todoService.list(testDb, { authorId: user.id });
			expect(todos.todos).toHaveLength(1);
			expect(todos.todos[0].content).toBe('Build MCP endpoint for AI');
			expect(todos.todos[0].topicHash).toBeTruthy();
		});

		test('returns validation error on empty content', async () => {
			const user = await userService.findOrCreate(testDb, 'mcp-user@example.com');
			const result = await handleToolCall(testDb, 'create_todo', { content: '   ' }, user);
			expect(result.isError).toBe(true);
			expect(result.content[0].text.toLowerCase()).toContain('content is required');
		});
	});

	describe('list_my_todos', () => {
		test('fails with authentication error when currentUser is null', async () => {
			const result = await handleToolCall(testDb, 'list_my_todos', {}, null);
			expect(result.isError).toBe(true);
		});

		test('returns formatted markdown list of todos for the authenticated user', async () => {
			const user = await userService.findOrCreate(testDb, 'list-user@example.com');
			await todoService.create(testDb, { authorId: user.id, content: 'Todo 1', category: 'fitness' });
			await todoService.create(testDb, { authorId: user.id, content: 'Todo 2', category: 'study' });

			const result = await handleToolCall(testDb, 'list_my_todos', {}, user);
			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain('Todo 1');
			expect(result.content[0].text).toContain('Todo 2');
			expect(result.content[0].text).toContain('[fitness]');
		});
	});

	describe('update_todo_status', () => {
		test('updates status and logs activity note', async () => {
			const user = await userService.findOrCreate(testDb, 'updater@example.com');
			const todo = await todoService.create(testDb, { authorId: user.id, content: 'Ship feature' });

			const result = await handleToolCall(
				testDb,
				'update_todo_status',
				{
					todoId: todo.id,
					status: 'done',
					activityNote: 'Deployed to production!'
				},
				user
			);

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain('done');

			const updated = await todoService.findById(testDb, todo.id);
			expect(updated?.status).toBe('done');
		});

		test('rejects updating a todo belonging to another user', async () => {
			const user1 = await userService.findOrCreate(testDb, 'owner@example.com');
			const user2 = await userService.findOrCreate(testDb, 'attacker@example.com');
			const todo = await todoService.create(testDb, { authorId: user1.id, content: 'Private goal' });

			const result = await handleToolCall(
				testDb,
				'update_todo_status',
				{
					todoId: todo.id,
					status: 'done'
				},
				user2
			);

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain('Forbidden');
		});
	});

	describe('add_progress_note', () => {
		test('appends progress note to existing todo', async () => {
			const user = await userService.findOrCreate(testDb, 'writer@example.com');
			const todo = await todoService.create(testDb, { authorId: user.id, content: 'Write report' });

			const result = await handleToolCall(
				testDb,
				'add_progress_note',
				{
					todoId: todo.id,
					content: 'Phase 1 completed successfully.'
				},
				user
			);

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain('Progress note added');
		});
	});

	describe('discover_topics', () => {
		test('allows public/anonymous access to search topics', async () => {
			const user = await userService.findOrCreate(testDb, 'topic-creator@example.com');
			await todoService.create(testDb, { authorId: user.id, content: 'Morning Run 5km', category: 'fitness' });

			const result = await handleToolCall(testDb, 'discover_topics', { query: 'Run' }, null);
			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain('Morning Run 5km');
		});
	});

	describe('react_to_todo', () => {
		test('allows reacting with valid unicode emoji', async () => {
			const user1 = await userService.findOrCreate(testDb, 'target@example.com');
			const user2 = await userService.findOrCreate(testDb, 'cheerer@example.com');
			const todo = await todoService.create(testDb, { authorId: user1.id, content: 'Big achievement' });

			const result = await handleToolCall(
				testDb,
				'react_to_todo',
				{
					todoId: todo.id,
					emoji: '🔥'
				},
				user2
			);

			expect(result.isError).toBe(false);
			expect(result.content[0].text).toContain('🔥');
		});

		test('rejects non-standard emoji string', async () => {
			const user1 = await userService.findOrCreate(testDb, 'target2@example.com');
			const user2 = await userService.findOrCreate(testDb, 'cheerer2@example.com');
			const todo = await todoService.create(testDb, { authorId: user1.id, content: 'Goal' });

			const result = await handleToolCall(
				testDb,
				'react_to_todo',
				{
					todoId: todo.id,
					emoji: 'fire' // 非法的英文单词，必须是 Unicode 🔥
				},
				user2
			);

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain('Invalid emoji');
		});
	});
});
