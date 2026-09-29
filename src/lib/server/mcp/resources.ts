import type { Database } from '../db';
import * as userService from '../services/user.service';
import * as todoService from '../services/todo.service';
import * as statsService from '../services/stats.service';
import { AppError } from '../errors';

export interface McpResourceDefinition {
	uri?: string;
	uriTemplate?: string;
	name: string;
	mimeType: string;
	description: string;
}

export interface McpResourceResult {
	isError: boolean;
	contents: Array<{
		uri: string;
		mimeType: string;
		text: string;
	}>;
}

export function getResourceDefinitions(): McpResourceDefinition[] {
	return [
		{
			uri: 'showtodo://me/overview',
			name: 'My ShowTodo Overview',
			mimeType: 'application/json',
			description: 'Full personal dashboard of current authenticated user, including active tasks and daily status.'
		},
		{
			uriTemplate: 'showtodo://users/{handle}/todolist',
			name: 'User Public Todolist',
			mimeType: 'text/markdown',
			description: 'Public todo list of a specific user by handle (private notes sanitized).'
		},
		{
			uriTemplate: 'showtodo://topics/{topicHash}',
			name: 'Topic Companions & Details',
			mimeType: 'application/json',
			description: 'Topic details, participant statistics, and latest peer dynamics by topicHash.'
		},
		{
			uri: 'showtodo://stats/summary',
			name: 'ShowTodo Platform Metrics',
			mimeType: 'application/json',
			description: 'Global site statistics, total public todos, active companions, and category distributions.'
		}
	];
}

export async function handleResourceRead(
	db: Database,
	uri: string,
	currentUser: any | null
): Promise<McpResourceResult> {
	try {
		if (uri === 'showtodo://me/overview') {
			if (!currentUser?.id) {
				return {
					isError: true,
					contents: [
						{
							uri,
							mimeType: 'text/plain',
							text: 'Authentication required. Please configure your ShowTodo API Key.'
						}
					]
				};
			}

			const list = await todoService.list(db, {
				authorId: currentUser.id,
				limit: 50
			});

			const payload = {
				user: {
					id: currentUser.id,
					handle: currentUser.handle,
					nickname: currentUser.nickname,
					email: currentUser.email
				},
				todos: list.todos
			};

			return {
				isError: false,
				contents: [
					{
						uri,
						mimeType: 'application/json',
						text: JSON.stringify(payload, null, 2)
					}
				]
			};
		}

		if (uri.startsWith('showtodo://users/') && uri.endsWith('/todolist')) {
			const match = uri.match(/^showtodo:\/\/users\/([^/]+)\/todolist$/);
			if (!match) {
				return {
					isError: true,
					contents: [{ uri, mimeType: 'text/plain', text: 'Invalid URI format for user todolist.' }]
				};
			}

			const handle = match[1];
			const targetUser = await userService.findByHandle(db, handle);
			if (!targetUser) {
				return {
					isError: true,
					contents: [{ uri, mimeType: 'text/plain', text: `User not found: @${handle}` }]
				};
			}

			const list = await todoService.list(db, {
				authorId: targetUser.id,
				currentUserId: currentUser?.id,
				limit: 100
			});

			const isSelf = currentUser?.id === targetUser.id;
			const lines = [
				`# @${targetUser.handle} (${targetUser.nickname})'s Public Todo List`,
				'',
				`> ShowTodo Profile: https://showtodo.com/@${targetUser.handle}`,
				''
			];

			if (list.todos.length === 0) {
				lines.push('*No public todos yet.*');
			} else {
				for (const item of list.todos) {
					const categoryStr = item.category ? `[${item.category}] ` : '';
					const noteStr = item.note ? `\n  - Note: ${item.note}` : '';
					lines.push(`- [${item.status}] ${categoryStr}${item.content}${noteStr}`);
				}
			}

			return {
				isError: false,
				contents: [
					{
						uri,
						mimeType: 'text/markdown',
						text: lines.join('\n')
					}
				]
			};
		}

		if (uri.startsWith('showtodo://topics/')) {
			const topicHash = uri.replace('showtodo://topics/', '').trim();
			if (!topicHash) {
				return {
					isError: true,
					contents: [{ uri, mimeType: 'text/plain', text: 'Invalid topicHash URI.' }]
				};
			}

			const topic = await todoService.getTopicByHash(db, topicHash, currentUser?.id);

			return {
				isError: false,
				contents: [
					{
						uri,
						mimeType: 'application/json',
						text: JSON.stringify(topic, null, 2)
					}
				]
			};
		}

		if (uri === 'showtodo://stats/summary') {
			const stats = await statsService.getSiteOverview(db);
			return {
				isError: false,
				contents: [
					{
						uri,
						mimeType: 'application/json',
						text: JSON.stringify(stats, null, 2)
					}
				]
			};
		}

		return {
			isError: true,
			contents: [{ uri, mimeType: 'text/plain', text: `Resource not found: ${uri}` }]
		};
	} catch (err: any) {
		const message = err instanceof AppError ? err.message : err?.message || 'Failed to read resource';
		return {
			isError: true,
			contents: [{ uri, mimeType: 'text/plain', text: `Error reading resource ${uri}: ${message}` }]
		};
	}
}
